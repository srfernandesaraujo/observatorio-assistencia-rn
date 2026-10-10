// Programas governamentais de acesso a medicamentos.
// Conteúdo informativo e genérico; deve ser revisado por farmacêutico e conferido
// nas fontes oficiais antes da publicação. Futuramente será alimentado por planilha/admin.

export interface ProgramaGovernamental {
  id: string;
  nome: string;
  esfera: "Federal" | "Estadual" | "Municipal";
  resumo: string;
  ondeObter: string;
  comoAcessar: string[];
  fonte: { rotulo: string; url: string };
}

export const PROGRAMAS_GOVERNAMENTAIS: ProgramaGovernamental[] = [
  {
    id: "farmacia-popular",
    nome: "Farmácia Popular do Brasil",
    esfera: "Federal",
    resumo: "Programa do Ministério da Saúde que disponibiliza medicamentos e insumos para condições frequentes, por meio de farmácias credenciadas.",
    ondeObter: "Farmácias e drogarias credenciadas ao programa.",
    comoAcessar: ["Documento de identidade com foto e CPF", "Receita médica válida", "Consultar no programa a lista atual de medicamentos disponíveis"],
    fonte: { rotulo: "Ministério da Saúde", url: "https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular" },
  },
  {
    id: "componente-basico",
    nome: "Componente Básico da Assistência Farmacêutica (CBAF)",
    esfera: "Municipal",
    resumo: "Medicamentos e insumos da atenção primária, voltados aos agravos mais comuns, financiados por União, estado e município.",
    ondeObter: "Farmácia da Unidade Básica de Saúde ou farmácia municipal.",
    comoAcessar: ["Cartão SUS e documento de identidade", "Receita de profissional do SUS (ou conforme regra do município)", "Verificar a lista municipal de medicamentos (REMUME)"],
    fonte: { rotulo: "Ministério da Saúde", url: "https://www.gov.br/saude/pt-br/composicao/sectics/daf" },
  },
  {
    id: "componente-estrategico",
    nome: "Componente Estratégico da Assistência Farmacêutica (CESAF)",
    esfera: "Federal",
    resumo: "Medicamentos para programas de saúde específicos, como tuberculose, hanseníase, HIV/aids e outras doenças de relevância em saúde pública.",
    ondeObter: "Serviços de saúde de referência do programa correspondente.",
    comoAcessar: ["Diagnóstico e acompanhamento no serviço de saúde do SUS", "Procurar a unidade de referência indicada pela Secretaria de Saúde"],
    fonte: { rotulo: "Ministério da Saúde", url: "https://www.gov.br/saude/pt-br/composicao/sectics/daf" },
  },
  {
    id: "componente-especializado",
    nome: "Componente Especializado da Assistência Farmacêutica (CEAF)",
    esfera: "Estadual",
    resumo: "Medicamentos para doenças crônicas e raras, conforme os Protocolos Clínicos e Diretrizes Terapêuticas (PCDT). No RN, a dispensação é feita pela Secretaria de Estado da Saúde Pública.",
    ondeObter: "Unidades de dispensação do componente especializado (Unicat) e farmácias vinculadas, conforme orientação da SESAP-RN.",
    comoAcessar: ["Solicitação com laudo e exames exigidos pelo PCDT da doença", "Documentos pessoais e comprovante de residência", "Confirmar documentos e local de atendimento atuais com a SESAP-RN"],
    fonte: { rotulo: "Ministério da Saúde (confirme local e documentos com a SESAP-RN)", url: "https://www.gov.br/saude/pt-br/composicao/sectics/daf/ceaf" },
  },
];
