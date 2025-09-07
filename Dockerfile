# --- Base Stage ---
# Use the official Node.js image as a base.
# Using a specific version is good practice for reproducibility.
FROM node:18-alpine AS base

# Set the working directory in the container.
WORKDIR /app

# --- Dependencies Stage ---
# This stage is dedicated to installing dependencies, and its results can be cached.
FROM base AS deps

# Copy package.json and package-lock.json to the working directory.
COPY package.json package-lock.json* ./

# Install dependencies.
RUN npm ci

# --- Builder Stage ---
# This stage builds the Next.js application.
FROM base AS builder

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code.
COPY . .

# Ensure the public directory exists, even if it's empty.
# This prevents the final COPY command from failing if there are no static assets.
RUN mkdir -p public

# Build the Next.js application.
RUN npm run build

# --- Runner Stage ---
# This is the final, small, and optimized stage for running the application.
FROM base AS runner

WORKDIR /app

# Set the environment to production.
ENV NODE_ENV=production

# Create a non-root user and group for security purposes.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to the non-root user.
USER nextjs

# Expose the port the app will run on.
EXPOSE 3000

# Set the port environment variable.
ENV PORT 3000

# The command to start the application.
CMD ["node", "server.js"]
