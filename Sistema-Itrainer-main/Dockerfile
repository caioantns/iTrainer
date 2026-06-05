# --- Stage 1: build do frontend (Vite) ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY public ./public
COPY src ./src
COPY index.html vite.config.js ./
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: deps backend (producao) ---
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- Stage 3: imagem final ---
FROM node:20-alpine AS runtime
RUN apk add --no-cache wget tini
WORKDIR /app

# Backend
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Build do frontend (servido como estatico pelo Express)
COPY --from=frontend-build /app/build ./build

# Dir persistente p/ fotos. Coolify monta volume em /app/backend/uploads.
RUN mkdir -p /app/backend/uploads/fotos && chown -R node:node /app/backend/uploads
VOLUME ["/app/backend/uploads"]

USER node
ENV NODE_ENV=production
ENV PORT=3010
EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3010/api/status >/dev/null || exit 1

WORKDIR /app/backend
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start:prod"]
