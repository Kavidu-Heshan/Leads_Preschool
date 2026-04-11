# Multi-stage Dockerfile for LEADS_PRESCHOOL MERN Application

# ========== STAGE 1: Build Frontend ==========
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
COPY client/package-lock.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy client source code
COPY client/ ./

# Build Vite frontend
RUN npm run build

# ========== STAGE 2: Backend Setup ==========
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY server/package*.json server/package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY server/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create uploads directory for event photos
RUN mkdir -p uploads/event-photos

# Expose backend port
EXPOSE 3002

# Start the backend server
CMD ["npm", "start"]