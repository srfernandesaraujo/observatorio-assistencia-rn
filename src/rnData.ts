// Dados e Tipagens Especializadas para a Gestão Estratégica da Assistência Farmacêutica do RN

export interface RegiaoSaudeRN {
  id: string;
  nome: string;
  sede: string;
  municipios: number;
  farmaciasPublicas: number;
  taxaDesabastecimento: number;
  casosJudicializacao: number;
  estoqueCriticoItens: string[];
  coordenador: string;
  contato: string;
}

export interface DocumentoTecnico {
  id: string;
  titulo: string;
  tipo: "Nota Técnica" | "PCDT" | "Legislação" | "Educação";
  dataPublicacao: string;
  autor: string;
  resumo: string;
  conteudo: string;
  tags: string[];
}

export interface DossierATS {
  id: string;
  tecnologia: string;
  indicacao: string;
  solicitante: string;
  status: "Em Análise" | "Aprovado" | "Rejeitado" | "Sob Consulta";
  custoAnualEstimado: number;
  impactoOrcamentario5Anos: number;
  custoEfetividadeSugerido: string;
  dataSubmissao: string;
}

export interface MedicamentoJudicializado {
  id: string;
  nome: string;
  principio_ativo: string;
  indicacao: string;
  precoUnitario: number;
  casosAtivos: number;
  custoAnualEstimado: number;
  comentarios: string;
}

// 8 Regiões de Saúde do Rio Grande do Norte (Padrão Oficial SESAP-RN)
export const REGIOES_SAUDE_RN: RegiaoSaudeRN[] = [
  {
    id: "REG-I",
    nome: "1ª Região de Saúde",
    sede: "São José de Mipibu",
    municipios: 27,
    farmaciasPublicas: 38,
    taxaDesabastecimento: 5.2,
    casosJudicializacao: 142,
    estoqueCriticoItens: ["Insulina NPH", "Losartana 50mg"],
    coordenador: "Dr. Marcos André Silva",
    contato: "reg1.sesap@rn.gov.br"
  },
  {
    id: "REG-II",
    nome: "2ª Região de Saúde",
    sede: "Mossoró",
    municipios: 15,
    farmaciasPublicas: 42,
    taxaDesabastecimento: 8.4,
    casosJudicializacao: 382,
    estoqueCriticoItens: ["Amoxicilina 500mg", "Ibuprofeno 600mg"],
    coordenador: "Dra. Clarice Bezerra",
    contato: "reg2.sesap@rn.gov.br"
  },
  {
    id: "REG-III",
    nome: "3ª Região de Saúde",
    sede: "João Câmara",
    municipios: 25,
    farmaciasPublicas: 29,
    taxaDesabastecimento: 9.1,
    casosJudicializacao: 98,
    estoqueCriticoItens: ["Amoxicilina 500mg", "Insulina NPH"],
    coordenador: "Dr. Alysson Cabral",
    contato: "reg3.sesap@rn.gov.br"
  },
  {
    id: "REG-IV",
    nome: "4ª Região de Saúde",
    sede: "Caicó",
    municipios: 24,
    farmaciasPublicas: 31,
    taxaDesabastecimento: 4.8,
    casosJudicializacao: 110,
    estoqueCriticoItens: ["Losartana 50mg"],
    coordenador: "Dra. Sandra Maria Medeiros",
    contato: "reg4.sesap@rn.gov.br"
  },
  {
    id: "REG-V",
    nome: "5ª Região de Saúde",
    sede: "Santa Cruz",
    municipios: 21,
    farmaciasPublicas: 26,
    taxaDesabastecimento: 6.2,
    casosJudicializacao: 75,
    estoqueCriticoItens: ["Metformina 850mg", "Dipirona Gotas"],
    coordenador: "Dr. Elizeu Dantas",
    contato: "reg5.sesap@rn.gov.br"
  },
  {
    id: "REG-VI",
    nome: "6ª Região de Saúde",
    sede: "Pau dos Ferros",
    municipios: 37,
    farmaciasPublicas: 35,
    taxaDesabastecimento: 10.5,
    casosJudicializacao: 115,
    estoqueCriticoItens: ["Amoxicilina 500mg", "Atorvastatina 20mg", "Insulina NPH"],
    coordenador: "Dr. Cleiton Nascimento",
    contato: "reg6.sesap@rn.gov.br"
  },
  {
    id: "REG-VII",
    nome: "7ª Região de Saúde (Metropolitana)",
    sede: "Natal",
    municipios: 5,
    farmaciasPublicas: 112,
    taxaDesabastecimento: 4.1,
    casosJudicializacao: 820,
    estoqueCriticoItens: ["Atorvastatina 20mg"],
    coordenador: "Dra. Patricia Vasconcelos",
    contato: "reg7.sesap@rn.gov.br"
  },
  {
    id: "REG-VIII",
    nome: "8ª Região de Saúde",
    sede: "Açu",
    municipios: 13,
    farmaciasPublicas: 18,
    taxaDesabastecimento: 7.3,
    casosJudicializacao: 100,
    estoqueCriticoItens: ["Metformina 850mg"],
    coordenador: "Dr. Francisco Sales",
    contato: "reg8.sesap@rn.gov.br"
  }
];

// Custos Consolidados da Assistência Farmacêutica (RN - Histórico de Orçamento)
export const CUSTOS_AF_RN = {
  anoVigente: 2026,
  orcamentoTotal: 142500000, // R$ 142.5M
  distribuicao: [
    { categoria: "Componente Básico (CBAF)", valor: 38400000, percentual: 26.9, cor: "bg-blue-500 text-blue-500" },
    { categoria: "Componente Especializado (CEAF)", valor: 68200000, percentual: 47.9, cor: "bg-purple-500 text-purple-500" },
    { categoria: "Assistência Farmacêutica Hospitalar", valor: 25900000, percentual: 18.2, cor: "bg-emerald-500 text-emerald-500" },
    { categoria: "Medicamentos Estratégicos & Judiciais", valor: 10000000, percentual: 7.0, cor: "bg-red-500 text-red-500" }
  ],
  historicoGasto: [
    { ano: "2022", total: 112000000, judicial: 12500000 },
    { ano: "2023", total: 121500000, judicial: 14200000 },
    { ano: "2024", total: 130800000, judicial: 16800000 },
    { ano: "2025", total: 138000000, judicial: 18500000 },
    { ano: "2026 (Proj.)", total: 142500000, judicial: 19500000 }
  ]
};

// Qualidade dos Serviços Farmacêuticos no RN (Dados de Indicadores e Credenciamento)
export const QUALIDADE_MEDIDAS_RN = {
  presencaProfissional: 92.4, // % de unidades com farmacêutico em tempo integral
  cadeiaFrioConformidade: 98.2, // % de geladeiras e estoques climatizados monitorados perfeitamente
  satisfacaoUsuario: 8.6, // Nota média do SUS Ouvidoria para Farmácias de Alto Custo
  tempoEsperaMinutos: 14.2, // Tempo médio de atendimento em Natal/Mossoró
  requisitosAcreditacao: [
    { id: "QA-01", item: "Termômetros IoT integrados com registro automático a cada 15 min", obrigatorio: true },
    { id: "QA-02", item: "Área de atendimento climatizada e com assentos preferenciais", obrigatorio: true },
    { id: "QA-03", item: "Consultório farmacêutico estruturado para atenção clínica individual", obrigatorio: false },
    { id: "QA-04", item: "Sistema Horus de dispensação ativo e sincronizado em tempo real", obrigatorio: true },
    { id: "QA-05", item: "Protocolo de triagem rápida para idosos e gestantes ativo", obrigatorio: true },
    { id: "QA-06", item: "Guarda segregada e trancada para medicamentos psicotrópicos / controlados", obrigatorio: true },
    { id: "QA-07", item: "Informativo impresso sobre descarte adequado de sobras em circulação", obrigatorio: false }
  ]
};

// Registro de Judicialização no Rio Grande do Norte
export const JUDICIALIZACAO_RN: MedicamentoJudicializado[] = [
  {
    id: "JUD-01",
    nome: "Eculizumabe 300mg",
    principio_ativo: "Eculizumabe",
    indicacao: "Hemoglobinúria Paroxística Noturna (HPN)",
    precoUnitario: 18500,
    casosAtivos: 14,
    custoAnualEstimado: 3108000,
    comentarios: "Medicamento órfão de altíssimo custo. Impacto severo no orçamento da Unicat."
  },
  {
    id: "JUD-02",
    nome: "Pembrolizumabe 100mg",
    principio_ativo: "Pembrolizumabe",
    indicacao: "Melanoma Metastático e Câncer de Pulmão",
    precoUnitario: 14200,
    casosAtivos: 28,
    custoAnualEstimado: 4771200,
    comentarios: "Anticorpo monoclonal oncológico de alta demanda via Defensoria Pública."
  },
  {
    id: "JUD-03",
    nome: "Nusinersena 12mg (Spinraza)",
    principio_ativo: "Nusinersena",
    indicacao: "Atrofia Muscular Espinhal (AME)",
    precoUnitario: 320000,
    casosAtivos: 3,
    custoAnualEstimado: 1920000,
    comentarios: "Inclusão recente no SUS, porém processos residuais exigem compra direta pela Unicat."
  },
  {
    id: "JUD-04",
    nome: "Dupilumabe 300mg",
    principio_ativo: "Dupilumabe",
    indicacao: "Dermatite Atópica Grave e Asma Eosinofílica",
    precoUnitario: 4500,
    casosAtivos: 45,
    custoAnualEstimado: 2430000,
    comentarios: "Ação judicial fundamentada em refratariedade de tratamentos convencionais do SUS."
  }
];

// Avaliação de Tecnologias em Saúde (ATS) da SESAP-RN
export const ATS_DOSSIERS_RN: DossierATS[] = [
  {
    id: "ATS-001",
    tecnologia: "Empagliflozina 10mg",
    indicacao: "Insuficiência Cardíaca com Fração de Ejeção Preservada (ICFEP)",
    solicitante: "Sociedade Potiguar de Cardiologia",
    status: "Aprovado",
    custoAnualEstimado: 1200,
    impactoOrcamentario5Anos: 4800000,
    custoEfetividadeSugerido: "Altamente custo-efetivo, reduz internações hospitalares em 23% no RN.",
    dataSubmissao: "2025-09-10"
  },
  {
    id: "ATS-002",
    tecnologia: "Secuquinumabe 150mg",
    indicacao: "Artrite Psoriásica Moderada a Grave",
    solicitante: "Associação de Pacientes Reumáticos do RN",
    status: "Em Análise",
    custoAnualEstimado: 24000,
    impactoOrcamentario5Anos: 18500000,
    custoEfetividadeSugerido: "Análise de impacto orçamentário em andamento. Comparação direta com Adalimumabe.",
    dataSubmissao: "2026-02-15"
  },
  {
    id: "ATS-003",
    tecnologia: "Larotrectinibe 100mg",
    indicacao: "Tumores Sólidos com Fusão do Gene NTRK",
    solicitante: "Liga Contra o Câncer do RN",
    status: "Rejeitado",
    custoAnualEstimado: 480000,
    impactoOrcamentario5Anos: 9600000,
    custoEfetividadeSugerido: "Razão de custo-efetividade incremental (ICER) excessiva para o cenário orçamentário do SUS-RN.",
    dataSubmissao: "2025-11-05"
  }
];

// Repositório Digital Completo de Documentação Técnica e Legislação do RN
export const REPOSITORIO_DOCUMENTOS_RN: DocumentoTecnico[] = [
  {
    id: "DOC-RN-001",
    titulo: "Nota Técnica Nº 04/2026 - Unicat: Diretrizes para Distribuição de Insulina NPH",
    tipo: "Nota Técnica",
    dataPublicacao: "2026-05-12",
    autor: "Coordenação Técnica UNICAT / SESAP",
    resumo: "Normatiza o fluxo de distribuição descentralizada e as cotas de segurança para os estoques de Insulina Humana NPH e Regular no Rio Grande do Norte.",
    tags: ["Insulina", "Controle", "Unicat", "Diabetes"],
    conteudo: `### NOTA TÉCNICA Nº 04/2026-UNICAT
**Assunto**: Critérios de abastecimento de Insulinas nas Regiões de Saúde do RN
**Data**: 12 de Maio de 2026

1. **Introdução**: O Rio Grande do Norte, através da Unidade Central de Agentes Terapêuticos (UNICAT), estabelece as cotas mensais de distribuição com base nas metas populacionais de usuários cadastrados e na capacidade de refrigeração de cada regional.
2. **Parâmetros de Segurança**: Cada unidade deve manter no mínimo **15 dias de estoque de segurança (autonomia crítica)**. Aquisições emergenciais serão disparadas automaticamente pelo Observatório quando os dias de cobertura geral do estado caírem para menos de 20 dias.
3. **Distribuição Compartilhada**: Fica autorizado o remanejamento imediato de lotes de insulinas com vencimento inferior a 60 dias entre as unidades da 1ª e 7ª região de saúde, priorizando a compensação de saldos.`
  },
  {
    id: "DOC-RN-002",
    titulo: "Protocolo Clínico Estadual (PCDT-RN) - Tratamento da Hipertensão Arterial Sistêmica Resistente",
    tipo: "PCDT",
    dataPublicacao: "2025-10-20",
    autor: "Comissão de Protocolos Clínicos SESAP-RN",
    resumo: "Define os critérios de elegibilidade para dispensação de terapias de 3ª e 4ª linha de hipertensão grave na rede estadual do SUS.",
    tags: ["Hipertensão", "PCDT", "Dispensação", "Clínico"],
    conteudo: `### PROTOCOLO ESTADUAL DE HIPERTENSÃO RESISTENTE (PCDT-RN)
**Vigência**: Outubro de 2025

1. **Critérios de Elegibilidade**: Paciente com pressão arterial persistentemente acima de 140/90 mmHg utilizando 3 classes de anti-hipertensivos em doses terapêuticas máximas, incluindo um diurético.
2. **Esquema de Dispensação**: Inclusão preferencial da Espironolactona como 4º fármaco. Para casos refratários, a liberação de Bloqueadores do Receptor de Angiotensina (como Losartana Potássica) deve ser auditada e associada à avaliação de função renal.
3. **Acompanhamento Obrigatório**: Monitoramento da taxa de filtração glomerular e potássio sérico a cada 6 meses nas UBS de referência.`
  },
  {
    id: "DOC-RN-003",
    titulo: "Portaria Estadual Nº 112/2026-SESAP: Regulamentação de Medicamentos sob Controle Especial",
    tipo: "Legislação",
    dataPublicacao: "2026-01-08",
    autor: "Gabinete do Secretário de Saúde do RN",
    resumo: "Dispõe sobre os requisitos para prescrição, notificação e escrituração digital de substâncias entorpecentes e psicotrópicas no âmbito hospitalar do RN.",
    tags: ["Portaria", "Controle Especial", "Legislação", "Psicotrópicos"],
    conteudo: `### PORTARIA ESTADUAL Nº 112/2026-SESAP/RN
**Assunto**: Controle Sanitário de Substâncias Sujeitas a Controle Especial na Rede SUS-RN

1. **Escrituração Digital**: Todas as farmácias hospitalares de urgência/emergência da rede estadual do RN (incluindo o Hospital Walfredo Gurgel) devem integrar seus relatórios mensais ao Sistema Nacional de Gerenciamento de Produtos Controlados (SNGPC) em até 5 dias após o fechamento do mês.
2. **Validade de Receitas**: Receitas de controle especial (tipo A, B1, B2 e C1) emitidas em outros estados da federação terão validade no RN contanto que acompanhadas por relatório de justificativa de trânsito assinado pelo médico assistente.`
  },
  {
    id: "DOC-RN-004",
    titulo: "Guia de Educação em Saúde - Uso Racional de Antibióticos e Prevenção de Automedicação",
    tipo: "Educação",
    dataPublicacao: "2026-03-15",
    autor: "Núcleo de Assistência Farmacêutica e Educação Coletiva do RN",
    resumo: "Material informativo para distribuição em salas de espera das UBSs, alertando sobre os riscos do uso excessivo de antimicrobianos e proliferação de superbactérias.",
    tags: ["Educação", "Antimicrobianos", "Paciente", "Prevenção"],
    conteudo: `### MANUAL DO PACIENTE - USO SEGURO DE ANTIBIÓTICOS
**Campanha Permanente de Educação em Saúde - SUS Rio Grande do Norte**

* **O que é uma Superbactéria?**: Bactérias comuns que se tornam resistentes aos remédios porque as pessoas usam antibióticos de forma errada, incompleta ou sem necessidade.
* **Regras de Ouro para sua Saúde**:
  1. **Tome no horário exato**: Se o médico mandou tomar de 8 em 8 horas, siga o relógio à risca para manter a concentração do remédio no sangue.
  2. **Nunca pare antes**: Mesmo se os sintomas sumirem no 3º dia, tome até o final do prazo prescrito (geralmente 7 dias) para garantir que todas as bactérias morreram.
  3. **Descarte adequado**: Não guarde sobras de antibiótico em casa. Entregue-as na farmácia da UBS do seu bairro para descarte ambiental seguro.`
  }
];
