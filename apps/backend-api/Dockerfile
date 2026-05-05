FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend-api/package.json apps/backend-api/package.json
COPY apps/desktop-app/package.json apps/desktop-app/package.json
COPY apps/ai-worker/package.json apps/ai-worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/shared-utils/package.json packages/shared-utils/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

RUN pnpm --filter @omnia/backend-api prisma:generate
RUN pnpm --filter @omnia/backend-api build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend-api/package.json ./apps/backend-api/package.json
COPY --from=builder /app/apps/backend-api/node_modules ./apps/backend-api/node_modules
COPY --from=builder /app/apps/backend-api/dist ./apps/backend-api/dist
COPY --from=builder /app/apps/backend-api/prisma ./apps/backend-api/prisma

EXPOSE 4000

CMD ["node", "apps/backend-api/dist/main.js"]
