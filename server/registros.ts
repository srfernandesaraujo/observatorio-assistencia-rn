import Papa from "papaparse";
import { normalizar } from "../src/lib/texto.ts";

// Medicamentos registrados no Brasil (Anvisa), lidos do portal de dados abertos.
// O arquivo (cerca de 46 MB, Latin-1/Windows-1252, separado por ponto e vírgula) é lido pelo servidor, aos poucos para não
// travar as outras requisições, e fica em memória. Dicionário de dados: "Produtos Registrados no Brasil - Medicamento" (Anvisa).
export const URL_REGISTROS = "https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv";
const VALIDADE_MS = 24 * 60 * 60 * 1000; // a Anvisa atualiza o arquivo uma vez por mês
const MIN_LINHAS = 50_000; // linhas do arquivo; abaixo disso ele é considerado inválido e a tabela anterior é mantida
const MIN_REGISTROS = 10_000;
const BLOCO = 1 << 20; // caracteres por bloco de leitura
export const MAX_RESULTADOS_REGISTROS = 60;

export interface RegistroMedicamento {
  nome: string;
  principioAtivo: string;
  empresa: string;
  cnpj: string;
  registro: string;
  categoria: string;
  classe: string;
  situacao: "Ativo" | "Inativo" | "Parcial"; // Parcial: o mesmo registro tem linhas ativas e inativas no arquivo
  linhas: number; // linhas do arquivo para este registro
  linhasAtivas: number;
  vencimento: string; // MM/AAAA, como informado pela Anvisa
  concessao: string; // DD/MM/AAAA: data em que o registro foi concedido
}

// Uma linha por registro: o arquivo da Anvisa repete o mesmo registro em várias linhas, que só diferem na situação.
interface Linha extends RegistroMedicamento {
  busca: string; // texto normalizado, com "_" antes de cada palavra
  nomeNorm: string;
  principioNorm: string;
}

interface Tabela {
  linhas: Linha[];
  linhasNoArquivo: number;
  situacoes: { ativo: number; parcial: number; inativo: number };
  atualizadoEm: string | null; // data de modificação do arquivo na Anvisa
  lidoEm: string;
}

const texto = (v: unknown) => String(v ?? "").trim();

// A fonte traz alguns valores de categoria truncados ou com acento perdido; unifica só os casos conhecidos.
function categoria(v: string): string {
  const n = normalizar(v);
  if (!n) return "";
  if (n.startsWith("fitoter")) return "Fitoterápico";
  if (n === "dinamizado") return "Dinamizado";
  if (n === "baixo_risco") return "Baixo risco";
  if (n.startsWith("produto_de_t")) return "Produto de terapia avançada";
  if (n.startsWith("gases_medici")) return "Gases medicinais";
  return v;
}

// "112017" -> "11/2017"; formato inesperado é mantido como veio
function vencimento(v: string): string {
  const m = v.match(/^(0[1-9]|1[0-2])(\d{4})$/);
  return m ? `${m[1]}/${m[2]}` : v;
}

async function baixar(): Promise<Tabela> {
  const resp = await fetch(URL_REGISTROS, { signal: AbortSignal.timeout(120_000) });
  if (!resp.ok) throw new Error(`A Anvisa respondeu ${resp.status}`);
  const modificado = resp.headers.get("last-modified");
  const conteudo = new TextDecoder("windows-1252").decode(await resp.arrayBuffer());

  const porRegistro = new Map<string, Linha>();
  let linhasNoArquivo = 0;
  let faltando = false;
  const leitor = Papa.parse(Papa.NODE_STREAM_INPUT, { header: true, delimiter: ";", skipEmptyLines: true });
  const fim = new Promise<void>((ok, erro) => {
    leitor.on("data", (d: Record<string, string>) => {
      if (faltando) return;
      if (!("NOME_PRODUTO" in d) || !("NUMERO_REGISTRO_PRODUTO" in d) || !("SITUACAO_REGISTRO" in d)) {
        faltando = true;
        return;
      }
      linhasNoArquivo++;
      const nome = texto(d.NOME_PRODUTO);
      const registro = texto(d.NUMERO_REGISTRO_PRODUTO);
      if (!nome || !/^\d+$/.test(registro)) return; // sem número de registro válido não dá para identificar o produto
      const ativa = texto(d.SITUACAO_REGISTRO) === "Ativo";
      const existente = porRegistro.get(registro);
      if (existente) {
        existente.linhas++;
        if (ativa) existente.linhasAtivas++;
        return;
      }
      const bruta = texto(d.EMPRESA_DETENTORA_REGISTRO); // "CNPJ - Razão social"
      const corte = bruta.indexOf(" - ");
      const cnpj = corte > 0 ? bruta.slice(0, corte).trim() : "";
      const empresa = corte > 0 ? bruta.slice(corte + 3).trim() : bruta;
      const principioAtivo = texto(d.PRINCIPIO_ATIVO);
      const classe = texto(d.CLASSE_TERAPEUTICA);
      porRegistro.set(registro, {
        nome,
        principioAtivo,
        empresa,
        cnpj,
        registro,
        categoria: categoria(texto(d.CATEGORIA_REGULATORIA)),
        classe,
        situacao: "Inativo",
        linhas: 1,
        linhasAtivas: ativa ? 1 : 0,
        vencimento: vencimento(texto(d.DATA_VENCIMENTO_REGISTRO)),
        concessao: texto(d.DATA_FINALIZACAO_PROCESSO),
        busca: "_" + normalizar(`${nome} ${principioAtivo} ${empresa} ${cnpj} ${registro} ${classe}`),
        nomeNorm: "_" + normalizar(nome),
        principioNorm: "_" + normalizar(principioAtivo),
      });
    });
    leitor.on("end", () => ok());
    leitor.on("error", erro);
  });
  // Entrega o texto em blocos, devolvendo o controle ao servidor entre eles.
  for (let i = 0; i < conteudo.length; i += BLOCO) {
    leitor.write(conteudo.slice(i, i + BLOCO));
    await new Promise((r) => setImmediate(r));
  }
  leitor.end();
  await fim;

  if (faltando) throw new Error("O formato do arquivo de registros da Anvisa mudou (colunas ausentes)");
  if (linhasNoArquivo < MIN_LINHAS || porRegistro.size < MIN_REGISTROS) {
    throw new Error(`O arquivo de registros da Anvisa veio incompleto (${linhasNoArquivo} linhas, ${porRegistro.size} registros)`);
  }
  const linhas = [...porRegistro.values()];
  const situacoes = { ativo: 0, parcial: 0, inativo: 0 };
  for (const l of linhas) {
    l.situacao = l.linhasAtivas === 0 ? "Inativo" : l.linhasAtivas === l.linhas ? "Ativo" : "Parcial";
    if (l.situacao === "Ativo") situacoes.ativo++;
    else if (l.situacao === "Parcial") situacoes.parcial++;
    else situacoes.inativo++;
  }
  return {
    linhas,
    linhasNoArquivo,
    situacoes,
    atualizadoEm: modificado && !isNaN(Date.parse(modificado)) ? new Date(modificado).toISOString() : null,
    lidoEm: new Date().toISOString(),
  };
}

let tabela: Tabela | null = null;
let emAndamento: Promise<Tabela> | null = null;

// Devolve a tabela em memória; relê quando vence. Se a releitura falhar, mantém a tabela anterior.
export async function obterRegistros(): Promise<Tabela> {
  const vencida = !tabela || Date.now() - Date.parse(tabela.lidoEm) > VALIDADE_MS;
  if (!vencida && tabela) return tabela;
  if (!emAndamento) {
    emAndamento = baixar()
      .then((t) => (tabela = t))
      .catch((e) => {
        if (tabela) {
          console.warn("[Registros] releitura falhou, mantendo a tabela anterior:", e.message);
          return tabela;
        }
        throw e;
      })
      .finally(() => {
        emAndamento = null;
      });
  }
  return emAndamento;
}

export interface RespostaRegistros {
  atualizadoEm: string | null;
  lidoEm: string;
  total: number; // registros distintos do arquivo inteiro
  linhasNoArquivo: number;
  situacoes: { ativo: number; parcial: number; inativo: number };
  encontrados: number;
  resultados: RegistroMedicamento[];
}

// Todas as palavras precisam começar uma palavra do nome, do princípio ativo, da empresa, do CNPJ, do registro ou da classe.
export async function buscarRegistros(consulta: string, situacao = "", categoriaFiltro = ""): Promise<RespostaRegistros> {
  const t = await obterRegistros();
  const palavras = normalizar(consulta).split("_").filter(Boolean);
  const situacaoNorm = normalizar(situacao);
  const categoriaNorm = normalizar(categoriaFiltro);
  const achados: { l: Linha; pontos: number }[] = [];
  for (const l of t.linhas) {
    if (situacaoNorm && normalizar(l.situacao) !== situacaoNorm) continue;
    if (categoriaNorm && normalizar(l.categoria) !== categoriaNorm) continue;
    if (!palavras.every((p) => l.busca.includes("_" + p))) continue;
    let pontos = 0;
    for (const p of palavras) {
      if (l.nomeNorm.startsWith("_" + p)) pontos += 3;
      else if (l.principioNorm.includes("_" + p)) pontos += 2;
      else pontos += 1;
    }
    achados.push({ l, pontos });
  }
  // Mais relevantes primeiro; entre iguais, registros ativos antes e depois por nome.
  achados.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      Number(b.l.situacao === "Ativo") - Number(a.l.situacao === "Ativo") ||
      a.l.nome.localeCompare(b.l.nome, "pt-BR")
  );
  const resultados = achados.slice(0, MAX_RESULTADOS_REGISTROS).map(({ l }) => {
    const { busca, nomeNorm, principioNorm, ...publico } = l;
    return publico;
  });
  return { atualizadoEm: t.atualizadoEm, lidoEm: t.lidoEm, total: t.linhas.length, linhasNoArquivo: t.linhasNoArquivo, situacoes: t.situacoes, encontrados: achados.length, resultados };
}
