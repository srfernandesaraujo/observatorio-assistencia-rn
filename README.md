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
