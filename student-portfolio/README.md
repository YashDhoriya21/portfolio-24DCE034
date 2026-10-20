# Advanced Web Development — Full-Stack Task Manager
### Practicals 1 through 12 | Yash Dhoriya (24DCE034)

[![CI Pipeline](https://github.com/yashdhoriya/portfolio-24DCE034/actions/workflows/ci.yml/badge.svg)](https://github.com/yashdhoriya/portfolio-24DCE034/actions/workflows/ci.yml)
*(Note: If your repository is located at a different GitHub URL, replace `yashdhoriya/portfolio-24DCE034` with your `<username>/<repo>`)*

A complete, production-ready full-stack task management application built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend), demonstrating core concepts from AWDF Practicals 1–12.

---

## Technology Stack

| Layer | Technology | Version / Spec |
|-------|-----------|----------------|
| Frontend | React, React Router DOM, Vite | React 19, React Router DOM v7, Vite 8 |
| Backend | Node.js, Express, Mongoose | Node.js v18+, Express 5, Mongoose 9 |
| Database | MongoDB | MongoDB Atlas (Cloud) / Local MongoDB / Docker MongoDB 6 |
| Auth & Security | JWT, bcrypt | `jsonwebtoken`, `bcryptjs` |
| Caching | In-Memory Cache | `node-cache` (TTL = 60 s, per-user isolation) |
| Events (P10) | Event-Driven Architecture | Node.js built-in `EventEmitter` |
| Containerization (P11) | Docker & Docker Compose | Multi-stage Nginx frontend, Node backend, MongoDB 6 service |
| CI/CD Pipeline (P12) | GitHub Actions & Jest | Ubuntu runners, MongoDB service container, Supertest |
| Styling | Vanilla CSS | Custom CSS variables with light/dark theme |

---

## Folder Structure

```text
AWDF/
├── .github/
│   └── workflows/
│       └── ci.yml              ← Practical 12: GitHub Actions CI workflow
├── docs/                       ← Practical reports & lab documentation
│   ├── practical-8-performance.md        ← P8: Lazy loading report
│   ├── practical-9-cache-performance.md  ← P9: In-memory cache report
│   ├── practical-10-events.md            ← P10: EventEmitter background processing
│   ├── practical-11-docker.md            ← P11: Docker & Compose orchestration
│   └── practical-12-ci-cd.md             ← P12: CI/CD testing & pipeline
├── docker-compose.yml          ← Practical 11: Multi-container orchestration
│
├── student-portfolio/          ← React + Vite frontend (Practicals 1–4, 6, 7, 8, 11)
│   ├── src/
│   │   ├── api/api.js          ← Central API client with relative proxy support
│   │   ├── context/AuthContext.jsx  ← JWT auth state & context
│   │   ├── pages/
│   │   │   ├── Home.jsx        ← Landing page (Practical 1, eagerly loaded)
│   │   │   ├── ProjectsPage.jsx ← GitHub repos (Practical 3, lazy-loaded P8)
│   │   │   ├── Contact.jsx     ← Controlled contact form (Practical 2, lazy P8)
│   │   │   ├── TasksPage.jsx   ← Task CRUD + Auth UI (P6/P7, lazy P8)
│   │   │   └── NotFound.jsx    ← 404 page (lazy-loaded P8)
│   │   ├── components/
│   │   │   ├── NavBar.jsx      ← Navigation with dark mode toggle
│   │   │   ├── Toast.jsx       ← Real-time notifications
│   │   │   ├── Spinner.jsx     ← Loading indicator
│   │   │   └── ...             ← Other reusable components
│   │   ├── App.jsx             ← React Router + Suspense code splitting
│   │   ├── main.jsx            ← Client entry point
│   │   └── index.css           ← Design system & tokens
│   ├── nginx.conf              ← P11: Nginx SPA fallback routing & backend proxy
│   ├── Dockerfile              ← P11: Multi-stage Docker build (Node -> Nginx)
│   ├── .dockerignore           ← Docker ignore rules
│   ├── vite.config.js          ← Dev and preview proxy configurations
│   └── package.json
│
└── task-backend/               ← Express + MongoDB backend (Practicals 5, 6, 7, 9, 10, 11, 12)
    ├── events/
    │   └── taskEvents.js       ← P10: Dedicated EventEmitter singleton
    ├── listeners/
    │   └── taskListeners.js    ← P10: Registered event listeners (2s async delay)
    ├── models/
    │   ├── Task.js             ← Mongoose Task schema
    │   └── User.js             ← Mongoose User schema
    ├── routes/
    │   ├── authRoutes.js       ← /auth/register, /auth/login, /auth/me
    │   └── taskRoutes.js       ← /tasks CRUD with cache & event emission
    ├── middleware/
    │   ├── auth.js             ← JWT verification middleware
    │   └── validateTask.js     ← Payload validation middleware
    ├── cache/
    │   └── taskCache.js        ← node-cache instance & telemetry counters
    ├── tests/
    │   └── api.test.js         ← P12: Automated test suite (Jest + Supertest)
    ├── app.js                  ← P12: Decoupled Express app instance
    ├── server.js               ← HTTP listener & MongoDB connection entry point
    ├── Dockerfile              ← P11: Node 18 Alpine container image
    ├── .dockerignore           ← Backend Docker exclusion rules
    └── package.json            ← Includes "test": "jest ..." script
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **MongoDB** (Atlas connection or local MongoDB on port 27017)
- **Docker & Docker Compose** (Optional for containerized mode)

---

## Quick Start — Local Development

Open two terminal windows:

### Terminal 1 — Backend (`task-backend`)
```bash
cd task-backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### Terminal 2 — Frontend (`student-portfolio`)
```bash
cd student-portfolio
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

Open your browser at **http://localhost:5173**.

---

## Practical 10 — Asynchronous Processing with Event-Driven Architecture

Practical 10 introduces decoupled, background processing for task events using Node.js's native `EventEmitter`:

1. **Decoupled Architecture:**
   - On `POST /tasks`, the task is saved to MongoDB, cache is invalidated, and the HTTP `201 Created` response is sent **promptly**.
   - Immediately after sending the response, `taskEvents.emit('task-created', payload)` is triggered.
   - A dedicated listener in `listeners/taskListeners.js` processes notifications asynchronously using a 2-second simulated delay (`setTimeout`).
2. **Deletion Auditing:**
   - On `DELETE /tasks/:id`, a `task-deleted` event is emitted after returning HTTP 200, invoking an audit logging listener.
3. **Safe Error Handling:**
   - Any malformed payloads or listener errors are trapped and emitted to a safe `error` event handler without crashing the server process.

Detailed report, timing measurements, and execution logs: [`docs/practical-10-events.md`](docs/practical-10-events.md).

---

## Practical 11 — Containerization with Docker & Docker Compose

Practical 11 containerizes the frontend, backend, and MongoDB into three interconnected services managed by Docker Compose:

### Compose Services
- `frontend`: Multi-stage build (Node.js builds Vite bundle; Nginx Alpine serves static files on port `5173` with SPA fallback routing).
- `backend`: Node.js 18 Alpine running Express on port `5000`.
- `mongodb`: Official `mongo:6-jammy` database with a named persistent volume (`mongo_data`) on port `27017`.

### Docker Commands
```bash
# Validate Compose configuration
docker compose config

# Build images and start all 3 services
docker compose up --build

# Run in background (detached)
docker compose up --build -d

# Inspect status
docker compose ps

# View backend logs (confirm events and DB connection)
docker compose logs -f backend

# Stop services and keep database data
docker compose down

# Stop and reset database volume
docker compose down -v
```

Detailed architecture and troubleshooting guide: [`docs/practical-11-docker.md`](docs/practical-11-docker.md).

---

## Practical 12 — CI/CD Pipeline with GitHub Actions

Practical 12 implements continuous integration via `.github/workflows/ci.yml`:

1. **Triggers:** Automatically on every `push` and `pull_request` to the `main` branch.
2. **MongoDB Service Container:** Runs a healthy MongoDB instance in Ubuntu runners without requiring external credentials.
3. **Automated Test Suite:** Runs 11 real assertions across Health Check, Security/Auth (401), Input Validation (400), Cache Telemetry, and Practical 10 EventEmitter reliability using Jest & Supertest.
4. **Frontend Production Build:** Compiles the React/Vite frontend in CI to prevent broken production bundles.

### Running Backend Tests Locally
```bash
cd task-backend
npm test
```

### Demonstration of Failed vs Passed Pipeline Runs
- **Deliberate Failure:** In `task-backend/tests/api.test.js`, changing `expect(res.statusCode).toBe(200)` to `201` triggers a non-zero exit code in CI and displays a Red Cross (❌) on GitHub.
- **Recovery:** Reverting back to `200` triggers a passing run with a Green Checkmark (✅).

Detailed test cases, configuration, and walkthrough: [`docs/practical-12-ci-cd.md`](docs/practical-12-ci-cd.md).

---

## API Endpoints Reference

### Auth (Public)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `{"email","password"}` | Register new user |
| POST | `/auth/login` | `{"email","password"}` | Authenticate and obtain JWT token |
| GET | `/auth/me` | — (Bearer token header) | Return profile of current user |

### Tasks (Protected — Requires `Authorization: Bearer <token>`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/tasks` | — | Get all tasks for user (60s cache) |
| GET | `/tasks/:id` | — | Get specific task by ID |
| POST | `/tasks` | `{"title","description","priority","completed"}` | Create task, invalidate cache, emit `task-created` |
| PUT | `/tasks/:id` | `{"title","description","priority","completed"}` | Update task, invalidate cache |
| DELETE | `/tasks/:id` | — | Delete task, invalidate cache, emit `task-deleted` |

### System & Diagnostics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API health check status and version |
| GET | `/debug/cache` | In-memory cache hit/miss telemetry |

---

## Practical Completion Status

| Practical | Topic | Status | Documentation |
|-----------|-------|--------|---------------|
| 1 | React Components and Props | Complete | Source code in `student-portfolio` |
| 2 | React State and Forms | Complete | Controlled inputs in Contact page |
| 3 | React Hooks and API Integration | Complete | GitHub Repositories on Projects page |
| 4 | Express REST API | Complete | In-memory CRUD foundation |
| 5 | MongoDB + Mongoose Integration | Complete | Task & User Mongoose models |
| 6 | Full Stack Integration | Complete | React frontend connected to Express API |
| 7 | Authentication and JWT Pipeline | Complete | Bcrypt hashing & JWT verification |
| 8 | Lazy Loading and Performance | Complete | [`docs/practical-8-performance.md`](docs/practical-8-performance.md) |
| 9 | In-Memory Caching (node-cache) | Complete | [`docs/practical-9-cache-performance.md`](docs/practical-9-cache-performance.md) |
| 10 | Asynchronous Processing with Events | Complete | [`docs/practical-10-events.md`](docs/practical-10-events.md) |
| 11 | Containerization (Docker Compose) | Complete | [`docs/practical-11-docker.md`](docs/practical-11-docker.md) |
| 12 | CI/CD Pipeline (GitHub Actions) | Complete | [`docs/practical-12-ci-cd.md`](docs/practical-12-ci-cd.md) |
