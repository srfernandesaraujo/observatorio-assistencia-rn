// Dados territoriais do IBGE (Censo Demográfico 2022) para os municípios do RN, via API pública de dados agregados.
// Agregado 4714: 93 = população residente, 6318 = área (km²), 614 = densidade demográfica (hab/km²).

export interface MunicipioIBGE {
  codigo: string;
  nome: string;
  populacao: number;
  areaKm2: number;
  densidade: number;
}

export const FONTE_IBGE = {
  rotulo: "IBGE, Censo Demográfico 2022",
  url: "https://sidra.ibge.gov.br/tabela/4714",
  ano: 2022,
};

const URL_IBGE =
  "https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93%7C6318%7C614?localidades=N6%5BN3%5B24%5D%5D";
const CHAVE_CACHE = "ibge-municipios-rn-v1";

interface RespostaIBGE {
  id: string;
  resultados: { series: { localidade: { id: string; nome: string }; serie: Record<string, string> }[] }[];
}

export function parseMunicipiosIBGE(resposta: RespostaIBGE[]): MunicipioIBGE[] {
  const porCodigo = new Map<string, MunicipioIBGE>();
  for (const variavel of resposta) {
    for (const s of variavel.resultados[0]?.series ?? []) {
      const valor = Number(s.serie["2022"]);
      const atual =
        porCodigo.get(s.localidade.id) ??
        { codigo: s.localidade.id, nome: s.localidade.nome.replace(/\s+-\s+RN$/, ""), populacao: NaN, areaKm2: NaN, densidade: NaN };
      if (variavel.id === "93") atual.populacao = valor;
      else if (variavel.id === "6318") atual.areaKm2 = valor;
      else if (variavel.id === "614") atual.densidade = valor;
      porCodigo.set(s.localidade.id, atual);
    }
  }
  return [...porCodigo.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function carregarMunicipiosRN(): Promise<MunicipioIBGE[]> {
  try {
    const guardado = sessionStorage.getItem(CHAVE_CACHE);
    if (guardado) return JSON.parse(guardado) as MunicipioIBGE[];
  } catch {
    // sessionStorage indisponível: segue sem cache
  }
  const r = await fetch(URL_IBGE);
  if (!r.ok) throw new Error(`IBGE ${r.status}`);
  const municipios = parseMunicipiosIBGE((await r.json()) as RespostaIBGE[]).filter((m) => Number.isFinite(m.populacao));
  if (municipios.length < 100) throw new Error("Resposta do IBGE incompleta.");
  try {
    sessionStorage.setItem(CHAVE_CACHE, JSON.stringify(municipios));
  } catch {
    // ignora
  }
  return municipios;
}
