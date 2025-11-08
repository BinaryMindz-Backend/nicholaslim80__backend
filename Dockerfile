# Use Node 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma folder first
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the source code
COPY . .

# ✅ Fix permissions for dist and node_modules
RUN mkdir -p /usr/src/app/dist && chmod -R 777 /usr/src/app

# Expose port
EXPOSE 3000

# Default command
CMD ["pnpm", "run", "start:dev"]


