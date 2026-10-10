// Formatos dos conjuntos de dados. Módulo sem dependências, usado pelo site e pelo gerador de planilhas-modelo.
// Os formatos são provisórios: serão ajustados quando as fontes (SESAP-RN, SUAF etc.) informarem o formato real.

export type TipoColuna = "texto" | "numero" | "data" | "opcao" | "municipio";

export interface ColunaTemplate {
  id: string;
  rotulo: string;
  tipo: TipoColuna;
  obrigatoria?: boolean;
  opcoes?: string[];
  ajuda: string; // orientação de preenchimento
  exemplo: string | number; // exemplo mostrado na aba de instruções
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
      { id: "medicamento", rotulo: "Medicamento", tipo: "texto", obrigatoria: true, ajuda: "Nome com concentração e forma farmacêutica.", exemplo: "Losartana potássica 50 mg comprimido" },
      { id: "principio_ativo", rotulo: "Princípio ativo", tipo: "texto", ajuda: "Nome do princípio ativo (DCB).", exemplo: "Losartana potássica" },
      { id: "regiao_saude", rotulo: "Região de saúde", tipo: "texto", ajuda: "Região de saúde do RN a que o dado se refere.", exemplo: "1ª Região de Saúde" },
      { id: "componente", rotulo: "Componente", tipo: "opcao", opcoes: ["Básico", "Estratégico", "Especializado"], ajuda: "Escolha na lista.", exemplo: "Especializado" },
      { id: "situacao", rotulo: "Situação", tipo: "opcao", obrigatoria: true, opcoes: ["Em falta", "Estoque baixo", "Regular"], ajuda: "Escolha na lista.", exemplo: "Em falta" },
      { id: "data_referencia", rotulo: "Data de referência", tipo: "data", obrigatoria: true, ajuda: "Data a que a situação se refere (DD/MM/AAAA).", exemplo: "31/01/2026" },
      { id: "observacao", rotulo: "Observação", tipo: "texto", ajuda: "Informação adicional, se houver.", exemplo: "Aguardando entrega do fornecedor" },
    ],
  },
  {
    id: "alertas_sanitarios",
    titulo: "Alertas sanitários (Anvisa)",
    descricao: "Recolhimentos, suspensões e proibições de medicamentos, com link para a fonte oficial.",
    colunas: [
      { id: "data", rotulo: "Data", tipo: "data", obrigatoria: true, ajuda: "Data da publicação do alerta (DD/MM/AAAA).", exemplo: "06/10/2026" },
      { id: "tipo", rotulo: "Tipo", tipo: "opcao", obrigatoria: true, opcoes: ["Recolhimento", "Suspensão", "Proibição", "Falsificação", "Outro"], ajuda: "Escolha na lista.", exemplo: "Recolhimento" },
      { id: "produto", rotulo: "Produto", tipo: "texto", obrigatoria: true, ajuda: "Nome do medicamento com concentração e forma, como na notícia.", exemplo: "Dipirona sódica 500 mg/mL solução injetável" },
      { id: "empresa", rotulo: "Empresa", tipo: "texto", ajuda: "Fabricante ou detentor do registro.", exemplo: "Hypofarma" },
      { id: "lotes", rotulo: "Lotes", tipo: "texto", ajuda: "Lotes afetados, separados por vírgula. Deixe em branco se forem todos.", exemplo: "24112378" },
      { id: "motivo", rotulo: "Motivo", tipo: "texto", obrigatoria: true, ajuda: "Motivo, em linguagem simples e em uma frase.", exemplo: "Presença de partículas estranhas na solução" },
      { id: "link", rotulo: "Link da fonte", tipo: "texto", obrigatoria: true, ajuda: "Endereço (URL) da notícia ou resolução oficial da Anvisa.", exemplo: "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/..." },
    ],
  },
  {
    id: "indicadores_municipais",
    titulo: "Indicadores por município",
    descricao: "Um indicador por linha, por município e ano; alimenta o comparador territorial.",
    colunas: [
      { id: "municipio", rotulo: "Município", tipo: "municipio", obrigatoria: true, ajuda: "Escolha o município na lista (nomes oficiais do IBGE).", exemplo: "Natal" },
      { id: "indicador", rotulo: "Indicador", tipo: "texto", obrigatoria: true, ajuda: "Nome do indicador, igual em todas as linhas dele.", exemplo: "Farmácias públicas" },
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true, ajuda: "Ano de referência, com 4 dígitos.", exemplo: 2025 },
      { id: "valor", rotulo: "Valor", tipo: "numero", obrigatoria: true, ajuda: "Valor numérico do indicador.", exemplo: 42 },
      { id: "unidade", rotulo: "Unidade", tipo: "texto", ajuda: "Unidade do valor (ex.: unidades, R$, %). Se for uma contagem, o comparador pode mostrar por 10 mil habitantes.", exemplo: "unidades" },
    ],
  },
  {
    id: "municipios_regioes",
    titulo: "Municípios por região de saúde",
    descricao: "Vínculo oficial de cada município com sua região de saúde (fonte: SESAP-RN).",
    colunas: [
      { id: "municipio", rotulo: "Município", tipo: "municipio", obrigatoria: true, ajuda: "Escolha o município na lista (nomes oficiais do IBGE).", exemplo: "Mossoró" },
      { id: "regiao_saude", rotulo: "Região de saúde", tipo: "texto", obrigatoria: true, ajuda: "Nome da região de saúde, escrito sempre igual.", exemplo: "2ª Região de Saúde" },
    ],
  },
  {
    id: "repositorio_documentos",
    titulo: "Repositório de documentos",
    descricao: "Notas técnicas, protocolos, legislação e materiais educativos, sempre com link para o documento oficial.",
    colunas: [
      { id: "titulo", rotulo: "Título", tipo: "texto", obrigatoria: true, ajuda: "Título exato do documento, como no original.", exemplo: "Protocolo Clínico e Diretrizes Terapêuticas da Hipertensão" },
      { id: "tipo", rotulo: "Tipo", tipo: "opcao", obrigatoria: true, opcoes: ["Nota técnica", "Protocolo clínico (PCDT)", "Legislação", "Material educativo", "Outro"], ajuda: "Escolha na lista.", exemplo: "Protocolo clínico (PCDT)" },
      { id: "orgao", rotulo: "Órgão emissor", tipo: "texto", obrigatoria: true, ajuda: "Quem publicou o documento (ministério, secretaria, universidade etc.).", exemplo: "Ministério da Saúde" },
      { id: "data_publicacao", rotulo: "Data de publicação", tipo: "data", ajuda: "Data da publicação oficial (DD/MM/AAAA).", exemplo: "20/10/2025" },
      { id: "resumo", rotulo: "Resumo", tipo: "texto", ajuda: "Uma ou duas frases sobre o conteúdo, em linguagem simples.", exemplo: "Critérios de diagnóstico e tratamento da hipertensão arterial." },
      { id: "link", rotulo: "Link do documento", tipo: "texto", obrigatoria: true, ajuda: "Endereço (URL) do documento na fonte oficial.", exemplo: "https://www.gov.br/saude/pt-br/..." },
    ],
  },
  {
    id: "pregoes",
    titulo: "Pregões e compras",
    descricao: "Acompanhamento de pregões, usado como justificativa de faltas.",
    colunas: [
      { id: "numero_pregao", rotulo: "Nº do pregão", tipo: "texto", obrigatoria: true, ajuda: "Número e ano do pregão.", exemplo: "012/2026" },
      { id: "item", rotulo: "Item", tipo: "texto", obrigatoria: true, ajuda: "Medicamento ou insumo licitado.", exemplo: "Losartana potássica 50 mg comprimido" },
      { id: "situacao", rotulo: "Situação", tipo: "texto", ajuda: "Situação do pregão (ex.: Homologado, Deserto, Em andamento).", exemplo: "Homologado" },
      { id: "preco_registrado", rotulo: "Preço registrado (R$)", tipo: "numero", ajuda: "Valor unitário registrado, em reais.", exemplo: 0.58 },
      { id: "preco_cmed", rotulo: "Preço CMED (R$)", tipo: "numero", ajuda: "Preço máximo da tabela CMED, em reais.", exemplo: 0.82 },
      { id: "quantidade", rotulo: "Quantidade", tipo: "numero", ajuda: "Quantidade licitada, em unidades.", exemplo: 100000 },
      { id: "data", rotulo: "Data", tipo: "data", ajuda: "Data da homologação ou da sessão (DD/MM/AAAA).", exemplo: "15/02/2026" },
    ],
  },
  {
    id: "custos",
    titulo: "Custos da assistência farmacêutica",
    descricao: "Série histórica anual por componente ou linha de cuidado.",
    colunas: [
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true, ajuda: "Ano com 4 dígitos.", exemplo: 2025 },
      { id: "categoria", rotulo: "Componente ou linha de cuidado", tipo: "texto", obrigatoria: true, ajuda: "Componente da assistência farmacêutica ou linha de cuidado.", exemplo: "Componente Especializado" },
      { id: "valor_total", rotulo: "Valor total (R$)", tipo: "numero", obrigatoria: true, ajuda: "Gasto total do ano, em reais.", exemplo: 1250000.5 },
    ],
  },
  {
    id: "judicializacao",
    titulo: "Judicialização (processos concluídos por ano)",
    descricao: "Número anual de processos de saúde concluídos, a partir de fonte pública.",
    colunas: [
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true, ajuda: "Ano com 4 dígitos.", exemplo: 2025 },
      { id: "processos_concluidos", rotulo: "Processos concluídos", tipo: "numero", obrigatoria: true, ajuda: "Número de processos concluídos no ano.", exemplo: 120 },
    ],
  },
  {
    id: "producao_cientifica",
    titulo: "Produção científica",
    descricao: "Artigos, dissertações e produtos técnicos do projeto.",
    colunas: [
      { id: "titulo", rotulo: "Título", tipo: "texto", obrigatoria: true, ajuda: "Título completo do trabalho.", exemplo: "Acesso a medicamentos no Rio Grande do Norte" },
      { id: "tipo", rotulo: "Tipo", tipo: "opcao", obrigatoria: true, opcoes: ["Artigo", "Dissertação", "TCC", "Produto técnico", "Capítulo de livro"], ajuda: "Escolha na lista.", exemplo: "Artigo" },
      { id: "autores", rotulo: "Autores", tipo: "texto", obrigatoria: true, ajuda: "Separe os autores por ponto e vírgula.", exemplo: "Silva, A.; Souza, B." },
      { id: "ano", rotulo: "Ano", tipo: "numero", obrigatoria: true, ajuda: "Ano de publicação, com 4 dígitos.", exemplo: 2026 },
      { id: "link", rotulo: "Link", tipo: "texto", ajuda: "Endereço (URL) do trabalho, se for público.", exemplo: "https://exemplo.org/artigo" },
    ],
  },
];

export function getTemplate(id: string): TemplateDataset | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
