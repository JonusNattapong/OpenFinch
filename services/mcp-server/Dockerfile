FROM node:22-alpine AS builder
LABEL org.opencontainers.image.title="OpenFinch MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Claude Desktop integration"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.source="https://github.com/openfinch/openfinch"
LABEL org.opencontainers.image.licenses="MIT"
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml ./
COPY services/mcp-server services/mcp-server

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter openfinch-mcp

RUN pnpm -F openfinch-mcp build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/services/mcp-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8788
CMD ["node", "dist/index.js"]
