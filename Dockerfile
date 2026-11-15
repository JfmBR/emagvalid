# Imagem de produção (Render): API + front-end pronto + Chromium para a análise
FROM node:26-trixie-slim

WORKDIR /app
# navegadores do Playwright numa pasta comum, legível pelo usuário sem privilégio
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# dependências primeiro: a camada só refaz quando o package-lock muda
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# inclui as de desenvolvimento: o build e o "prisma migrate deploy" da partida precisam delas
RUN npm ci && npx playwright install --with-deps chromium && npm cache clean --force

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PASTA_WEB=/app/apps/web/dist
USER node
WORKDIR /app/apps/api
EXPOSE 3000
# aplica as migrações pendentes no banco (Neon) e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
