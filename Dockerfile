# 1. Builder Stage: Install dependencies and build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Runner Stage: Create the final, lean production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone Next.js server output from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 3000

# Set the host and port for the server
ENV PORT 3000
ENV HOSTNAME 0.0.0.0

# Start the server
# The standalone output creates a minimal server.js file
CMD ["node", "server.js"]
