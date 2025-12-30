# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code and config files
COPY . .

# Build Next.js application
# NEXT_PUBLIC_API_URL will be set at build time via build args or env
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy built files and necessary config from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

# Expose port (Koyeb will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]

