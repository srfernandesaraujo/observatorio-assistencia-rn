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
import { type TemplateDataset } from "./templates";
import { normalizar } from "./texto";

export * from "./templates";

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

// municipios: nomes oficiais do IBGE, usados para validar colunas do tipo "municipio" (se vazio, não valida).
export async function lerArquivo(arquivo: File, template: TemplateDataset, municipios: string[] = []): Promise<ResultadoLeitura> {
  const nomesMunicipio = new Map(municipios.map((m) => [normalizar(m), m]));
  const matriz = await lerMatriz(arquivo);
  if (matriz.length < 2) throw new Error("O arquivo precisa ter um cabeçalho e ao menos uma linha de dados.");
  if (matriz.length - 1 > MAX_LINHAS) throw new Error(`O arquivo tem mais de ${MAX_LINHAS} linhas.`);

  const cabecalho = matriz[0].map((c) => normalizar(String(c ?? "")));
  const idxPorColuna = new Map<string, number>();
  for (const col of template.colunas) {
    // Aceita o identificador (data_referencia) ou o rótulo (Data de referência) no cabeçalho.
    let idx = cabecalho.indexOf(col.id);
    if (idx < 0) idx = cabecalho.indexOf(normalizar(col.rotulo));
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
      } else if (col.tipo === "municipio") {
        const texto = String(valor).trim();
        const oficial = nomesMunicipio.get(normalizar(texto));
        if (nomesMunicipio.size > 0 && !oficial) problemas.push(`Município "${texto}" não reconhecido (use o nome oficial do IBGE, da lista da planilha)`);
        linha[col.id] = oficial ?? texto;
      } else if (col.tipo === "opcao") {
        const texto = String(valor).trim();
        const opcao = col.opcoes?.find((o) => normalizar(o) === normalizar(texto));
        if (!opcao) problemas.push(`"${col.rotulo}" deve ser um de: ${col.opcoes?.join(", ")}`);
        linha[col.id] = opcao ?? texto;
      } else {
        const texto = String(valor).trim();
        // Campos de endereço só aceitam http(s): o link é exibido publicamente.
        if (/^link/.test(col.id) && !/^https?:\/\//i.test(texto)) problemas.push(`"${col.rotulo}" deve começar com http:// ou https://`);
        linha[col.id] = texto;
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

// Metadados (sem as linhas) de um conjunto publicado, com cache curto na sessão para páginas que listam vários conjuntos.
export async function lerMetadados(templateId: string): Promise<MetadadosDataset | null> {
  const chave = `meta-${templateId}`;
  try {
    const guardado = sessionStorage.getItem(chave);
    if (guardado) {
      const { em, meta } = JSON.parse(guardado) as { em: number; meta: MetadadosDataset | null };
      if (Date.now() - em < 10 * 60 * 1000) return meta;
    }
  } catch {
    // sem cache
  }
  const snap = await getDoc(doc(db, "datasets", templateId));
  const meta = snap.exists() ? (snap.data() as MetadadosDataset) : null;
  try {
    sessionStorage.setItem(chave, JSON.stringify({ em: Date.now(), meta }));
  } catch {
    // ignora
  }
  return meta;
}
