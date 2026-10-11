import Papa from "papaparse";
import { normalizar } from "../src/lib/texto.ts";

// Tabela de preços da CMED (Anvisa), lida do portal de dados abertos.
// O arquivo é lido pelo servidor (o portal não permite leitura direta do navegador) e fica em memória.
export const URL_CMED = "https://dados.anvisa.gov.br/dados/TA_PRECO_MEDICAMENTO.csv";
const VALIDADE_MS = 12 * 60 * 60 * 1000; // relê o arquivo no máximo a cada 12 h
const MIN_LINHAS = 5000; // abaixo disso o arquivo é considerado inválido e a tabela anterior é mantida
export const MAX_RESULTADOS_CMED = 60;

export interface PrecoCmed {
  produto: string;
  substancia: string;
  apresentacao: string;
  laboratorio: string;
  registro: string;
  classe: string;
  tipo: string;
  regime: string;
  tarja: string;
  restricaoHospitalar: string;
  cap: string;
  confaz87: string;
  icms0: string;
  pfSemImpostos: number | null;
  pf0: number | null;
  pmcSemImpostos: number | null;
  pmc0: number | null;
}

interface Linha extends PrecoCmed {
  busca: string; // texto normalizado, com "_" antes de cada palavra
  produtoNorm: string;
  substanciaNorm: string;
}

interface Tabela {
  linhas: Linha[];
  atualizadoEm: string | null; // data de modificação do arquivo na Anvisa
  lidoEm: string;
}

// Colunas do arquivo, pelo nome normalizado do cabeçalho (resiste a mudanças de acento e espaços).
const COLUNAS = {
  produto: "produto",
  substancia: "substancia",
  apresentacao: "apresentacao",
  laboratorio: "laboratorio",
  registro: "registro",
  ean: "ean_1",
  classe: "classe_terapeutica",
  tipo: "tipo_de_produto_status_do_produto",
  regime: "regime_de_preco",
  tarja: "tarja",
  restricaoHospitalar: "restricao_hospitalar",
  cap: "cap",
  confaz87: "confaz_87",
  icms0: "icms_0",
  pfSemImpostos: "pf_sem_impostos",
  pf0: "pf_0",
  pmcSemImpostos: "pmc_sem_impostos",
  pmc0: "pmc_0",
} as const;
const OBRIGATORIAS: (keyof typeof COLUNAS)[] = ["produto", "substancia", "apresentacao", "pf0", "pmc0"];

const texto = (v: unknown) => {
  const s = String(v ?? "").trim();
  return /^-?$/.test(s) ? "" : s;
};
// "1.234,56" -> 1234.56; vazio, "-" ou texto -> null
function preco(v: unknown): number | null {
  const s = texto(v).replace(/\*/g, "").trim();
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return isFinite(n) ? n : null;
}

async function baixar(): Promise<Tabela> {
  const resp = await fetch(URL_CMED, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`A Anvisa respondeu ${resp.status}`);
  const conteudo = new TextDecoder("utf-8").decode(await resp.arrayBuffer()).replace(/^﻿/, "");
  const modificado = resp.headers.get("last-modified");

  const linhas: Linha[] = [];
  let indices: Record<string, string> | null = null; // chave interna -> nome real da coluna
  let faltando: string[] = [];
  Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    // step lê linha a linha e não guarda o arquivo inteiro duas vezes na memória
    step: (r) => {
      if (!indices) {
        const porNorm = new Map((r.meta.fields ?? []).map((f) => [normalizar(f), f]));
        indices = {};
        for (const [chave, norm] of Object.entries(COLUNAS)) {
          const real = porNorm.get(norm);
          if (real) indices[chave] = real;
        }
        faltando = OBRIGATORIAS.filter((c) => !indices![c]);
      }
      if (faltando.length) return;
      const d = (c: keyof typeof COLUNAS) => (indices![c] ? r.data[indices![c]] : "");
      const produto = texto(d("produto"));
      if (!produto) return;
      const substancia = texto(d("substancia"));
      const apresentacao = texto(d("apresentacao"));
      const laboratorio = texto(d("laboratorio"));
      const registro = texto(d("registro"));
      linhas.push({
        produto,
        substancia,
        apresentacao,
        laboratorio,
        registro,
        classe: texto(d("classe")),
        tipo: texto(d("tipo")),
        regime: texto(d("regime")),
        tarja: texto(d("tarja")),
        restricaoHospitalar: texto(d("restricaoHospitalar")),
        cap: texto(d("cap")),
        confaz87: texto(d("confaz87")),
        icms0: texto(d("icms0")),
        pfSemImpostos: preco(d("pfSemImpostos")),
        pf0: preco(d("pf0")),
        pmcSemImpostos: preco(d("pmcSemImpostos")),
        pmc0: preco(d("pmc0")),
        busca: "_" + normalizar(`${produto} ${substancia} ${laboratorio} ${apresentacao} ${registro} ${texto(d("ean"))}`),
        produtoNorm: "_" + normalizar(produto),
        substanciaNorm: "_" + normalizar(substancia),
      });
    },
  });
  if (faltando.length) throw new Error(`O formato do arquivo da Anvisa mudou (colunas ausentes: ${faltando.join(", ")})`);
  if (linhas.length < MIN_LINHAS) throw new Error(`O arquivo da Anvisa veio incompleto (${linhas.length} linhas)`);
  return {
    linhas,
    atualizadoEm: modificado && !isNaN(Date.parse(modificado)) ? new Date(modificado).toISOString() : null,
    lidoEm: new Date().toISOString(),
  };
}

let tabela: Tabela | null = null;
let emAndamento: Promise<Tabela> | null = null;

// Devolve a tabela em memória; relê quando vence. Se a releitura falhar, mantém a tabela anterior.
export async function obterTabela(): Promise<Tabela> {
  const vencida = !tabela || Date.now() - Date.parse(tabela.lidoEm) > VALIDADE_MS;
  if (!vencida && tabela) return tabela;
  if (!emAndamento) {
    emAndamento = baixar()
      .then((t) => (tabela = t))
      .catch((e) => {
        if (tabela) {
          console.warn("[CMED] releitura falhou, mantendo a tabela anterior:", e.message);
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

export interface RespostaCmed {
  atualizadoEm: string | null;
  lidoEm: string;
  total: number; // linhas da tabela inteira
  encontrados: number;
  resultados: PrecoCmed[];
}

// Todas as palavras precisam começar uma palavra do produto, da substância, do laboratório, da apresentação, do registro ou do EAN.
export async function buscarCmed(consulta: string, tipo = ""): Promise<RespostaCmed> {
  const t = await obterTabela();
  const palavras = normalizar(consulta).split("_").filter(Boolean);
  const tipoNorm = normalizar(tipo);
  const achados: { l: Linha; pontos: number }[] = [];
  for (const l of t.linhas) {
    if (tipoNorm && normalizar(l.tipo) !== tipoNorm) continue;
    if (!palavras.every((p) => l.busca.includes("_" + p))) continue;
    let pontos = 0;
    for (const p of palavras) {
      if (l.produtoNorm.startsWith("_" + p)) pontos += 3;
      else if (l.substanciaNorm.startsWith("_" + p)) pontos += 2;
      else pontos += 1;
    }
    achados.push({ l, pontos });
  }
  achados.sort((a, b) => b.pontos - a.pontos || a.l.produto.localeCompare(b.l.produto, "pt-BR") || (a.l.pf0 ?? Infinity) - (b.l.pf0 ?? Infinity));
  const resultados = achados.slice(0, MAX_RESULTADOS_CMED).map(({ l }) => {
    const { busca, produtoNorm, substanciaNorm, ...publico } = l;
    return publico;
  });
  return { atualizadoEm: t.atualizadoEm, lidoEm: t.lidoEm, total: t.linhas.length, encontrados: achados.length, resultados };
}
