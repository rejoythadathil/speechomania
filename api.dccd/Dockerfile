FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts && bun --bun node_modules/prisma/build/index.js --version

FROM oven/bun:1.3.14-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js utils.js ./
COPY config ./config
COPY common-service ./common-service
COPY src ./src
COPY scripts ./scripts
COPY prisma.config.mjs ./
COPY prisma ./prisma
USER bun
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD ["bun", "-e", "fetch('http://127.0.0.1:4000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["bun", "server.js"]
