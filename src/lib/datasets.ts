import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Os formatos abaixo são provisórios: serão ajustados quando as fontes (SESAP-RN, SUAF etc.)
// informarem o formato real dos dados.

export type TipoColuna = "texto" | "numero" | "data" | "opcao";

export interface ColunaTemplate {
  id: string;
  rotulo: string;
  tipo: TipoColuna;
  obrigatoria?: boolean;
  opcoes?: string[];
}

export interface TemplateDataset {
  id: string;
  titulo: string;
  descricao: string;
  colunas: ColunaTemplate[];
}

export const TEMPLATES: TemplateDataset[] = [
  {
    id: "desabastecimento",
    titulo: "Desabastecimento (componente especializado)",
    descricao: "Situação de abastecimento de medicamentos por região de saúde.",
    colunas: [
      { id: "medicamento", rotulo: "Medicamento", tipo: "texto", obrigatoria: true },
      { id: "principio_ativo", rotulo: "Princípio ativo", tipo: "texto" },
      { id: "regiao_saude", rotulo: "Região de saúde", tipo: "texto" },
      { id: "componente", rotulo: "Componente", tipo: "opcao", opcoes: ["Básico", "Estratégico", "Especializado"] },
      { id: "situacao", rotulo: "Situação", tipo: "opcao", obrigatoria: true, opcoes: ["Em falta", "Estoque baixo", "Regular"] },
      { id: "data_referencia", rotulo: "Data de referência", tipo: "data", obrigatoria: true },
      { id: "observacao", rotulo: "Observação", tipo: "texto" },
    ],
  },
  {
    id: "pregoes",
    titulo: "Pregões e compras",
    descricao: "Acompanhamento de pregões, usado como justificativa de faltas.",
    colunas: [
      { id: "numero_pregao", rotulo: "Nº do pregão", tipo: "texto", obrigatoria: true },
      { id: "item", rotulo: "Item", tipo: "texto", obrigatoria: true },
      { id: "situacao", rotulo: "Situação", tipo: "texto" },
      { id: "preco_registrado", rotulo: "Preço registrado (R$)", tipo: "numero" },
      { id: "preco_cmed", rotulo: "Preço CMED (R$)", tipo: "numero" },
      { id: "quantidade", rotulo: "Quantidade", tipo: "numero" },
      { id: "data", rotulo: "Data", tipo: "data" },
    ],
  },
  {
    id: "custos",
    titulo: "Custos da assistência farmacêutica",
    descricao: "Série histórica anual por componente ou linha de cuidado.",
    colunas: [
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true },
      { id: "categoria", rotulo: "Componente ou linha de cuidado", tipo: "texto", obrigatoria: true },
      { id: "valor_total", rotulo: "Valor total (R$)", tipo: "numero", obrigatoria: true },
    ],
  },
  {
    id: "judicializacao",
    titulo: "Judicialização (processos concluídos por ano)",
    descricao: "Número anual de processos de saúde concluídos, a partir de fonte pública.",
    colunas: [
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true },
      { id: "processos_concluidos", rotulo: "Processos concluídos", tipo: "numero", obrigatoria: true },
    ],
  },
  {
    id: "producao_cientifica",
    titulo: "Produção científica",
    descricao: "Artigos, dissertações e produtos técnicos do projeto.",
    colunas: [
      { id: "titulo", rotulo: "Título", tipo: "texto", obrigatoria: true },
      { id: "tipo", rotulo: "Tipo", tipo: "opcao", obrigatoria: true, opcoes: ["Artigo", "Dissertação", "TCC", "Produto técnico", "Capítulo de livro"] },
      { id: "autores", rotulo: "Autores", tipo: "texto", obrigatoria: true },
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true },
      { id: "link", rotulo: "Link", tipo: "texto" },
    ],
  },
];

export function getTemplate(id: string): TemplateDataset | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export type Linha = Record<string, string | number | null>;

export interface ErroLinha {
  linha: number; // número da linha na planilha (cabeçalho = 1)
  mensagem: string;
}

export interface ResultadoLeitura {
  linhas: Linha[];
  erros: ErroLinha[];
  colunasAusentes: string[];
  colunasIgnoradas: string[];
}

const MAX_LINHAS = 5000;

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function paraISO(valor: unknown): string | null {
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  const s = String(valor ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function paraNumero(valor: unknown): number | null {
  if (typeof valor === "number" && isFinite(valor)) return valor;
  let s = String(valor ?? "").trim().replace(/R\$\s?/i, "");
  if (!s) return null;
  // 1.234,56 (pt-BR) -> 1234.56
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

async function lerMatriz(arquivo: File): Promise<unknown[][]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".xlsx")) {
    return (await readSheet(arquivo)) as unknown[][];
  }
  if (nome.endsWith(".csv")) {
    const texto = await arquivo.text();
    const r = Papa.parse<string[]>(texto, { skipEmptyLines: true });
    return r.data;
  }
  throw new Error("Formato não suportado. Envie um arquivo .csv ou .xlsx.");
}

export async function lerArquivo(arquivo: File, template: TemplateDataset): Promise<ResultadoLeitura> {
  const matriz = await lerMatriz(arquivo);
  if (matriz.length < 2) throw new Error("O arquivo precisa ter um cabeçalho e ao menos uma linha de dados.");
  if (matriz.length - 1 > MAX_LINHAS) throw new Error(`O arquivo tem mais de ${MAX_LINHAS} linhas.`);

  const cabecalho = matriz[0].map((c) => normalizar(String(c ?? "")));
  const idxPorColuna = new Map<string, number>();
  for (const col of template.colunas) {
    const idx = cabecalho.indexOf(col.id);
    if (idx >= 0) idxPorColuna.set(col.id, idx);
  }
  const colunasAusentes = template.colunas.filter((c) => c.obrigatoria && !idxPorColuna.has(c.id)).map((c) => c.id);
  const conhecidas = new Set(template.colunas.map((c) => c.id));
  const colunasIgnoradas = cabecalho.filter((c) => c && !conhecidas.has(c));

  const linhas: Linha[] = [];
  const erros: ErroLinha[] = [];
  if (colunasAusentes.length) return { linhas, erros, colunasAusentes, colunasIgnoradas };

  for (let i = 1; i < matriz.length; i++) {
    const bruta = matriz[i];
    if (bruta.every((c) => String(c ?? "").trim() === "")) continue;
    const linha: Linha = {};
    const problemas: string[] = [];
    for (const col of template.colunas) {
      const idx = idxPorColuna.get(col.id);
      const valor = idx === undefined ? undefined : bruta[idx];
      const vazio = valor === undefined || valor === null || String(valor).trim() === "";
      if (vazio) {
        if (col.obrigatoria) problemas.push(`"${col.rotulo}" é obrigatório`);
        linha[col.id] = null;
        continue;
      }
      if (col.tipo === "numero") {
        const n = paraNumero(valor);
        if (n === null) problemas.push(`"${col.rotulo}" não é um número`);
        linha[col.id] = n;
      } else if (col.tipo === "data") {
        const d = paraISO(valor);
        if (d === null) problemas.push(`"${col.rotulo}" deve estar em AAAA-MM-DD ou DD/MM/AAAA`);
        linha[col.id] = d;
      } else if (col.tipo === "opcao") {
        const texto = String(valor).trim();
        const opcao = col.opcoes?.find((o) => normalizar(o) === normalizar(texto));
        if (!opcao) problemas.push(`"${col.rotulo}" deve ser um de: ${col.opcoes?.join(", ")}`);
        linha[col.id] = opcao ?? texto;
      } else {
        linha[col.id] = String(valor).trim();
      }
    }
    if (problemas.length) erros.push({ linha: i + 1, mensagem: problemas.join("; ") });
    else linhas.push(linha);
  }
  return { linhas, erros, colunasAusentes, colunasIgnoradas };
}

// --- Publicação e leitura (Firestore) ---
// datasets/{templateId}                -> metadados e versão atual
// datasets/{templateId}/chunks/{v}_{i} -> linhas da versão v, em blocos

const TAMANHO_BLOCO = 400;

export interface MetadadosDataset {
  templateId: string;
  versao: number;
  fonte: string;
  urlFonte: string;
  periodo: string;
  metodo: "planilha" | "api";
  totalLinhas: number;
  blocos: number;
  atualizadoEm: string; // ISO
  publicadoPor: string;
}

export interface DadosPublicacao {
  fonte: string;
  urlFonte: string;
  periodo: string;
}

export async function publicarDataset(
  template: TemplateDataset,
  linhas: Linha[],
  info: DadosPublicacao,
  usuarioEmail: string
): Promise<MetadadosDataset> {
  const ref = doc(db, "datasets", template.id);
  const atual = await getDoc(ref);
  const versaoAnterior = atual.exists() ? (atual.data() as MetadadosDataset).versao : 0;
  const blocosAnteriores = atual.exists() ? (atual.data() as MetadadosDataset).blocos : 0;
  const versao = versaoAnterior + 1;

  const blocos = Math.max(1, Math.ceil(linhas.length / TAMANHO_BLOCO));
  for (let i = 0; i < blocos; i++) {
    const lote = writeBatch(db);
    lote.set(doc(db, "datasets", template.id, "chunks", `${versao}_${i}`), {
      versao,
      indice: i,
      linhas: linhas.slice(i * TAMANHO_BLOCO, (i + 1) * TAMANHO_BLOCO),
    });
    await lote.commit();
  }

  const meta: MetadadosDataset = {
    templateId: template.id,
    versao,
    fonte: info.fonte.trim(),
    urlFonte: info.urlFonte.trim(),
    periodo: info.periodo.trim(),
    metodo: "planilha",
    totalLinhas: linhas.length,
    blocos,
    atualizadoEm: new Date().toISOString(),
    publicadoPor: usuarioEmail,
  };
  // O documento principal só muda depois de todos os blocos estarem gravados.
  await setDoc(ref, meta);

  // Remove os blocos da versão anterior (falha aqui não afeta a publicação).
  try {
    if (blocosAnteriores > 0) {
      const lote = writeBatch(db);
      for (let i = 0; i < blocosAnteriores; i++) {
        lote.delete(doc(db, "datasets", template.id, "chunks", `${versaoAnterior}_${i}`));
      }
      await lote.commit();
    }
  } catch (e) {
    console.warn("Não foi possível limpar blocos antigos:", e);
  }
  return meta;
}

export async function lerDataset(templateId: string): Promise<{ meta: MetadadosDataset; linhas: Linha[] } | null> {
  const snap = await getDoc(doc(db, "datasets", templateId));
  if (!snap.exists()) return null;
  const meta = snap.data() as MetadadosDataset;
  const blocos = await getDocs(
    query(collection(db, "datasets", templateId, "chunks"), where("versao", "==", meta.versao))
  );
  const ordenados = blocos.docs.map((d) => d.data() as { indice: number; linhas: Linha[] }).sort((a, b) => a.indice - b.indice);
  return { meta, linhas: ordenados.flatMap((b) => b.linhas) };
}

export async function ehAdministrador(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const snap = await getDoc(doc(db, "admins", email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
}
