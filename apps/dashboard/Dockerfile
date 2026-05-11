FROM node:22-alpine AS builder
LABEL org.opencontainers.image.title="OpenFinch Dashboard"
LABEL org.opencontainers.image.description="Web dashboard for OpenFinch self-hosted AI web agent infrastructure"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.source="https://github.com/openfinch/openfinch"
LABEL org.opencontainers.image.licenses="MIT"
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml ./
COPY apps/dashboard apps/dashboard

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @openfinch/dashboard

RUN pnpm -F @openfinch/dashboard build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/dashboard/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/index.js"]
