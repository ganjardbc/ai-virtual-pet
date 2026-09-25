FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.9

# Copy monorepo manifests first for dependency caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/simulation/package.json ./packages/simulation/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared workspace packages (api resolves them via node_modules -> dist)
RUN pnpm --filter @ai-virtual-pet/domain build
RUN pnpm --filter @ai-virtual-pet/contracts build
RUN pnpm --filter @ai-virtual-pet/simulation build

# Build the API (emits apps/api/dist)
RUN pnpm --filter @ai-virtual-pet/api build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the fully built workspace (pnpm symlinks are relative, so they survive the copy)
COPY --from=builder /app ./

RUN chmod +x apps/api/docker-entrypoint.sh

EXPOSE 3000

CMD ["apps/api/docker-entrypoint.sh"]
