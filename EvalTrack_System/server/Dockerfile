# Backend Dockerfile for EvalTrack System
# This Dockerfile builds the Node.js backend that also serves the frontend static files

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY . .

# The frontend files will be mounted via docker-compose or copied in a multi-stage build
# For now, we assume FRONTEND_PATH env var will point to the frontend

# Create necessary directories
RUN mkdir -p /app/logs

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (can be overridden in docker-compose)
ENV NODE_ENV=production
ENV PORT=3000
ENV FRONTEND_PATH=/app/frontend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/auth/login', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["npm", "start"]
