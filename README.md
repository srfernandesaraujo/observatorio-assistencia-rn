# Observatório da Assistência Farmacêutica do RN

Plataforma pública de transparência de dados da assistência farmacêutica do Rio Grande do Norte.
O site é público; o login (Google) serve apenas para a administração e profissionais autorizados editarem conteúdo e importarem dados.

## Rodar localmente

Pré-requisito: Node.js 20+.

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha `GEMINI_API_KEY`
3. `npm run dev` (http://localhost:3000)

Outros comandos: `npm run lint` (checagem de tipos) e `npm run build`.

## Configuração (portabilidade)

Toda configuração específica da instituição fica em:

- `firebase-applet-config.json`: projeto Firebase (Auth e Firestore)
- variáveis de ambiente do servidor: `GEMINI_API_KEY`, `GEMINI_MODEL`

Para migrar para outra instituição (SESAP-RN, UFRN etc.): criar um projeto Firebase na conta da instituição, trocar o arquivo de configuração, apontar o domínio e autorizá-lo em Authentication > Settings > Authorized domains. Alternativamente, transferir a propriedade do projeto atual via IAM.

## Estado

Em desenvolvimento. O site não exibe dados de exemplo: toda informação vem de uma fonte identificada (API pública ou planilha importada pela equipe) e mostra fonte e data de atualização; onde ainda não há dado, a seção informa que está aguardando a fonte.

## Publicação

O site fica no Firebase Hosting (`observatorio-rn`, https://observatorio-rn.web.app) e a API, no Cloud Run (`observatorio-rn-api`, região `southamerica-east1`). Projeto: `gen-lang-client-0867641807`.

Site (front-end):

```
npm run build
firebase deploy --only hosting:observatorio-rn
```

API (servidor Express):

```
gcloud run deploy observatorio-rn-api --source . --region southamerica-east1 --allow-unauthenticated --max-instances 2 --min-instances 0
```

Chave do Gemini: configure `GEMINI_API_KEY` no serviço Cloud Run (de preferência via Secret Manager). Sem ela, o chat responde em modo offline.

Login Google: todo endereço novo onde o site rodar precisa estar em Firebase Authentication > Settings > Authorized domains.

## Limites do endpoint de IA

`POST /api/ai/query` tem limites para proteger a cota da chave Gemini (variáveis de ambiente opcionais, valores padrão entre parênteses): `AI_MAX_QUERY_CHARS` (500), `AI_PER_IP_PER_MINUTE` (6), `AI_PER_IP_PER_DAY` (40), `AI_GLOBAL_PER_DAY` (400) e `AI_MAX_OUTPUT_TOKENS` (1500). Os contadores ficam em memória e valem por instância do Cloud Run. Defina também um orçamento com alerta de gastos no console do Google Cloud.

## Testes das regras do Firestore

Em `tests/firestore-rules` (dependências separadas, pois o pacote de testes exige outra versão do `firebase`):

```
cd tests/firestore-rules
npm install
RULES_PATH=../../firestore.rules npm test
```

Requer Java e a CLI do Firebase. Cobre leitura pública, escrita só por administradores e validações de tamanho e autoria.

## Usuários e permissões

A conta **srfernandesaraujo@gmail.com** é a super administração (fixa, também nas regras do Firestore): é a única que cadastra usuários, no painel Administração > Usuários e permissões. Cada usuário tem um papel (administrador, professor ou estudante) e uma lista de conjuntos de dados que pode publicar. Os cadastros ficam em `users/{email-em-minúsculas}`; o e-mail da conta Google precisa estar verificado. Para transferir o observatório a outra instituição, troque o e-mail em `firestore.rules` (função `isSuper`) e em `src/lib/perfis.ts`.

## Planilhas-modelo

As planilhas em `public/modelos/*.xlsx` são geradas por `npm run modelos` a partir dos formatos em `src/lib/templates.ts`. Ao mudar um formato, rode o comando e publique o site.

## Acessibilidade

Recursos para o visitante (botão "Acessibilidade" no cabeçalho; as escolhas ficam só no navegador): tamanho do texto (100% a 175%), alto contraste, espaçamento de texto ampliado, redução de animações e tradução em Libras (VLibras, serviço do governo federal, carregado só se o visitante ativar). Também: link "Ir para o conteúdo", foco visível, navegação completa pelo teclado, título da aba e anúncio para leitores de tela a cada mudança de seção, janela do assistente com foco preso e Esc para fechar, idioma da página em pt-BR e tamanhos de texto em rem (mínimo 12 px).

Como manter: use cores de texto com contraste mínimo AA (nada mais claro que `text-slate-500` sobre branco); tamanhos de texto em rem (não use `text-[Npx]`); toda ação com nome acessível; links que abrem em outra aba avisam com texto para leitor de tela. O modo de alto contraste redefine as variáveis de cor do Tailwind em `src/alto-contraste.css`; ao usar uma família de cor nova, inclua-a lá.

Testes automáticos em `tests/acessibilidade` (axe-core + Playwright; `npm install`, `npx playwright install chromium`): `node axe.mjs <url> padrao|contraste` (violações WCAG A/AA/2.2), `node funcional.mjs <url>` (teclado, painel, persistência, chat, Libras) e `node reflow.mjs <url>` (sem rolagem horizontal em 320 px). Rodar a cada mudança de interface, no site publicado e em `npx vite preview --port 4173`. Limite: testes automáticos não substituem uma validação com pessoas usuárias de leitores de tela (NVDA/VoiceOver) e de Libras.
