# Base Node.js image
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm run install-all

# Copy all other files
COPY . .

# Build frontend with relative API URL
ENV REACT_APP_API_URL=/api
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/ || exit 1

# Make the startup script executable
RUN chmod +x ./start-railway.sh

# Set default environment variables - will be overridden by Railway
ENV NODE_ENV=production
ENV PORT=5000
ENV REACT_APP_API_URL=/api

# Make the backend directory writable for logs
RUN mkdir -p /app/backend/logs && chmod -R 777 /app/backend

# Command to run the app
CMD ["./start-railway.sh"]
