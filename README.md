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

Em desenvolvimento. Os dados em `src/data.ts` e `src/rnData.ts` são ilustrativos (fictícios) e serão substituídos por fontes reais.

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

## Administradores

Quem pode importar dados é definido pelos documentos `admins/{email-em-minúsculas}` no Firestore (o e-mail da conta Google precisa estar verificado). O cadastro é feito pela coordenação, pelo console do Firebase; o site não escreve nessa coleção.
