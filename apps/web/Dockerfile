FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.9

# Copy monorepo manifests first for dependency caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/simulation/package.json ./packages/simulation/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# The web bundle mirrors the debug-API flag at build time; the deployment passes it in.
ARG ENABLE_DEBUG_API=false
ENV ENABLE_DEBUG_API=${ENABLE_DEBUG_API}

RUN pnpm --filter @ai-virtual-pet/web build

FROM nginx:stable-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
