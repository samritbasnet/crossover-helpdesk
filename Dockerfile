# Dockerfile for backend deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
WORKDIR /app/server

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ .

# Create data directory for SQLite
RUN mkdir -p /app/server/data

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=./helpdesk.db

# Start the application
CMD ["npm", "start"]
