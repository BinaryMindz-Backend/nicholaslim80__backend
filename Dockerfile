# # =======================
# # 1️⃣ Builder Stage
# # =======================
# FROM node:22 AS builder

# WORKDIR /usr/src/app

# # Enable pnpm
# RUN corepack enable && corepack prepare pnpm@latest --activate

# # Copy only package files first
# COPY package.json pnpm-lock.yaml ./

# # Install all dependencies (dev + prod) for building
# RUN pnpm install --frozen-lockfile && pnpm store prune

# # Copy prisma and source code
# COPY prisma ./prisma
# COPY . .

# # Generate Prisma client & build app
# RUN npx prisma generate
# RUN pnpm build


# # =======================
# # Production Stage
# # =======================
# FROM node:22 AS production

# WORKDIR /usr/src/app

# # Copy only prod dependencies + build output
# COPY --from=builder /usr/src/app/package*.json ./
# COPY --from=builder /usr/src/app/node_modules ./node_modules
# COPY --from=builder /usr/src/app/dist ./dist
# COPY --from=builder /usr/src/app/src/common/services/templates ./dist/src/common/services/templates
# COPY --from=builder /usr/src/app/prisma ./prisma

# # Set production env
# ENV NODE_ENV=production

# # Expose port
# EXPOSE 5000

# # Run app
# CMD ["node", "dist/src/main"]


# =======================
# 1️⃣ Builder Stage
# =======================
FROM node:22 AS builder

WORKDIR /usr/src/app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile && pnpm store prune

# Copy prisma and source code
COPY prisma ./prisma
COPY . .

# Generate Prisma client & build app
RUN npx prisma generate
RUN pnpm build


# =======================
# 2️⃣ Production / Dev Stage
# =======================
FROM node:22 AS production

WORKDIR /usr/src/app

# Enable pnpm (for local dev)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies and build
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

# Default command for prod (compiled build)
CMD ["node", "dist/src/main"]
