import type { Linha } from "./datasets";
import type { MunicipioIBGE } from "./ibge";
import { normalizar } from "./texto";

export interface IndicadorMunicipal {
  id: string;
  nome: string;
  unidade: string;
  origem: "ibge" | "dataset";
  anos: number[]; // em ordem decrescente
  valoresPorAno: Record<number, Map<string, number>>; // ano -> código IBGE -> valor
  permitePorHabitante: boolean; // só indicadores de contagem/valor absoluto
}

export const INDICADORES_IBGE = (municipios: MunicipioIBGE[]): IndicadorMunicipal[] => {
  const mapa = (f: (m: MunicipioIBGE) => number) => new Map(municipios.map((m) => [m.codigo, f(m)]));
  const base = { origem: "ibge" as const, anos: [2022], permitePorHabitante: false };
  return [
    { ...base, id: "ibge:populacao", nome: "População residente", unidade: "pessoas", valoresPorAno: { 2022: mapa((m) => m.populacao) } },
    { ...base, id: "ibge:area", nome: "Área territorial", unidade: "km²", valoresPorAno: { 2022: mapa((m) => m.areaKm2) } },
    { ...base, id: "ibge:densidade", nome: "Densidade demográfica", unidade: "hab/km²", valoresPorAno: { 2022: mapa((m) => m.densidade) } },
  ];
};

export interface Construcao {
  indicadores: IndicadorMunicipal[];
  naoReconhecidos: string[]; // nomes de município que não existem na lista do IBGE
}

// Converte as linhas publicadas (um indicador por linha) em indicadores por município e ano.
export function construirIndicadores(municipios: MunicipioIBGE[], linhas: Linha[]): Construcao {
  const porNome = new Map(municipios.map((m) => [normalizar(m.nome), m.codigo]));
  const naoReconhecidos = new Set<string>();
  const grupos = new Map<string, IndicadorMunicipal>();

  for (const l of linhas) {
    const codigo = porNome.get(normalizar(String(l.municipio ?? "")));
    if (!codigo) {
      naoReconhecidos.add(String(l.municipio ?? ""));
      continue;
    }
    const nome = String(l.indicador ?? "").trim();
    const ano = Number(l.ano);
    const valor = Number(l.valor);
    if (!nome || !Number.isFinite(ano) || !Number.isFinite(valor)) continue;
    let ind = grupos.get(nome);
    if (!ind) {
      const unidade = String(l.unidade ?? "").trim();
      ind = {
        id: `dataset:${nome}`,
        nome,
        unidade,
        origem: "dataset",
        anos: [],
        valoresPorAno: {},
        permitePorHabitante: !/%|\bpor\b|\//i.test(unidade),
      };
      grupos.set(nome, ind);
    }
    if (!ind.valoresPorAno[ano]) {
      ind.valoresPorAno[ano] = new Map();
      ind.anos.push(ano);
    }
    ind.valoresPorAno[ano].set(codigo, valor);
  }
  for (const ind of grupos.values()) ind.anos.sort((a, b) => b - a);
  return {
    indicadores: [...grupos.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    naoReconhecidos: [...naoReconhecidos].sort(),
  };
}

// Código IBGE -> região de saúde, a partir do vínculo publicado.
export function regioesPorCodigo(municipios: MunicipioIBGE[], linhas: Linha[]): Map<string, string> {
  const porNome = new Map(municipios.map((m) => [normalizar(m.nome), m.codigo]));
  const mapa = new Map<string, string>();
  for (const l of linhas) {
    const codigo = porNome.get(normalizar(String(l.municipio ?? "")));
    const regiao = String(l.regiao_saude ?? "").trim();
    if (codigo && regiao) mapa.set(codigo, regiao);
  }
  return mapa;
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
}

export interface Barra {
  rotulo: string;
  valor: number | null; // null = sem dado para este município/ano
  tipo: "municipio" | "referencia";
  detalhe?: string;
}

export interface EntradaComparacao {
  municipios: MunicipioIBGE[];
  selecionados: string[]; // códigos IBGE
  indicador: IndicadorMunicipal;
  ano: number;
  porDezMil: boolean;
  regioes: Map<string, string>;
}

const FATOR = 10000;

// Valor de um município no indicador, opcionalmente por 10 mil habitantes.
export function valorDoMunicipio(ind: IndicadorMunicipal, ano: number, m: MunicipioIBGE, porDezMil: boolean): number | null {
  const v = ind.valoresPorAno[ano]?.get(m.codigo);
  if (v === undefined) return null;
  if (!porDezMil) return v;
  return m.populacao > 0 ? (v / m.populacao) * FATOR : null;
}

export function montarComparacao(e: EntradaComparacao): Barra[] {
  const porCodigo = new Map(e.municipios.map((m) => [m.codigo, m]));
  const valorDe = (m: MunicipioIBGE) => valorDoMunicipio(e.indicador, e.ano, m, e.porDezMil);
  const barras: Barra[] = [];

  for (const codigo of e.selecionados) {
    const m = porCodigo.get(codigo);
    if (!m) continue;
    barras.push({ rotulo: m.nome, valor: valorDe(m), tipo: "municipio", detalhe: e.regioes.get(codigo) });
  }

  // Referência estadual: mediana entre os municípios que têm dado.
  const doEstado = e.municipios.map(valorDe).filter((v): v is number => v !== null);
  const medianaRN = mediana(doEstado);
  barras.push({ rotulo: "Mediana do RN", valor: medianaRN, tipo: "referencia", detalhe: `${doEstado.length} municípios com dado` });

  // Referência regional, só quando o vínculo município-região foi publicado.
  const regioesSelecionadas = [...new Set(e.selecionados.map((c) => e.regioes.get(c)).filter((r): r is string => !!r))];
  for (const regiao of regioesSelecionadas) {
    const daRegiao = e.municipios
      .filter((m) => e.regioes.get(m.codigo) === regiao)
      .map(valorDe)
      .filter((v): v is number => v !== null);
    barras.push({ rotulo: `Mediana: ${regiao}`, valor: mediana(daRegiao), tipo: "referencia", detalhe: `${daRegiao.length} municípios com dado` });
  }
  return barras;
}

export function formatarValor(v: number | null, casas = 1): string {
  if (v === null || !Number.isFinite(v)) return "sem dado";
  const inteiro = Math.abs(v) >= 100 || Number.isInteger(v);
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: inteiro ? 0 : casas });
}
