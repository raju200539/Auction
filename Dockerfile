
# Base image
FROM node:18-alpine AS base

WORKDIR /app
# Install dependencies
COPY package*.json ./
RUN npm ci

# Builder image
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
# "dev" is the folder with your code
RUN npm run build

# Production image
FROM base
WORKDIR /app
ENV NODE_ENV=production

# User and group for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Conditionally copy public folder only if it exists
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
