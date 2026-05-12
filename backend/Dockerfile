# Multi-stage build for optimized production image
# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the built application
COPY --from=builder /app/dist ./dist

# Create directory for dragontail data
RUN mkdir -p /app/dragontail-data

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]