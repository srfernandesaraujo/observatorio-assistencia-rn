import { PROGRAMAS_GOVERNAMENTAIS } from "../content/programas";
import { GLOSSARIO } from "../content/metodologia";
import { ETAPAS } from "../content/comoUsar";
import { lerDataset, type Linha } from "./datasets";
import { normalizar } from "./texto";

// Onde o resultado leva: uma área do site (aba) e, quando houver, a seção de Indicadores.
export interface Rota {
  aba: "inicio" | "principal" | "producao";
  sub?: string;
}

export interface EntradaBusca {
  id: string;
  titulo: string;
  trecho: string;
  grupo: string; // rótulo mostrado ao lado do resultado
  rota: Rota;
  link?: string; // fonte externa, quando o dado tem uma
  texto: string; // texto normalizado onde a busca procura
  tituloNorm: string;
}

function entrada(e: Omit<EntradaBusca, "texto" | "tituloNorm"> & { extra?: string }): EntradaBusca {
  const { extra, ...resto } = e;
  return { ...resto, tituloNorm: normalizar(e.titulo), texto: normalizar(`${e.titulo} ${e.trecho} ${e.grupo} ${extra ?? ""}`) };
}

// Seções do site, com palavras que as pessoas costumam usar para procurá-las.
const SECOES: { titulo: string; trecho: string; rota: Rota; palavras: string }[] = [
  { titulo: "Início", trecho: "Página inicial, por tipo de público.", rota: { aba: "inicio" }, palavras: "home apresentacao observatorio" },
  { titulo: "Visão geral dos indicadores", trecho: "Resumo dos indicadores e estado dos dados.", rota: { aba: "principal", sub: "visao_geral" }, palavras: "painel resumo" },
  { titulo: "Comparador territorial", trecho: "Compare municípios e regiões de saúde do RN.", rota: { aba: "principal", sub: "comparador" }, palavras: "municipio cidade regiao populacao ibge" },
  { titulo: "Desabastecimento e pregões", trecho: "Medicamentos em falta e acompanhamento de compras.", rota: { aba: "principal", sub: "desabastecimento" }, palavras: "falta estoque compra licitacao pregao cesap" },
  { titulo: "Alertas sanitários", trecho: "Recolhimentos, suspensões e proibições da Anvisa.", rota: { aba: "principal", sub: "alertas" }, palavras: "anvisa recolhimento lote seguranca" },
  { titulo: "Preços de medicamentos (CMED)", trecho: "Consulta do preço máximo de medicamentos, da tabela da CMED/Anvisa.", rota: { aba: "principal", sub: "cmed" }, palavras: "cmed preco pf pmc teto valor medicamento custo tabela anvisa" },
  { titulo: "Registros de medicamentos (Anvisa)", trecho: "Consulta de medicamentos com registro na Anvisa: empresa, categoria, situação e vencimento do registro.", rota: { aba: "principal", sub: "registros" }, palavras: "registro anvisa numero registro empresa detentora cnpj vencimento situacao generico similar fabricante laboratorio" },
  { titulo: "Custos e orçamento", trecho: "Gasto anual por componente da assistência farmacêutica.", rota: { aba: "principal", sub: "custos" }, palavras: "gasto dinheiro financiamento valor" },
  { titulo: "Judicialização", trecho: "Processos de saúde concluídos por ano.", rota: { aba: "principal", sub: "judicializacao" }, palavras: "justica processo judicial cnj" },
  { titulo: "Qualidade dos serviços", trecho: "Instrumentos de qualidade da SUAF (em elaboração).", rota: { aba: "principal", sub: "qualidade" }, palavras: "suaf acreditacao" },
  { titulo: "Avaliação de tecnologias em saúde (ATS)", trecho: "Análises de ATS (em elaboração).", rota: { aba: "principal", sub: "ats_farmacovigilancia" }, palavras: "ats incorporacao conitec" },
  { titulo: "Dados abertos", trecho: "Baixe em CSV ou JSON os conjuntos de dados publicados pelo Observatório.", rota: { aba: "principal", sub: "dados_abertos" }, palavras: "baixar download csv json planilha arquivo reutilizar api" },
  { titulo: "Programas Governamentais", trecho: "Como obter medicamentos pelo SUS e programas do governo.", rota: { aba: "principal", sub: "programas" }, palavras: "sus acesso obter remedio" },
  { titulo: "Educação e Repositório", trecho: "Documentos oficiais, protocolos e materiais educativos.", rota: { aba: "principal", sub: "repositorio" }, palavras: "documento pcdt protocolo legislacao nota tecnica" },
  { titulo: "Relatório de impacto", trecho: "Relatório de impacto (em elaboração).", rota: { aba: "principal", sub: "relatorio_impacto" }, palavras: "impacto resultado" },
  { titulo: "Como usar", trecho: "Passo a passo do site, com as telas, a lista de conferência e as dúvidas frequentes.", rota: { aba: "principal", sub: "como_usar" }, palavras: "ajuda tutorial guia passo a passo manual como funciona usar instrucoes" },
  { titulo: "Metodologia e glossário", trecho: "De onde vêm os dados, como são tratados e o significado dos termos.", rota: { aba: "principal", sub: "metodologia" }, palavras: "fonte metodologia glossario termos significado sigla como funciona" },
  { titulo: "Produção Científica", trecho: "Artigos, dissertações e produtos técnicos do projeto.", rota: { aba: "producao" }, palavras: "artigo dissertacao tcc pesquisa" },
];

export function indiceEstatico(): EntradaBusca[] {
  const secoes = SECOES.map((s) =>
    entrada({ id: `secao-${s.titulo}`, titulo: s.titulo, trecho: s.trecho, grupo: "Seção do site", rota: s.rota, extra: s.palavras })
  );
  const programas = PROGRAMAS_GOVERNAMENTAIS.map((p) =>
    entrada({
      id: `programa-${p.id}`,
      titulo: p.nome,
      trecho: p.resumo,
      grupo: "Programa governamental",
      rota: { aba: "principal", sub: "programas" },
      extra: `${p.ondeObter} ${p.comoAcessar.join(" ")} ${p.esfera}`,
    })
  );
  const glossario = GLOSSARIO.map((t, i) =>
    entrada({ id: `termo-${i}`, titulo: t.termo, trecho: t.definicao, grupo: "Glossário", rota: { aba: "principal", sub: "metodologia" } })
  );
  const guia = ETAPAS.map((e, i) =>
    entrada({ id: `guia-${e.id}`, titulo: e.titulo, trecho: e.intro, grupo: "Como usar", rota: { aba: "principal", sub: "como_usar" }, extra: `etapa ${i + 1} ${e.passos.join(" ")}` })
  );
  return [...secoes, ...programas, ...glossario, ...guia];
}

const s = (v: unknown) => String(v ?? "").trim();
const semLink = (v: unknown) => (/^https?:\/\//i.test(s(v)) ? s(v) : undefined);
function dataBR(iso: unknown): string {
  const m = s(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// Conjuntos publicados que entram na busca e como cada linha vira um resultado.
const CONJUNTOS: { id: string; grupo: string; rota: Rota; montar: (l: Linha, i: number) => Omit<EntradaBusca, "texto" | "tituloNorm" | "grupo" | "rota"> & { extra?: string } }[] = [
  {
    id: "repositorio_documentos",
    grupo: "Documento do repositório",
    rota: { aba: "principal", sub: "repositorio" },
    montar: (l, i) => ({ id: `doc-${i}`, titulo: s(l.titulo), trecho: [s(l.tipo), s(l.orgao), s(l.resumo)].filter(Boolean).join(" · "), link: semLink(l.link) }),
  },
  {
    id: "alertas_sanitarios",
    grupo: "Alerta sanitário",
    rota: { aba: "principal", sub: "alertas" },
    montar: (l, i) => ({
      id: `alerta-${i}`,
      titulo: s(l.produto),
      trecho: [dataBR(l.data), s(l.tipo), s(l.motivo)].filter(Boolean).join(" · "),
      link: semLink(l.link),
      extra: `${s(l.empresa)} ${s(l.lotes)}`,
    }),
  },
  {
    id: "desabastecimento",
    grupo: "Desabastecimento",
    rota: { aba: "principal", sub: "desabastecimento" },
    montar: (l, i) => ({
      id: `falta-${i}`,
      titulo: s(l.medicamento),
      trecho: [s(l.situacao), s(l.regiao_saude), dataBR(l.data_referencia), s(l.observacao)].filter(Boolean).join(" · "),
      extra: `${s(l.principio_ativo)} ${s(l.componente)}`,
    }),
  },
  {
    id: "pregoes",
    grupo: "Pregão",
    rota: { aba: "principal", sub: "desabastecimento" },
    montar: (l, i) => ({
      id: `pregao-${i}`,
      titulo: s(l.item),
      trecho: [`Pregão ${s(l.numero_pregao)}`, s(l.situacao), dataBR(l.data)].filter(Boolean).join(" · "),
    }),
  },
  {
    id: "producao_cientifica",
    grupo: "Produção científica",
    rota: { aba: "producao" },
    montar: (l, i) => ({ id: `prod-${i}`, titulo: s(l.titulo), trecho: [s(l.tipo), s(l.autores), s(l.ano)].filter(Boolean).join(" · "), link: semLink(l.link) }),
  },
];

let cacheDinamico: Promise<EntradaBusca[]> | null = null;

// Lê os conjuntos publicados uma vez por visita; um conjunto sem dados ou com falha de leitura simplesmente não entra.
export function indiceDinamico(): Promise<EntradaBusca[]> {
  if (!cacheDinamico) {
    cacheDinamico = Promise.all(
      CONJUNTOS.map(async (c) => {
        try {
          const r = await lerDataset(c.id);
          if (!r) return [];
          return r.linhas
            .map((l, i) => c.montar(l, i))
            .filter((e) => e.titulo)
            .map((e) => entrada({ ...e, grupo: c.grupo, rota: c.rota }));
        } catch {
          return [];
        }
      })
    ).then((listas) => listas.flat());
  }
  return cacheDinamico;
}

export const MAX_RESULTADOS = 40;

// Todas as palavras digitadas precisam aparecer (sem diferenciar acentos nem maiúsculas); título pesa mais.
export function buscar(indice: EntradaBusca[], consulta: string): EntradaBusca[] {
  const palavras = normalizar(consulta).split("_").filter((p) => p.length > 0);
  if (palavras.length === 0) return [];
  const pontuados: { e: EntradaBusca; pontos: number }[] = [];
  for (const e of indice) {
    if (!palavras.every((p) => e.texto.includes(p))) continue;
    let pontos = 0;
    for (const p of palavras) {
      if (e.tituloNorm.startsWith(p) || e.tituloNorm.includes(`_${p}`)) pontos += 3;
      else if (e.tituloNorm.includes(p)) pontos += 2;
      else pontos += 1;
    }
    pontuados.push({ e, pontos });
  }
  return pontuados.sort((a, b) => b.pontos - a.pontos).map((x) => x.e);
}
