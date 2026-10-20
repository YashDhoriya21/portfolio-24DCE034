# Practical 11 — Containerization with Docker and Docker Compose

**Student:** Yash Dhoriya (24DCE034)  
**Subject:** Advanced Web Development Frameworks (ITUE301) | Semester: 5th  
**Date:** 20 October 2026  
**Project:** Full-Stack Task Manager — Multi-Container Docker Deployment  

---

## 1. Objective

Containerize the complete full-stack Task Management application (React frontend, Node.js/Express backend, and MongoDB database) using Docker and orchestrate all three services seamlessly using Docker Compose with persistent data storage and inter-service networking.

---

## 2. Architecture & Service Topology

```text
Host Machine (Windows / Browser)
  │
  ├────── Port 5173 ──────► [frontend: Nginx Alpine (Multi-stage)]
  │                              │
  │                              ├─► Serves React static SPA (/index.html)
  │                              └─► Reverse proxies /auth/ & /tasks/ ──┐
  │                                                                     │
  ├────── Port 5000 ──────► [backend: Node.js 18 Express] ◄────────────┘
  │                              │
  │                              └─► Connects via 'mongodb://mongodb:27017/taskdb'
  │                                                                     │
  └────── Port 27017 ─────► [mongodb: mongo:6-jammy] ◄──────────────────┘
                                 │
                                 └── Volume: 'mongo_data' (/data/db)
```

### Network & Data Isolation
- **Network (`awdf-network`):** An isolated Docker bridge network allowing inter-container DNS resolution (e.g. `backend` connects to `mongodb:27017`, and `frontend` proxies to `backend:5000`).
- **Volume (`awdf-mongo-data`):** A named Docker volume bound to `/data/db` inside the MongoDB container, ensuring all user and task records persist across container restarts, stops, and rebuilds.

---

## 3. Configuration Files Overview

| File | Purpose |
|------|---------|
| `student-portfolio/Dockerfile` | Multi-stage build compiling React with Vite and serving via lightweight Nginx Alpine. |
| `student-portfolio/nginx.conf` | Handles client-side SPA routing (`try_files`) and proxies API calls to `http://backend:5000`. |
| `student-portfolio/.dockerignore` | Excludes `node_modules`, `dist`, `.env`, and Git history from the build context. |
| `task-backend/Dockerfile` | Node.js 18 Alpine runtime with layer-cached dependency installation and production environment. |
| `task-backend/.dockerignore` | Excludes `node_modules`, `.env`, test files, and Git metadata from backend images. |
| `docker-compose.yml` | Root orchestration file defining `mongodb`, `backend`, and `frontend` services. |

---

## 4. Multi-Stage Build & Routing Solution

### Why Multi-Stage Frontend Build?
A standard Node.js image with Vite dev server is approximately 1.1 GB. By utilizing a multi-stage build:
1. **Stage 1 (Builder):** Uses `node:18-alpine` to install dependencies and execute `npm run build`, producing an optimized static asset bundle in `/app/dist`.
2. **Stage 2 (Runtime):** Copies only the compiled `/dist` directory into `nginx:alpine` (~25 MB total image size).

### Nginx SPA Fallback & API Proxy
Because React Router DOM v7 manages routes on the client side, refreshing `/tasks` or `/projects` would trigger a 404 on traditional web servers. Our `nginx.conf` solves this with:

```nginx
# SPA Fallback
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}

# Reverse Proxy to Backend
location /auth/ {
    proxy_pass http://backend:5000/auth/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /tasks/ {
    proxy_pass http://backend:5000/tasks/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

**Benefits:**
- Eliminates browser CORS issues (requests to `/auth` and `/tasks` are same-origin on port `5173`).
- Host browser does not need to know or resolve internal container hostnames (`backend`).

---

## 5. Docker Compose Specification (`docker-compose.yml`)

```yaml
services:
  mongodb:
    image: mongo:6-jammy
    container_name: awdf-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  backend:
    build:
      context: ./task-backend
      dockerfile: Dockerfile
    container_name: awdf-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - HOST=0.0.0.0
      - MONGO_URI=mongodb://mongodb:27017/taskdb
      - JWT_SECRET=${JWT_SECRET:-practical_11_secure_jwt_secret_token_key_32chars}
      - CORS_ORIGIN=http://localhost:5173
      - NODE_ENV=production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - app-network

  frontend:
    build:
      context: ./student-portfolio
      dockerfile: Dockerfile
    container_name: awdf-frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mongo_data:
    name: awdf-mongo-data

networks:
  app-network:
    name: awdf-network
    driver: bridge
```

---

## 6. Execution & Verification Guide

### Pre-Requisite
Ensure Docker Desktop is installed and running on Windows.

### Step 1: Validate Compose Syntax
```powershell
docker compose config
```

### Step 2: Build and Start All Containers
```powershell
docker compose up --build
```
*(Or run in background with `docker compose up --build -d`)*

### Step 3: Verify Running Containers
```powershell
docker compose ps
```
Expected output:
- `awdf-mongodb`: Up (healthy), port 0.0.0.0:27017->27017/tcp
- `awdf-backend`: Up, port 0.0.0.0:5000->5000/tcp
- `awdf-frontend`: Up, port 0.0.0.0:5173->5173/tcp

### Step 4: End-to-End Application Testing
1. Open browser at `http://localhost:5173/tasks`.
2. Register a new user (e.g., `docker_user@test.com`, password `secret123`).
3. Log in with the registered credentials.
4. Create a task titled `"Verify Docker Container Stack"`.
5. Check backend logs:
   ```powershell
   docker compose logs -f backend
   ```
   Confirm the `task-created` event notification appears 2 seconds after the HTTP 201 response.
6. Refresh the browser (`F5`) — confirm task persists from MongoDB.
7. Test persistence across container restarts:
   ```powershell
   docker compose down
   docker compose up -d
   ```
   Refresh `http://localhost:5173/tasks` and verify the task is still present.

### Step 5: Tear Down
```powershell
# Stop containers but keep volume
docker compose down

# Stop containers and wipe volume (fresh start)
docker compose down -v
```

---

## 7. Troubleshooting & Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `MongooseServerSelectionError` / `ECONNREFUSED` | Backend connecting to `localhost:27017` instead of Compose service | Use `mongodb://mongodb:27017/taskdb` in `MONGO_URI`. |
| `Bind for 0.0.0.0:5000 failed: port is already allocated` | A local Node process or previous container is using port 5000 | Kill local Node process or stop previous container with `docker stop <id>`. |
| 404 on page refresh in browser | Missing SPA fallback in web server | Ensure `try_files $uri $uri/ /index.html;` is present in `nginx.conf`. |
| Extremely slow Docker build | `node_modules` is being copied into Docker build context | Verify `.dockerignore` exists in both `student-portfolio` and `task-backend`. |
| Backend starts before MongoDB is ready | Race condition during database bootstrap | Use Docker Compose `depends_on` with `condition: service_healthy` and `mongosh` ping. |
