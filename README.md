# Advanced Web Development Frameworks (ITUE301)
### Full-Stack Task Manager Portfolio — Practicals 1 to 12
**Student:** Yash Dhoriya (24DCE034)  
**Subject:** Advanced Web Development Frameworks (ITUE301) | Semester: 5th  

[![CI Pipeline](https://github.com/yashdhoriya/portfolio-24DCE034/actions/workflows/ci.yml/badge.svg)](https://github.com/yashdhoriya/portfolio-24DCE034/actions/workflows/ci.yml)
*(Replace `yashdhoriya/portfolio-24DCE034` with your repository path when pushing to GitHub)*

---

## Repository Overview

This repository contains the complete full-stack web application developed for **Practicals 1 through 12**, integrating **React + Vite** on the frontend, **Node.js + Express** on the backend, **MongoDB** for persistence, **node-cache** for query optimization, **EventEmitter** for asynchronous event processing, **Docker Compose** for containerization, and **GitHub Actions** for automated CI/CD.

```text
AWDF/
├── .github/workflows/ci.yml    ← Practical 12: GitHub Actions CI workflow
├── docker-compose.yml          ← Practical 11: Multi-container Docker orchestration
├── docs/                       ← Practical reports & lab documentation
│   ├── practical-8-performance.md        ← P8: Lazy loading report
│   ├── practical-9-cache-performance.md  ← P9: In-memory cache report
│   ├── practical-10-events.md            ← P10: EventEmitter background processing
│   ├── practical-11-docker.md            ← P11: Docker & Compose orchestration
│   └── practical-12-ci-cd.md             ← P12: CI/CD testing & pipeline
├── student-portfolio/          ← React + Vite frontend application (P1-P4, P6, P7, P8, P11)
└── task-backend/               ← Node.js + Express + MongoDB backend (P5, P6, P7, P9, P10, P11, P12)
```

---

## Practical Completion Status

| Practical | Topic | Status | Key Deliverable | Documentation |
|-----------|-------|--------|-----------------|---------------|
| 1 | React Components & Props | Complete | Portfolio with Header, About, Skills, Footer | Component tree in `student-portfolio/src` |
| 2 | React State & Routing | Complete | Multi-route SPA using React Router DOM v7 | Navigation in `student-portfolio/src/App.jsx` |
| 3 | API Integration | Complete | Public GitHub API integration with loader | `student-portfolio/src/pages/ProjectsPage.jsx` |
| 4 | RESTful API with Express | Complete | Express CRUD endpoints & middleware | `task-backend/routes/taskRoutes.js` |
| 5 | MongoDB & Mongoose ODM | Complete | Mongoose schemas with validation | `task-backend/models/Task.js` |
| 6 | Full Stack Integration | Complete | React frontend connected to Express API | `student-portfolio/src/api/api.js` |
| 7 | Auth & JWT Pipeline | Complete | Password hashing (bcrypt) & JWT auth | `task-backend/middleware/auth.js` |
| 8 | Performance & Lazy Loading | Complete | Route-based code-splitting with `React.lazy` | [`docs/practical-8-performance.md`](docs/practical-8-performance.md) |
| 9 | In-Memory Caching | Complete | 60s TTL cache with invalidation & stats | [`docs/practical-9-cache-performance.md`](docs/practical-9-cache-performance.md) |
| 10 | Asynchronous Event Processing | Complete | Node.js EventEmitter notifications | [`docs/practical-10-events.md`](docs/practical-10-events.md) |
| 11 | Docker & Docker Compose | Complete | Multi-container setup (Nginx + Node + Mongo) | [`docs/practical-11-docker.md`](docs/practical-11-docker.md) |
| 12 | CI/CD Pipeline (GitHub Actions) | Complete | Automated testing (Jest/Supertest) & CI | [`docs/practical-12-ci-cd.md`](docs/practical-12-ci-cd.md) |

---

## Local Setup & Running Instructions

### Method A: Local Development Server

Open two separate terminals:

#### Terminal 1 — Backend
```powershell
cd task-backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*

#### Terminal 2 — Frontend
```powershell
cd student-portfolio
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### Method B: Containerized Stack (Docker Compose)

Requires Docker Desktop on your system:

```powershell
# 1. Validate configuration
docker compose config

# 2. Build and launch all 3 containers
docker compose up --build

# 3. Check container status
docker compose ps

# 4. View backend logs (confirming events and DB)
docker compose logs -f backend

# 5. Stop services (preserving data volume)
docker compose down
```

- **Frontend:** `http://localhost:5173` (Served by Nginx Alpine with SPA routing and API proxy)
- **Backend:** `http://localhost:5000` (Node.js 18 Express)
- **MongoDB:** `mongodb://localhost:27017` (Named volume `mongo_data` persists across restarts)

---

## Running Automated Tests (Practical 12)

```powershell
cd task-backend
npm test
```

### Actual Test Results (Verified)
- **Test Suites:** 1 passed, 1 total
- **Tests:** 11 passed, 11 total
- **Coverage Areas:** Health Check (`GET /`), Auth Rejection (401), Input Validation (400), Cache Telemetry (`GET /debug/cache`), Practical 10 `task-created` & `task-deleted` event dispatching, and safe error listener resilience.

---

## Building Frontend for Production

```powershell
cd student-portfolio
npm run build
```
- **Output:** Clean production bundle generated in `student-portfolio/dist/`.
