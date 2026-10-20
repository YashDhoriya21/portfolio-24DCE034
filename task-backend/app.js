// app.js
// Express application entry point (decoupled from HTTP listener for testability)
// Practical 4  — Express server foundation & middleware pipeline
// Practical 5  — MongoDB schema integration
// Practical 6  — CORS configuration for React frontend
// Practical 7  — Auth routes + protected task routes
// Practical 9  — Debug cache stats endpoint
// Practical 10 — Task event listeners registration
// Practical 12 — Decoupled app instance for Supertest CI/CD automated tests

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');

const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const { cache, getHits, getMisses } = require('./cache/taskCache');
const { registerTaskListeners } = require('./listeners/taskListeners');

// Register Practical 10 EventEmitter listeners once on application startup
registerTaskListeners();

const app = express();

// ---------------------------------------------------------------
// CORS CONFIGURATION (Practical 6 / Practical 11)
// ---------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, Supertest, curl, internal server calls)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies
app.use(express.json());

// ---------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------

// Health check endpoint (Practical 4 / Practical 12 CI test)
app.get('/', (req, res) => {
  res.json({ status: 'Task Management API running', version: '1.0.0' });
});

// Auth routes — public (Practical 7)
app.use('/auth', authRoutes);

// Task routes — protected (Practical 5, 6, 7, 9, 10)
app.use('/tasks', taskRoutes);

// Debug cache stats endpoint (Practical 9)
app.get('/debug/cache', (req, res) => {
  const stats = cache.getStats();
  res.json({
    hits: getHits(),
    misses: getMisses(),
    keys: cache.keys(),
    nodeCache_stats: stats,
  });
});

// ---------------------------------------------------------------
// GLOBAL ERROR HANDLER
// ---------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = {};
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        details[key] = err.errors[key].message;
      });
    }
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
