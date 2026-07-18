// Interfaces para a Modelagem Relacional do Observatório da Assistência Farmacêutica

export interface Medicamento {
  id: string; // Código do Medicamento
  nome: string;
  principio_ativo: string;
  atc: string; // Código ATC (Anatomical Therapeutic Chemical)
  registro_anvisa: string;
  dosagem: string;
  apresentacao: string;
}

export interface Instituicao {
  id: string; // Código da Instituição
  nome: string;
  tipo: 'Hospital' | 'UPA' | 'Farmácia de Alto Custo' | 'Almoxarifado' | 'UBS';
  cidade: string;
  uf: string;
}

export interface Estoque {
  id: string; // Identificador único do registro de estoque
  medicamento_id: string; // FK para Medicamento
  instituicao_id: string; // FK para Instituição
  quantidade: number;
  lote: string;
  validade: string; // Formato YYYY-MM-DD
  demanda_mensal: number; // Média de consumo mensal da unidade para cálculo de desabastecimento
}

export interface Movimentacao {
  id: string;
  medicamento_id: string; // FK para Medicamento
  instituicao_id: string; // FK para Instituição
  tipo: 'Entrada' | 'Saída' | 'Dispensação' | 'Transferência';
  quantidade: number;
  lote: string;
  data: string; // Formato YYYY-MM-DD HH:mm:ss
  responsavel: string;
  destino_origem?: string;
}

// Dataset Inicial Realista (Brasil / SUS / Farmácia Pública)

export const MEDICAMENTOS_MOCK: Medicamento[] = [
  {
    id: "MED-001",
    nome: "Insulina Humana NPH 100 UI/ML",
    principio_ativo: "Insulina Humana",
    atc: "A10AC01",
    registro_anvisa: "1004307520012",
    dosagem: "100 UI/ML",
    apresentacao: "Frasco-ampola de 10ml"
  },
  {
    id: "MED-002",
    nome: "Amoxicilina 500mg",
    principio_ativo: "Amoxicilina",
    atc: "J01CA04",
    registro_anvisa: "1057303020054",
    dosagem: "500mg",
    apresentacao: "Cápsula - Caixa com 30"
  },
  {
    id: "MED-003",
    nome: "Losartana Potássica 50mg",
    principio_ativo: "Losartana Potássica",
    atc: "C09CA01",
    registro_anvisa: "1037005110022",
    dosagem: "50mg",
    apresentacao: "Comprimido - Caixa com 30"
  },
  {
    id: "MED-004",
    nome: "Dipirona Sódica 500mg/ml",
    principio_ativo: "Dipirona Sódica",
    atc: "N02BB02",
    registro_anvisa: "1018103130099",
    dosagem: "500mg/ml",
    apresentacao: "Solução Oral Gotas - Frasco 20ml"
  },
  {
    id: "MED-005",
    nome: "Atorvastatina Cálcica 20mg",
    principio_ativo: "Atorvastatina Cálcica",
    atc: "C10AA05",
    registro_anvisa: "1004308250021",
    dosagem: "20mg",
    apresentacao: "Comprimido Revestido - Blister com 30"
  },
  {
    id: "MED-006",
    nome: "Ibuprofeno 600mg",
    principio_ativo: "Ibuprofeno",
    atc: "M01AE01",
    registro_anvisa: "1039001400032",
    dosagem: "600mg",
    apresentacao: "Comprimido - Blister com 20"
  },
  {
    id: "MED-007",
    nome: "Fosfato de Oseltamivir 75mg",
    principio_ativo: "Fosfato de Oseltamivir",
    atc: "J05AH08",
    registro_anvisa: "1004308560047",
    dosagem: "75mg",
    apresentacao: "Cápsula - Embalagem com 10"
  },
  {
    id: "MED-008",
    nome: "Cloridrato de Metformina 850mg",
    principio_ativo: "Cloridrato de Metformina",
    atc: "A10BA02",
    registro_anvisa: "1008902500051",
    dosagem: "850mg",
    apresentacao: "Comprimido - Embalagem com 30"
  }
];

export const INSTITUICOES_MOCK: Instituicao[] = [
  {
    id: "INST-001",
    nome: "Hospital Regional da Asa Norte (HRAN)",
    tipo: "Hospital",
    cidade: "Brasília",
    uf: "DF"
  },
  {
    id: "INST-002",
    nome: "UPA Sobradinho II",
    tipo: "UPA",
    cidade: "Sobradinho",
    uf: "DF"
  },
  {
    id: "INST-003",
    nome: "Farmácia de Alto Custo - Asa Sul",
    tipo: "Farmácia de Alto Custo",
    cidade: "Brasília",
    uf: "DF"
  },
  {
    id: "INST-004",
    nome: "Almoxarifado Central de Medicamentos (SES-DF)",
    tipo: "Almoxarifado",
    cidade: "Guará",
    uf: "DF"
  },
  {
    id: "INST-005",
    nome: "Unidade Básica de Saúde (UBS) Nº 1 Asa Sul",
    tipo: "UBS",
    cidade: "Brasília",
    uf: "DF"
  }
];

export const ESTOQUES_MOCK: Estoque[] = [
  // Insulina Humana NPH (MED-001) no HRAN (INST-001) - Baixo Estoque (Estoque crítico/Desabastecimento iminente)
  {
    id: "EST-001",
    medicamento_id: "MED-001",
    instituicao_id: "INST-001",
    quantidade: 150, // Demanda mensal é 1200, então dura apenas 3.75 dias!
    lote: "L-INS984",
    validade: "2026-10-15",
    demanda_mensal: 1200
  },
  // Insulina Humana NPH (MED-001) na Farmácia de Alto Custo (INST-003) - Estoque Saudável
  {
    id: "EST-002",
    medicamento_id: "MED-001",
    instituicao_id: "INST-003",
    quantidade: 4500, // Dura 45 dias
    lote: "L-INS882",
    validade: "2026-11-20",
    demanda_mensal: 3000
  },
  // Amoxicilina 500mg (MED-002) na UPA Sobradinho (INST-002) - Esgotado / Desabastecimento Total!
  {
    id: "EST-003",
    medicamento_id: "MED-002",
    instituicao_id: "INST-002",
    quantidade: 0, // Desabastecido!
    lote: "N/A",
    validade: "N/A",
    demanda_mensal: 2500
  },
  // Amoxicilina 500mg (MED-002) no Almoxarifado Central (INST-004) - Alto Estoque (Estoque para distribuição)
  {
    id: "EST-004",
    medicamento_id: "MED-002",
    instituicao_id: "INST-004",
    quantidade: 85000, // Estoque centralizador
    lote: "L-AMX401",
    validade: "2027-04-10",
    demanda_mensal: 15000
  },
  // Losartana Potássica 50mg (MED-003) na UBS 1 Asa Sul (INST-005) - Estoque Crítico
  {
    id: "EST-005",
    medicamento_id: "MED-003",
    instituicao_id: "INST-005",
    quantidade: 800, // Demanda mensal é 5000, dura 4.8 dias!
    lote: "L-LOS210",
    validade: "2026-09-30",
    demanda_mensal: 5000
  },
  // Dipirona Sódica Gotas (MED-004) na UPA Sobradinho (INST-002) - Estoque Confortável
  {
    id: "EST-006",
    medicamento_id: "MED-004",
    instituicao_id: "INST-002",
    quantidade: 3200, // Demanda é 1500, dura 64 dias
    lote: "L-DIP302",
    validade: "2027-08-15",
    demanda_mensal: 1500
  },
  // Atorvastatina Cálcica (MED-005) na Farmácia de Alto Custo (INST-003) - Próximo do vencimento
  {
    id: "EST-007",
    medicamento_id: "MED-005",
    instituicao_id: "INST-003",
    quantidade: 6000, // Dura 40 dias
    lote: "L-ATO705",
    validade: "2026-08-05", // ATENÇÃO: Vencendo em menos de um mês! (Data atual é jul/2026)
    demanda_mensal: 4500
  },
  // Ibuprofeno 600mg (MED-006) no HRAN (INST-001) - Estoque Saudável
  {
    id: "EST-008",
    medicamento_id: "MED-006",
    instituicao_id: "INST-001",
    quantidade: 8000, // Dura 80 dias
    lote: "L-IBU990",
    validade: "2027-12-01",
    demanda_mensal: 3000
  },
  // Oseltamivir (MED-007) na UPA Sobradinho (INST-002) - Demanda Sazonal Alerta
  {
    id: "EST-009",
    medicamento_id: "MED-007",
    instituicao_id: "INST-002",
    quantidade: 150, // Dura 9 dias (Demanda de gripe no inverno!)
    lote: "L-OSE120",
    validade: "2026-12-30",
    demanda_mensal: 500
  },
  // Metformina (MED-008) na UBS 1 Asa Sul (INST-005) - Estoque Saudável
  {
    id: "EST-010",
    medicamento_id: "MED-008",
    instituicao_id: "INST-005",
    quantidade: 12000, // Dura 60 dias
    lote: "L-MET505",
    validade: "2027-03-20",
    demanda_mensal: 6000
  }
];

export const MOVIMENTACOES_MOCK: Movimentacao[] = [
  {
    id: "MOV-001",
    medicamento_id: "MED-001",
    instituicao_id: "INST-001",
    tipo: "Entrada",
    quantidade: 500,
    lote: "L-INS984",
    data: "2026-07-10 08:30:00",
    responsavel: "Farm. Joana d'Arc",
    destino_origem: "Almoxarifado Central"
  },
  {
    id: "MOV-002",
    medicamento_id: "MED-001",
    instituicao_id: "INST-001",
    tipo: "Dispensação",
    quantidade: 5,
    lote: "L-INS984",
    data: "2026-07-16 14:15:00",
    responsavel: "Tec. Carlos Alberto",
    destino_origem: "Prescrição Paciente #324"
  },
  {
    id: "MOV-003",
    medicamento_id: "MED-002",
    instituicao_id: "INST-002",
    tipo: "Saída",
    quantidade: 200,
    lote: "L-AMX122",
    data: "2026-07-15 10:00:00",
    responsavel: "Farm. Marcos Souza",
    destino_origem: "Ajuste de Estoque - Lote Danificado"
  },
  {
    id: "MOV-004",
    medicamento_id: "MED-004",
    instituicao_id: "INST-002",
    tipo: "Entrada",
    quantidade: 1500,
    lote: "L-DIP302",
    data: "2026-07-12 11:45:00",
    responsavel: "Almoxarife Tadeu Santos",
    destino_origem: "Distribuição Central"
  },
  {
    id: "MOV-005",
    medicamento_id: "MED-003",
    instituicao_id: "INST-005",
    tipo: "Dispensação",
    quantidade: 30,
    lote: "L-LOS210",
    data: "2026-07-17 10:30:00",
    responsavel: "Farm. Amanda Costa",
    destino_origem: "Dispensação de Receita SUS"
  },
  {
    id: "MOV-006",
    medicamento_id: "MED-005",
    instituicao_id: "INST-003",
    tipo: "Entrada",
    quantidade: 3000,
    lote: "L-ATO705",
    data: "2026-07-11 09:00:00",
    responsavel: "Coordenador Renato Ramos",
    destino_origem: "Pregão Eletrônico #43/2026"
  }
];
