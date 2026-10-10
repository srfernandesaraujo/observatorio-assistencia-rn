# Servidor do Observatório (rotas /api/*) para o Cloud Run.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# O Cloud Run define PORT; o servidor também serve o front-end como alternativa ao Hosting.
CMD ["node", "dist/server.cjs"]
