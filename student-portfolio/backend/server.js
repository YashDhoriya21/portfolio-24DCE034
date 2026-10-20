// server.js
// ─────────────────────────────────────────────────────────────────────────────
// Practical 5 — MongoDB Integration and Schema Design with Mongoose
// Extended from Practical 4 (Express + in-memory CRUD)
//
// What changed from Practical 4 → Practical 5:
//   ✦ Added: require('dotenv').config()  → loads MONGO_URI from .env
//   ✦ Added: mongoose.connect()          → connects to MongoDB
//   ✦ Changed: routes now use Mongoose   → see routes/taskRoutes.js
//   ✦ Added: global error handler        → converts Mongoose errors to JSON
//   ✦ Changed: server starts AFTER DB    → app.listen inside .then()
//
// Lab Steps (from the practical sheet):
//   Step 1 — npm install mongoose dotenv   (see package.json)
//   Step 2 — Connect to MongoDB            (see mongoose.connect below)
//   Step 3 — Define Task schema + model    (see models/Task.js)
//   Step 4 — Replace in-memory array       (see routes/taskRoutes.js)
//   Step 5 — try/catch + next(err)         (see routes + error handler below)
//   Step 6 — Test in Postman               (start server with: npm run dev)
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Load .env variables FIRST — before any process.env reference
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');

// Step 4: Import route module (Mongoose CRUD replaces in-memory array)
const taskRoutes = require('./routes/taskRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Parse JSON bodies so req.body is available in route handlers
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/tasks', taskRoutes);

// Health check — confirms the server is running
app.get('/', (req, res) => {
  res.json({
    practical: 'Practical 5 — MongoDB + Mongoose',
    status: 'running',
    endpoints: {
      'GET    /tasks':      'Retrieve all tasks',
      'GET    /tasks/:id':  'Retrieve one task by ID',
      'POST   /tasks':      'Create a new task',
      'PUT    /tasks/:id':  'Update a task by ID',
      'DELETE /tasks/:id':  'Delete a task by ID',
    },
  });
});

// ── Global Error Handler (Step 5) ─────────────────────────────────────────────
// Catches any error passed via next(err) from route handlers.
// Key principle: the client always receives clean JSON — never a raw
// Mongoose error object which would expose internal schema details.
//
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  // Mongoose ValidationError — e.g. missing required title, bad enum value
  // err.errors is a map of { fieldName: { message, kind, ... } }
  // We flatten it to { fieldName: 'human-readable message' }
  if (err.name === 'ValidationError') {
    const details = {};
    Object.keys(err.errors).forEach((key) => {
      details[key] = err.errors[key].message;
    });
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Mongoose CastError — invalid ObjectId in URL param (e.g. /tasks/abc)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }

  // Generic fallback for any other unexpected server errors
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── MongoDB Connection (Step 2) ───────────────────────────────────────────────
// Connect to MongoDB FIRST; only start the HTTP server on success.
// If the DB is unreachable the server exits — an Express app is useless
// without its database.
//
// Practical 4 had no DB — it called app.listen() directly.
// Practical 5 gates app.listen() inside the .then() callback below.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected →', process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log('📋 Endpoints: GET /tasks | POST /tasks | PUT /tasks/:id | DELETE /tasks/:id');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit — app cannot function without DB
  });
