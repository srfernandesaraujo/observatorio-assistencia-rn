import firebaseConfig from "../firebase-applet-config.json";
import { TEMPLATES } from "../src/lib/templates";
import { PROGRAMAS_GOVERNAMENTAIS } from "../src/content/programas";

// Lê os conjuntos de dados publicados (leitura pública do Firestore, via REST) para ancorar o assistente de IA.

const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents`;
const CACHE_MS = 5 * 60 * 1000;
const MAX_LINHAS_POR_CONJUNTO = 150;

type ValorFirestore = Record<string, any>;

function decodificar(v: ValorFirestore): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decodificar);
  if ("mapValue" in v) return decodificarCampos(v.mapValue.fields ?? {});
  return null;
}

export function decodificarCampos(campos: Record<string, ValorFirestore>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, decodificar(v)]));
}

async function obter(caminho: string): Promise<any | null> {
  const r = await fetch(`${BASE}/${caminho}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore ${r.status}`);
  return r.json();
}

interface ConjuntoLido {
  id: string;
  titulo: string;
  meta: Record<string, any> | null;
  linhas: Record<string, unknown>[];
}

async function lerConjunto(id: string, titulo: string): Promise<ConjuntoLido> {
  const doc = await obter(`datasets/${id}`);
  if (!doc) return { id, titulo, meta: null, linhas: [] };
  const meta = decodificarCampos(doc.fields ?? {});
  const lista = await obter(`datasets/${id}/chunks?pageSize=50`);
  const blocos = (lista?.documents ?? [])
    .map((d: any) => decodificarCampos(d.fields ?? {}))
    .filter((b: any) => b.versao === meta.versao)
    .sort((a: any, b: any) => a.indice - b.indice);
  return { id, titulo, meta, linhas: blocos.flatMap((b: any) => b.linhas ?? []) };
}

let cache: { em: number; texto: string } | null = null;

// Texto com todos os dados publicados, no formato usado no prompt do assistente.
export async function contextoDosDados(): Promise<string> {
  if (cache && Date.now() - cache.em < CACHE_MS) return cache.texto;

  const conjuntos = await Promise.all(TEMPLATES.map((t) => lerConjunto(t.id, t.titulo).catch(() => ({ id: t.id, titulo: t.titulo, meta: null, linhas: [] } as ConjuntoLido))));
  const partes = conjuntos.map((c) => {
    if (!c.meta || c.linhas.length === 0) return `### ${c.titulo}\nSem dados publicados.`;
    const excedente = c.linhas.length > MAX_LINHAS_POR_CONJUNTO ? ` (mostrando ${MAX_LINHAS_POR_CONJUNTO} de ${c.linhas.length} linhas)` : "";
    return [
      `### ${c.titulo}`,
      `Fonte: ${c.meta.fonte} | Período: ${c.meta.periodo || "não informado"} | Atualizado em: ${String(c.meta.atualizadoEm).slice(0, 10)}${excedente}`,
      JSON.stringify(c.linhas.slice(0, MAX_LINHAS_POR_CONJUNTO)),
    ].join("\n");
  });

  const programas = PROGRAMAS_GOVERNAMENTAIS.map(
    (p) => `- ${p.nome} (${p.esfera}): ${p.resumo} Onde: ${p.ondeObter} Como acessar: ${p.comoAcessar.join("; ")}. Fonte: ${p.fonte.rotulo} (${p.fonte.url})`
  ).join("\n");

  const texto = [`## DADOS PUBLICADOS NO OBSERVATÓRIO`, ...partes, `\n## PROGRAMAS GOVERNAMENTAIS (informativo)`, programas].join("\n\n");
  cache = { em: Date.now(), texto };
  return texto;
}
