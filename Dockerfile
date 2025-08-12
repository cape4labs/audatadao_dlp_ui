FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

FROM node:18-alpine AS runner

WORKDIR /app

RUN adduser -S nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy cache directory and give rights to the nextjs user
COPY --from=builder /app/.next/cache ./.next/cache

RUN chown -R nextjs:nextjs .next

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
