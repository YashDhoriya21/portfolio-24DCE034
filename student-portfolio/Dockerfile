# Stage 1: Build the React application
FROM node:20-alpine AS build


WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies using clean install if lockfile exists
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build the production bundle into dist/
RUN npm run build

# Stage 2: Serve the production assets with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration with SPA fallback routing & API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the frontend port
EXPOSE 5173

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
