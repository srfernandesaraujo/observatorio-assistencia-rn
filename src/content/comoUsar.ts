// Conteúdo do guia "Como usar". Descreve só o que o site faz hoje; ao mudar uma tela mostrada aqui,
// atualize o texto e refaça as capturas: node tests/acessibilidade/capturas-como-usar.mjs (ver cabeçalho do script).

export interface Imagem {
  arquivo: string; // em public/guia-imagens
  alt: string;
  legenda: string;
  largura: number;
  altura: number;
}

export interface Cartao {
  titulo: string;
  texto: string;
}

export interface Aviso {
  titulo: string;
  texto: string;
}

export interface Etapa {
  id: string;
  titulo: string;
  intro: string;
  passos: string[];
  imagens: Imagem[];
  cartoes?: Cartao[];
  aviso?: Aviso;
}

const tela = (arquivo: string, alt: string, legenda: string, largura = 1280, altura = 800): Imagem => ({ arquivo, alt, legenda, largura, altura });

export const ETAPAS: Etapa[] = [
  {
    id: "comecar",
    titulo: "Comece pela página inicial",
    intro: "A página inicial reúne atalhos por tipo de público e um panorama do estado, com números do IBGE e a situação dos dados publicados.",
    passos: [
      "Abra o endereço do Observatório. Não é preciso cadastro nem senha.",
      "Escolha o seu perfil: Para o cidadão, Para gestores e profissionais de saúde ou Para pesquisa e ensino. Cada cartão leva direto à seção.",
      "Use o menu superior para ir a Indicadores, Programas Governamentais, Educação e Repositório, Relatório de Impacto, Produção Científica, Metodologia e glossário ou a este guia.",
      "Em “Conjuntos de dados publicados” você vê quantas fontes já têm dados no Observatório.",
    ],
    imagens: [tela("01-inicio.jpg", "Página inicial do Observatório, com o campo de busca, o botão Acessibilidade, o menu superior, a faixa azul de abertura e os quatro números do panorama do estado.", "Tela 1, página inicial: o menu superior leva a cada área; os cartões abaixo da faixa azul levam às seções por perfil.")],
    cartoes: [
      { titulo: "Quem pode usar", texto: "Qualquer pessoa. O acesso administrativo, com login Google, é só da equipe autorizada a publicar dados." },
      { titulo: "Seções em elaboração", texto: "Algumas seções ainda aguardam dados oficiais e estão sinalizadas. Onde não há dado, o site diz “aguardando dados da fonte” em vez de mostrar números de exemplo." },
    ],
  },
  {
    id: "busca",
    titulo: "Encontre o que procura com a busca",
    intro: "O campo Buscar no site, no topo de todas as páginas, procura em seções, programas, termos do glossário e dados publicados.",
    passos: [
      "Clique no campo Buscar no site.",
      "Digite uma ou mais palavras. Acentos e maiúsculas não importam, e todas as palavras digitadas precisam aparecer no resultado.",
      "Os resultados aparecem logo abaixo do campo, com o tipo de cada um (seção, programa, glossário, documento do repositório e outros).",
      "Escolha “Ir para a seção” para abrir a página. Quando o dado tem fonte, há também “Abrir a fonte”, que abre o documento original em outra aba.",
      "Para fechar os resultados, aperte Esc ou clique fora do painel.",
    ],
    imagens: [tela("02-busca.jpg", "Campo de busca no topo da página com a palavra preço digitada e o painel de resultados aberto logo abaixo.", "Tela 2, busca: o painel de resultados abre logo abaixo do campo, sem sair da página em que você está.")],
    cartoes: [
      { titulo: "O que a busca procura", texto: "Seções do site, programas governamentais, termos do glossário e os dados publicados (documentos do repositório, alertas, desabastecimento, pregões e produção científica)." },
      { titulo: "O que tem busca própria", texto: "Os preços de medicamentos e os registros da Anvisa têm uma busca dentro de cada seção, explicadas nas etapas 3 e 4." },
    ],
  },
  {
    id: "precos",
    titulo: "Consulte preços de medicamentos",
    intro: "A seção Preços de medicamentos (CMED) mostra os preços máximos regulados pela Câmara de Regulação do Mercado de Medicamentos, a partir dos dados abertos da Anvisa.",
    passos: [
      "Abra Indicadores e escolha Preços de medicamentos (CMED).",
      "Digite o nome do medicamento, o princípio ativo ou o laboratório, com pelo menos 3 letras. Pode incluir a dose, por exemplo: losartana 50 mg.",
      "Se quiser, filtre pelo tipo de produto (genérico, similar, novo, biológico e outros).",
      "Leia as colunas: PF sem impostos e PF (ICMS 0%) são os preços máximos de venda do fabricante; PMC (ICMS 0%) é o preço máximo de venda ao público.",
      "A primeira consulta pode levar alguns segundos. As seguintes são rápidas.",
    ],
    imagens: [tela("03-precos-cmed.jpg", "Seção Preços de medicamentos com a busca losartana 50 mg e uma tabela de apresentações, laboratórios, tipo e preços em reais.", "Tela 3, preços CMED: cada linha é uma apresentação do medicamento, com laboratório, tipo e os preços máximos.")],
    cartoes: [
      { titulo: "É um teto, não o preço pago", texto: "A CMED define preços máximos. O preço cobrado numa farmácia ou numa compra pública pode ser menor." },
      { titulo: "Para conferir uma compra", texto: "Compare o preço da compra com os valores da CMED para a mesma apresentação. Para as regras de compras públicas, como ICMS e CAP, consulte a fonte oficial, indicada na própria tela." },
    ],
  },
  {
    id: "registros",
    titulo: "Veja se um medicamento tem registro",
    intro: "A seção Registros de medicamentos (Anvisa) mostra quem detém o registro de um medicamento, de que categoria ele é e até quando o registro vale.",
    passos: [
      "Abra Indicadores e escolha Registros de medicamentos (Anvisa).",
      "Busque por medicamento, princípio ativo, empresa, CNPJ ou número do registro, com pelo menos 3 letras.",
      "Use os filtros de Categoria (genérico, similar, novo e outras) e de Situação (ativo, parcial ou inativo).",
      "Leia a empresa detentora, a categoria, a situação, o número do registro, a data em que o registro foi concedido e o vencimento (mês e ano).",
    ],
    imagens: [tela("04-registros-anvisa.jpg", "Seção Registros de medicamentos com a busca losartana e uma tabela de empresas detentoras, categoria, situação, número do registro, data de concessão e vencimento.", "Tela 4, registros: um resultado por número de registro, com a empresa que o detém e a validade.")],
    cartoes: [
      { titulo: "O que é “Parcial”", texto: "O arquivo da Anvisa repete o mesmo registro em várias linhas, cada uma com uma situação. “Parcial” indica que o mesmo registro tem linhas ativas e inativas. O Observatório repete a situação como a Anvisa informa, sem interpretar." },
    ],
    aviso: { titulo: "Registro não é disponibilidade.", texto: "Ter registro na Anvisa não significa que o medicamento esteja disponível no SUS ou em estoque. Para confirmar um registro, use a consulta oficial da Anvisa, indicada na própria tela." },
  },
  {
    id: "estado",
    titulo: "Acompanhe a situação dos dados",
    intro: "A Visão geral dos indicadores mostra, para cada seção, se já há dados publicados, de que fonte e de quando.",
    passos: [
      "Abra Indicadores. A Visão geral é a primeira tela.",
      "Cada cartão resume uma seção: Comparador territorial, Desabastecimento e pregões, Alertas sanitários, Custos e orçamento, Judicialização, Qualidade dos serviços e ATS.",
      "O cartão informa se a seção tem dados publicados, com a fonte e a data de atualização, ou se ainda está aguardando dados.",
      "Clique no cartão para abrir a seção.",
    ],
    imagens: [tela("05-visao-geral.jpg", "Visão geral dos indicadores, com o menu lateral de seções e cartões que informam o estado dos dados de cada seção.", "Tela 5, visão geral: o menu lateral de Indicadores fica à esquerda em todas as seções; os cartões mostram o estado de cada fonte.")],
    cartoes: [
      { titulo: "Alertas sanitários", texto: "Recolhimentos, suspensões e proibições de medicamentos divulgados pela Anvisa, sempre com o link da fonte oficial. A seção mostra os alertas quando a equipe os publica." },
      { titulo: "Desabastecimento e pregões", texto: "Situação de abastecimento do componente especializado e pregões que ajudam a explicá-la. Aguarda os dados oficiais; enquanto isso, a seção avisa em vez de mostrar números de exemplo." },
    ],
  },
  {
    id: "comparador",
    titulo: "Compare municípios",
    intro: "O Comparador territorial coloca até 5 municípios do RN lado a lado, com a mediana do estado e, quando houver, a mediana da região de saúde.",
    passos: [
      "Abra Indicadores e escolha Comparador territorial.",
      "Em “Adicionar município”, escolha até 5 municípios. Para tirar um, clique no x ao lado do nome.",
      "Escolha o Indicador (por exemplo, população do Censo 2022) e o ano.",
      "Quando o indicador for uma contagem, aparece a opção “Mostrar por 10 mil habitantes”. Marque-a para comparar municípios de tamanhos diferentes: o valor de cada município é dividido pela sua população.",
      "As barras mostram cada município e as medianas, e a tabela abaixo traz os dados do IBGE.",
    ],
    imagens: [tela("06-comparador.jpg", "Comparador territorial com a escolha de municípios, o seletor de indicador e ano e o gráfico de barras.", "Tela 6, comparador: demografia do IBGE (Censo 2022) já está disponível; os indicadores de assistência farmacêutica entram quando forem publicados.")],
  },
  {
    id: "programas",
    titulo: "Descubra como obter medicamentos e consulte documentos",
    intro: "Programas Governamentais explica os programas de acesso a medicamentos. Educação e Repositório reúne documentos oficiais, como protocolos e legislação, sempre com link para o original.",
    passos: [
      "Em Programas Governamentais, leia cada programa: o que é, onde obter, o que levar para ter acesso e a fonte oficial.",
      "Confirme sempre o local e os documentos atuais com o serviço de saúde ou com a SESAP-RN, porque as regras podem mudar.",
      "Em Educação e Repositório, use o campo de busca (por título, órgão ou assunto) e os botões de tipo para filtrar os documentos.",
      "Abra o documento pelo link: ele leva à fonte oficial, em outra aba.",
    ],
    imagens: [
      tela("07-programas.jpg", "Página de Programas Governamentais com os cartões dos programas de acesso a medicamentos.", "Tela 7, programas governamentais: cada cartão traz onde obter, como acessar e a fonte oficial."),
      tela("08-repositorio.jpg", "Página Educação e Repositório com busca, filtros por tipo e a lista de documentos oficiais.", "Tela 8, repositório: busca por título, órgão ou assunto e filtro por tipo de documento."),
    ],
  },
  {
    id: "dados",
    titulo: "Baixe os dados",
    intro: "Os conjuntos publicados pelo Observatório podem ser baixados para uso em planilhas, análises e pesquisas.",
    passos: [
      "Abra Indicadores e escolha Dados abertos.",
      "Na tabela, veja a fonte, o período, a data de atualização e o número de linhas de cada conjunto.",
      "Nos conjuntos com dados, escolha CSV (para planilhas) ou JSON (com a descrição das colunas e da fonte).",
      "Conjuntos ainda sem dados mostram “aguardando dados da fonte” e não têm arquivo.",
      "Ao reutilizar os dados, cite a fonte original de cada conjunto.",
    ],
    imagens: [tela("09-dados-abertos.jpg", "Seção Dados abertos com a tabela de conjuntos e os botões CSV e JSON ao lado do conjunto que já tem dados.", "Tela 9, dados abertos: os botões CSV e JSON aparecem nos conjuntos já publicados.")],
    cartoes: [
      { titulo: "Abrindo o CSV no Excel", texto: "O CSV usa ponto e vírgula como separador e texto em UTF-8, o padrão dos dados abertos brasileiros. Se os acentos não aparecerem, importe o arquivo pela opção Dados, De Texto/CSV, escolhendo UTF-8." },
    ],
  },
  {
    id: "fontes",
    titulo: "Entenda de onde vêm os dados",
    intro: "Toda informação mostra a sua fonte. A página Metodologia e glossário explica como cada área do site obtém e trata os dados.",
    passos: [
      "Procure o selo de fonte nas tabelas: ele traz a fonte, o período (quando informado), a data de atualização e se a coleta é automática ou por planilha.",
      "Em Metodologia e glossário, veja o quadro de fontes por área do site, os limites e cuidados e como ler os dados.",
      "No glossário, filtre os termos (como PF, PMC, CAP, CEAF e PCDT) para ver o significado de cada sigla.",
    ],
    imagens: [tela("10-metodologia.jpg", "Página Metodologia e glossário com o quadro que mostra a fonte, a forma de coleta e a atualização de cada área do site.", "Tela 10, metodologia: o quadro mostra de onde vem cada informação e com que frequência ela é atualizada.")],
  },
  {
    id: "assistente",
    titulo: "Pergunte ao assistente",
    intro: "O assistente responde perguntas em linguagem simples, usando só os dados publicados no Observatório e citando a fonte.",
    passos: [
      "Clique no botão azul de mensagem, no canto inferior direito de qualquer página.",
      "Escreva a pergunta, com até 500 caracteres, ou escolha uma das sugestões.",
      "Leia a resposta e confira a fonte que ela cita.",
      "Para fechar a janela, use o botão Fechar ou a tecla Esc.",
    ],
    imagens: [tela("11-assistente.jpg", "Janela do assistente aberta sobre a página inicial, com a mensagem de boas-vindas e as sugestões de perguntas.", "Tela 11, assistente: a janela abre sobre a página, com sugestões de perguntas.")],
    aviso: { titulo: "Cuidado com o que você escreve.", texto: "O assistente usa inteligência artificial e pode errar; confira a fonte indicada. A pergunta é enviada a um serviço de inteligência artificial do Google, então não escreva dados pessoais nem informações de saúde suas ou de outras pessoas. Há limite de perguntas por dia. O assistente não substitui o farmacêutico nem o médico." },
  },
  {
    id: "acessibilidade",
    titulo: "Ajuste o site para você",
    intro: "O botão Acessibilidade, no topo, reúne opções para ler e navegar com mais conforto. Suas escolhas ficam salvas neste navegador.",
    passos: [
      "Clique em Acessibilidade, no cabeçalho.",
      "Aumente ou diminua o texto, de 100% a 175%.",
      "Ligue o alto contraste (fundo preto e texto claro) ou o espaçamento maior entre linhas e letras.",
      "Ligue “Reduzir animações” se movimentos na tela incomodam.",
      "Ligue a Tradução em Libras para abrir o VLibras, do governo federal, que traduz o conteúdo para a Língua Brasileira de Sinais. Ele carrega um serviço externo, por isso só é aberto quando você liga.",
    ],
    imagens: [tela("12-acessibilidade.jpg", "Painel de Acessibilidade aberto no cabeçalho, com os controles de tamanho do texto, alto contraste, espaçamento, animações e Libras.", "Tela 12, acessibilidade: o painel abre no cabeçalho e as escolhas valem para todas as páginas.")],
    cartoes: [
      { titulo: "Só com o teclado", texto: "Aperte Tab ao abrir a página para ver o link “Ir para o conteúdo”. Todos os botões, menus e janelas funcionam com o teclado, e Esc fecha o painel, a busca e o assistente." },
      { titulo: "Leitores de tela", texto: "O site anuncia a seção em que você está a cada mudança de página. Ainda falta validar o uso com pessoas que usam leitores de tela e Libras; sua opinião é bem-vinda." },
    ],
  },
  {
    id: "celular",
    titulo: "Use no celular",
    intro: "O Observatório se adapta a telas pequenas. Tudo o que está neste guia funciona no celular.",
    passos: [
      "O menu superior rola para o lado: deslize para ver todas as áreas.",
      "As tabelas rolam para o lado dentro da própria tabela; a página não precisa ser arrastada.",
      "A busca, a Acessibilidade e o assistente ficam no mesmo lugar que no computador.",
    ],
    imagens: [
      tela("13-celular-inicio.jpg", "Página inicial no celular, com o campo de busca e o botão Acessibilidade empilhados abaixo do título.", "Tela 13, celular: cabeçalho e busca se reorganizam em coluna.", 390, 844),
      tela("14-celular-precos.jpg", "Consulta de preços de medicamentos no celular, com o campo de busca e a tabela de resultados.", "Tela 14, celular: a tabela de preços rola para o lado.", 390, 844),
    ],
  },
];

export const CHECKLIST: string[] = [
  "Conferi a fonte e a data de atualização do que estou lendo.",
  "Lembrei que o preço da CMED é um teto, não o preço pago.",
  "Lembrei que ter registro na Anvisa não garante que o medicamento esteja disponível no SUS.",
  "Confirmei o local e os documentos de um programa com o serviço de saúde ou a SESAP-RN.",
  "Entendi que “aguardando dados da fonte” significa que a informação ainda não foi publicada.",
  "Não escrevi dados pessoais nem de saúde no assistente.",
  "Para decisões sobre o uso de medicamentos, procurei o farmacêutico ou o médico.",
  "Ao reutilizar os dados baixados, citei a fonte original.",
];

export const PERGUNTAS: { pergunta: string; resposta: string }[] = [
  { pergunta: "Preciso me cadastrar para usar?", resposta: "Não. Todo o conteúdo é público. O login com Google é só para a equipe autorizada a publicar dados, na área de Administração." },
  { pergunta: "Por que uma seção diz “aguardando dados da fonte”?", resposta: "Porque a fonte oficial ainda não enviou os dados ao Observatório. O site prefere avisar a mostrar números de exemplo. A Visão geral dos indicadores mostra o estado de cada seção." },
  { pergunta: "O preço da CMED é o que vou pagar na farmácia?", resposta: "Não necessariamente. É o preço máximo permitido; a farmácia pode cobrar menos." },
  { pergunta: "O medicamento tem registro. Vou encontrá-lo no SUS?", resposta: "Não necessariamente. O registro autoriza a comercialização no Brasil, mas não informa se o medicamento é oferecido pelo SUS nem se há estoque. Para saber onde e como obter, veja Programas Governamentais e confirme com o serviço de saúde." },
  { pergunta: "O que significam PF, PMC e CAP?", resposta: "PF é o preço máximo de venda do fabricante a farmácias e distribuidores; PMC é o preço máximo ao consumidor; CAP é um desconto sobre o PF em vendas ao governo, para os produtos sujeitos a ele. Esses e outros termos estão no glossário da página Metodologia e glossário." },
  { pergunta: "Posso usar os dados em um trabalho ou pesquisa?", resposta: "Pode baixar os conjuntos publicados em Dados abertos. Ao reutilizar, cite a fonte original de cada conjunto." },
  { pergunta: "O assistente substitui o farmacêutico?", resposta: "Não. Ele resume os dados publicados e cita a fonte, mas pode errar. Para orientação sobre o uso de medicamentos, procure o farmacêutico ou o médico." },
  { pergunta: "Sou da equipe e quero publicar dados. Como faço?", resposta: "Entre com o Google em Acesso administrativo. Só contas cadastradas pela coordenação do projeto conseguem publicar. Peça o cadastro à coordenação." },
];
