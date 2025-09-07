# 1. Installer Stage: Install dependencies and build the application
FROM node:18-alpine AS installer
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Runner Stage: Create a minimal production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment variable for production
ENV NODE_ENV=production

# Copy the standalone output from the installer stage
COPY --from=installer /app/public ./public
COPY --from=installer --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the user to the non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000

# Start the Next.js application
CMD ["node", "server.js"]
