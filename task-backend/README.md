# Task Management Backend — Practicals 5, 6, 7 & 9

Node.js + Express + MongoDB + Mongoose full-stack backend covering:

| Practical | Feature |
|-----------|---------|
| 5 | MongoDB + Mongoose schema with validation |
| 6 | CORS configured for React frontend |
| 7 | JWT authentication (register, login, protected routes) |
| 9 | In-memory caching with `node-cache` |

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally on `mongodb://localhost:27017`

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file (already done — .env exists)
# Edit .env if needed:
#   MONGO_URI=mongodb://localhost:27017/taskdb
#   JWT_SECRET=your_secret_here
#   PORT=5000

# 3. Start the server
npm run dev      # uses node --watch (auto-restarts on change)
# or
npm start        # production start
```

Server runs on **http://localhost:5000**

---

## API Endpoints

### Auth (Public)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | `{email, password}` | Register new user |
| POST | `/auth/login`    | `{email, password}` | Returns JWT token |
| GET  | `/auth/me`       | — (Bearer token)   | Returns current user |

### Tasks (JWT Protected — send `Authorization: Bearer <token>`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET    | `/tasks`         | — | Get all tasks (cached 60s) |
| GET    | `/tasks/:id`     | — | Get single task (404 if not found) |
| POST   | `/tasks`         | `{title, description?, priority?, completed?}` | Create task |
| PUT    | `/tasks/:id`     | `{title, description?, priority?, completed?}` | Update task |
| DELETE | `/tasks/:id`     | — | Delete task |

### Debug
| Method | Path | Description |
|--------|------|-------------|
| GET | `/debug/cache` | Cache hit/miss stats (Practical 9) |

---

## Schema

### Task
```js
{
  title:       String  (required, trimmed by pre-save hook),
  description: String  (optional),
  completed:   Boolean (default: false),
  createdAt:   Date    (default: Date.now),
  priority:    enum ['low','medium','high'] (default: 'medium'),
  owner:       ObjectId → User
}
```

### User
```js
{
  email:     String (required, unique, lowercase),
  password:  String (bcrypt hash — NEVER plain text),
  createdAt: Date
}
```

---

## Postman Testing Flow (Practical 7)

1. `POST /auth/register` → `{email, password}`
2. `POST /auth/login` → copy the `token` from the response
3. Set header: `Authorization: Bearer <token>` in all task requests
4. `POST /tasks` → `{title: "My first task"}`
5. `GET /tasks` → observe `source: "database"` on first call
6. `GET /tasks` again → observe `source: "cache"` (Practical 9)

---

## Architecture
```
server.js
  ├── /auth/*          → routes/authRoutes.js
  │     ├── POST /register  → bcrypt.hash → User.create
  │     ├── POST /login     → bcrypt.compare → jwt.sign
  │     └── GET  /me        → authMiddleware → User.findById
  │
  ├── /tasks/*         → routes/taskRoutes.js
  │     ├── authMiddleware  (JWT verify)
  │     ├── validateTask    (server-side input check)
  │     └── CRUD via Mongoose + node-cache invalidation
  │
  └── Global error handler → structured JSON (never raw Mongoose error)
```

---

## .env Reference
```
MONGO_URI=mongodb://localhost:27017/taskdb
JWT_SECRET=change_this_to_a_long_random_secret
PORT=5000
```
> ⚠️ `.env` is in `.gitignore` — use `.env.example` as a template
