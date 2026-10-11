// Metodologia e glossário do Observatório.
// O texto descreve apenas o que o site faz hoje. Ao mudar uma fonte ou a forma de coleta, atualize aqui.

export interface FonteDados {
  secao: string;
  fonte: string;
  comoChega: string;
  atualizacao: string;
}

export const FONTES: FonteDados[] = [
  {
    secao: "Início e Comparador territorial (população, área e densidade)",
    fonte: "IBGE, Censo Demográfico 2022 (SIDRA, tabela 4714)",
    comoChega: "Consulta automática à API pública de dados agregados do IBGE, a cada acesso.",
    atualizacao: "Conforme o IBGE; o Observatório não guarda cópia.",
  },
  {
    secao: "Preços de medicamentos (CMED)",
    fonte: "CMED/Anvisa, Portal de Dados Abertos (arquivo TA_PRECO_MEDICAMENTO)",
    comoChega: "Coleta automática: o servidor do Observatório lê o arquivo da Anvisa e o guarda em memória.",
    atualizacao: "Relido no máximo a cada 12 horas. A tela mostra a data do arquivo na Anvisa.",
  },
  {
    secao: "Registros de medicamentos (Anvisa)",
    fonte: "Anvisa, Portal de Dados Abertos (produtos registrados, medicamentos)",
    comoChega: "Coleta automática: o servidor do Observatório lê o arquivo da Anvisa, reúne as linhas repetidas de cada registro e guarda o resultado em memória.",
    atualizacao: "Relido no máximo a cada 24 horas; a Anvisa atualiza o arquivo uma vez por mês. A tela mostra a data do arquivo.",
  },
  {
    secao: "Alertas sanitários",
    fonte: "Anvisa (notícias e resoluções oficiais)",
    comoChega: "Planilha preparada pela equipe, sempre com o link da notícia ou resolução oficial. Não encontramos uma API da Anvisa para alertas.",
    atualizacao: "Quando a equipe publica uma nova planilha.",
  },
  {
    secao: "Desabastecimento, pregões, custos, judicialização, indicadores por município e vínculo município–região de saúde",
    fonte: "Informada em cada publicação (órgão, período e link, quando houver)",
    comoChega: "Planilha enviada por pessoa autorizada na área de Administração.",
    atualizacao: "Quando a equipe publica uma nova planilha. Enquanto um conjunto não for publicado, a seção mostra “aguardando dados da fonte”.",
  },
  {
    secao: "Educação e Repositório; Produção Científica",
    fonte: "Órgão emissor de cada documento; autores de cada trabalho",
    comoChega: "Planilha organizada pela equipe, com link para o documento ou trabalho original.",
    atualizacao: "Quando a equipe publica uma nova planilha.",
  },
  {
    secao: "Programas Governamentais",
    fonte: "Páginas oficiais do Ministério da Saúde, citadas em cada programa",
    comoChega: "Texto informativo escrito pela equipe, com link para a fonte.",
    atualizacao: "Quando a equipe revisa o texto. Confirme documentos e locais de atendimento atuais com o serviço de saúde ou com a SESAP-RN.",
  },
  {
    secao: "Assistente de perguntas",
    fonte: "Os dados já publicados no próprio Observatório",
    comoChega: "Um modelo de inteligência artificial (Gemini, do Google) recebe a pergunta junto com os dados publicados e responde só com eles, citando a fonte.",
    atualizacao: "Usa os dados publicados no momento da pergunta (com cache curto no servidor).",
  },
];

export interface Termo {
  termo: string;
  definicao: string;
}

// Em ordem alfabética (a página reordena por segurança).
export const GLOSSARIO: Termo[] = [
  { termo: "Alerta sanitário", definicao: "Aviso oficial da Anvisa sobre um produto com problema, como recolhimento, suspensão ou proibição de lotes. O Observatório mostra o aviso com o link da fonte oficial." },
  { termo: "Anvisa", definicao: "Agência Nacional de Vigilância Sanitária. Regula e fiscaliza medicamentos, alimentos, produtos de saúde e serviços sujeitos à vigilância sanitária; também exerce a secretaria executiva da CMED." },
  { termo: "Apresentação (de um medicamento)", definicao: "Combinação de concentração, forma farmacêutica e embalagem de um medicamento. Por exemplo, comprimidos de 50 mg em caixa com 30. Cada apresentação tem seu próprio preço na tabela da CMED." },
  { termo: "Assistência Farmacêutica", definicao: "Conjunto de ações de saúde voltadas ao acesso e ao uso adequado de medicamentos: seleção, programação, compra, distribuição, dispensação e acompanhamento do uso." },
  { termo: "ATS (Avaliação de Tecnologias em Saúde)", definicao: "Análise das evidências sobre eficácia, segurança e custos de uma tecnologia em saúde (como um medicamento) para apoiar decisões sobre seu uso e sua incorporação ao sistema de saúde." },
  { termo: "CAP (Coeficiente de Adequação de Preço)", definicao: "Desconto aplicado sobre o preço de fábrica em vendas ao governo, para os produtos sujeitos a ele. Na consulta de preços, a observação “Sujeito ao CAP” indica esses produtos." },
  { termo: "CBAF (Componente Básico da Assistência Farmacêutica)", definicao: "Medicamentos e insumos da atenção primária, voltados aos agravos mais comuns, financiados por União, estado e município. Costumam ser entregues na farmácia da Unidade Básica de Saúde." },
  { termo: "CEAF (Componente Especializado da Assistência Farmacêutica)", definicao: "Medicamentos para doenças crônicas e raras, conforme os Protocolos Clínicos e Diretrizes Terapêuticas (PCDT). No RN, a dispensação é feita pela SESAP-RN." },
  { termo: "CESAF (Componente Estratégico da Assistência Farmacêutica)", definicao: "Medicamentos para programas de saúde específicos, como tuberculose, hanseníase e HIV/aids, e outras doenças de relevância em saúde pública." },
  { termo: "CMED (Câmara de Regulação do Mercado de Medicamentos)", definicao: "Órgão interministerial que define regras e limites de preço para medicamentos no Brasil. A Anvisa exerce sua secretaria executiva e publica a tabela de preços." },
  { termo: "CONITEC", definicao: "Comissão Nacional de Incorporação de Tecnologias no SUS. Avalia e recomenda quais tecnologias, como medicamentos, devem ser incorporadas, alteradas ou excluídas do SUS." },
  { termo: "DCB (Denominação Comum Brasileira)", definicao: "Nome oficial, no Brasil, de uma substância usada como princípio ativo de medicamentos. É o nome que aparece em receitas do SUS e em listas oficiais." },
  { termo: "Dispensação", definicao: "Ato de entregar o medicamento à pessoa, mediante prescrição, com orientação do farmacêutico sobre o uso." },
  { termo: "ICMS", definicao: "Imposto estadual sobre a circulação de mercadorias. A tabela da CMED traz preços por alíquota de ICMS; o Observatório mostra os valores sem impostos e com ICMS 0%." },
  { termo: "Judicialização da saúde", definicao: "Busca, por meio de ações na Justiça, de acesso a medicamentos, tratamentos ou serviços de saúde. O Observatório mostra o número de processos de saúde concluídos por ano, quando a fonte pública estiver publicada." },
  { termo: "Medicamento biológico", definicao: "Medicamento produzido a partir de organismos vivos ou de seus componentes, como muitas vacinas, insulinas e anticorpos." },
  { termo: "Medicamento genérico", definicao: "Medicamento com o mesmo princípio ativo, dose, forma e via de administração do medicamento de referência, intercambiável com ele e vendido pelo nome do princípio ativo." },
  { termo: "Medicamento similar", definicao: "Medicamento com o mesmo princípio ativo, concentração, forma e via do medicamento de referência, mas que pode ter diferenças como tamanho, forma ou embalagem, e é vendido com nome comercial." },
  { termo: "PCDT (Protocolo Clínico e Diretrizes Terapêuticas)", definicao: "Documento do Ministério da Saúde que estabelece critérios de diagnóstico, tratamento recomendado, medicamentos e acompanhamento de uma doença. Orienta quem tem direito a medicamentos do componente especializado." },
  { termo: "PF (Preço de Fábrica)", definicao: "Preço máximo que o fabricante pode cobrar de farmácias e distribuidores por um medicamento, segundo a CMED." },
  { termo: "PMC (Preço Máximo ao Consumidor)", definicao: "Preço máximo que as farmácias podem cobrar do público por um medicamento, segundo a CMED." },
  { termo: "Pregão", definicao: "Modalidade de licitação para comprar bens e serviços comuns, em que os fornecedores disputam o menor preço. Usada por órgãos públicos para comprar medicamentos." },
  { termo: "Registro (de medicamento)", definicao: "Autorização da Anvisa, dada antes da comercialização e publicada no Diário Oficial da União, que reconhece que o produto atende à lei. Cada registro tem um número e uma data de vencimento. Ter registro não significa que o medicamento esteja disponível no SUS ou em estoque." },
  { termo: "Princípio ativo", definicao: "Substância responsável pelo efeito terapêutico de um medicamento." },
  { termo: "Recolhimento, suspensão e proibição", definicao: "Tipos de alerta sanitário. Recolhimento é a retirada do mercado de lotes de um produto; suspensão interrompe temporariamente a distribuição, a venda ou o uso; proibição impede a fabricação, a venda ou o uso." },
  { termo: "Região de saúde", definicao: "Conjunto de municípios vizinhos, agrupados para organizar, planejar e executar ações e serviços de saúde. No RN, o vínculo oficial de cada município com sua região de saúde é informado pela SESAP-RN." },
  { termo: "REMUME (Relação Municipal de Medicamentos Essenciais)", definicao: "Lista dos medicamentos que o município oferece, a partir da RENAME e das necessidades locais." },
  { termo: "RENAME (Relação Nacional de Medicamentos Essenciais)", definicao: "Lista nacional dos medicamentos e insumos oferecidos no SUS, que serve de base para as listas de estados e municípios." },
  { termo: "SESAP-RN", definicao: "Secretaria de Estado da Saúde Pública do Rio Grande do Norte." },
  { termo: "SUS (Sistema Único de Saúde)", definicao: "Sistema público de saúde do Brasil, com ações e serviços da União, dos estados e dos municípios." },
];
