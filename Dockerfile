# --- STAGE 1: Build ---
FROM node:20-slim AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/web/package.json ./apps/web/

# Install dependencies
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the application
COPY . .

# Rebuild sqlite3 specifically for the Docker container architecture
# This ensures native bindings work correctly
RUN pnpm rebuild sqlite3

# Build the frontend and landing page (monolith structure)
# This will populate apps/backend/public/app and apps/backend/public/web
RUN pnpm run build:monolith

# --- STAGE 2: Runner ---
# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS runner

WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Set environment to production
ENV NODE_ENV=production
ENV PORT=2001

# Copy only what's needed for the backend to run
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/node_modules ./node_modules

# Ensure storage directory exists
RUN mkdir -p /app/apps/backend/storage

# Expose the application port
EXPOSE 2001

# Start the application
CMD ["pnpm", "run", "start"]
