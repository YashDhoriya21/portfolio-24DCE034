FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source files
COPY . .

# Expose backend service port
EXPOSE 5000

# Set default environment variables (can be overridden by docker-compose)
ENV PORT=5000 \
    HOST=0.0.0.0 \
    NODE_ENV=production

# Start Express server
CMD ["node", "server.js"]
