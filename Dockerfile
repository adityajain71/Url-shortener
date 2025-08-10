# Base Node.js image
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm run install-all

# Copy all other files
COPY . .

# Build frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the app
CMD ["npm", "start"]
