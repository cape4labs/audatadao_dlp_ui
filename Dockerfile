# Установка зависимостей
FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Сборка проекта
FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Финальный образ
FROM node:18-alpine AS runner

WORKDIR /app

# Создание системного пользователя
RUN adduser -S nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]