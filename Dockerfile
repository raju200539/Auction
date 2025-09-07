# 1. Installer Stage
FROM node:18-alpine AS installer
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .

# Set the DOCKER_BUILD environment variable
ENV DOCKER_BUILD=true
RUN npm run build
RUN mkdir -p public

# 3. Runner Stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000
CMD ["node", "server.js"]
