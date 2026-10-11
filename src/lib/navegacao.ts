import type { Destino } from "../components/Landing";

// Mapa de navegação do site. Não há rotas de URL: o lugar atual é uma área (aba) e, dentro de "principal", uma seção (sub).
// Ao criar uma seção nova: acrescente o id em SUBSECOES_INDICADORES (se for de Indicadores), o nome em NOMES_SUB,
// o item em MenuIndicadores.tsx, a tela em AreaPrincipal.tsx e a entrada na busca (lib/busca.ts).

export type Aba = "inicio" | "principal" | "producao" | "configuracoes";
export type TopNavId = "inicio" | "indicadores" | "programas" | "educacao" | "impacto" | "producao" | "metodologia" | "admin";

export interface Local {
  aba: Aba;
  sub?: string;
}

export const SECAO_INICIAL = "visao_geral";

// Seções que aparecem na barra lateral de Indicadores.
export const SUBSECOES_INDICADORES = [
  "visao_geral",
  "comparador",
  "desabastecimento",
  "alertas",
  "cmed",
  "registros",
  "custos",
  "qualidade",
  "judicializacao",
  "ats_farmacovigilancia",
  "dados_abertos",
];

export const NOMES_SUB: Record<string, string> = {
  visao_geral: "Visão geral dos indicadores",
  comparador: "Comparador territorial",
  desabastecimento: "Desabastecimento e pregões",
  alertas: "Alertas sanitários",
  cmed: "Consulta de preços (CMED)",
  registros: "Registros de medicamentos (Anvisa)",
  custos: "Custos e orçamento",
  judicializacao: "Judicialização",
  qualidade: "Qualidade dos serviços",
  ats_farmacovigilancia: "Avaliação de tecnologias em saúde (ATS)",
  dados_abertos: "Dados abertos",
  programas: "Programas Governamentais",
  repositorio: "Educação e Repositório",
  relatorio_impacto: "Relatório de impacto",
  metodologia: "Metodologia e glossário",
};

export const TITULO_SITE = "Observatório da Assistência Farmacêutica do RN";

export function ehIndicadores(aba: Aba, sub: string): boolean {
  return aba === "principal" && SUBSECOES_INDICADORES.includes(sub);
}

// Item do menu superior que fica marcado como página atual.
export function topNavAtual(aba: Aba, sub: string): TopNavId {
  if (aba === "inicio") return "inicio";
  if (aba === "producao") return "producao";
  if (aba === "configuracoes") return "admin";
  if (ehIndicadores(aba, sub)) return "indicadores";
  if (sub === "programas") return "programas";
  if (sub === "repositorio") return "educacao";
  if (sub === "metodologia") return "metodologia";
  return "impacto";
}

// Nome da seção atual, usado no título da aba do navegador e no aviso para leitores de tela.
export function nomeDaSecao(aba: Aba, sub: string): string {
  if (aba === "inicio") return "Início";
  if (aba === "producao") return "Produção Científica";
  if (aba === "configuracoes") return "Administração";
  return NOMES_SUB[sub] ?? "Observatório";
}

// Para onde vai cada item do menu superior.
export function localDoMenuSuperior(id: TopNavId): Local {
  if (id === "inicio") return { aba: "inicio" };
  if (id === "producao") return { aba: "producao" };
  if (id === "admin") return { aba: "configuracoes" };
  const sub = id === "indicadores" ? SECAO_INICIAL : id === "programas" ? "programas" : id === "educacao" ? "repositorio" : id === "metodologia" ? "metodologia" : "relatorio_impacto";
  return { aba: "principal", sub };
}

// Para onde vai cada atalho da página inicial ("assistente" não muda de lugar: abre a janela do assistente).
export function localDoAtalho(d: Exclude<Destino, "assistente">): Local {
  if (d === "producao") return { aba: "producao" };
  const sub: Record<string, string> = {
    indicadores: SECAO_INICIAL,
    comparador: "comparador",
    desabastecimento: "desabastecimento",
    alertas: "alertas",
    programas: "programas",
    educacao: "repositorio",
    impacto: "relatorio_impacto",
  };
  return { aba: "principal", sub: sub[d] };
}
