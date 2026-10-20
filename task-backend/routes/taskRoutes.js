// routes/taskRoutes.js
// Practical 4 — CRUD operations (now using Mongoose instead of in-memory array)
// Practical 5 — Mongoose model methods: find, create, findByIdAndUpdate, findByIdAndDelete
// Practical 7 — All routes protected by authMiddleware; tasks scoped to req.user.id
// Practical 9 — GET /tasks uses node-cache (60s TTL); invalidated on every write
// Practical 10 — Asynchronous processing with Node.js EventEmitter (task-created, task-deleted)

const express        = require('express');
const Task           = require('../models/Task');
const authMiddleware = require('../middleware/auth');
const validateTask   = require('../middleware/validateTask');
const { cache, recordHit, recordMiss } = require('../cache/taskCache');
const taskEvents     = require('../events/taskEvents');

const router = express.Router();

// ---------------------------------------------------------------
// GET /tasks  — Retrieve all tasks for the authenticated user
// Practical 9: check cache first; hit → return immediately, miss → query DB
// ---------------------------------------------------------------
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;

    // Cache check (Practical 9)
    const cached = cache.get(cacheKey);
    if (cached) {
      recordHit();
      return res.json({ source: 'cache', tasks: cached });
    }

    recordMiss();
    // Query MongoDB using Mongoose (Practical 5)
    const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
    cache.set(cacheKey, tasks); // store in cache for 60s
    res.json({ source: 'database', tasks });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// GET /tasks/:id  — Retrieve a single task by ID
// Supplementary (Practical 5): returns 404 JSON if ID doesn't exist
// Supplementary (Practical 9): caches per-task separately
// ---------------------------------------------------------------
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const cacheKey = `task_${req.params.id}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      recordHit();
      return res.json({ source: 'cache', task: cached });
    }

    recordMiss();
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    cache.set(cacheKey, task);
    res.json({ source: 'database', task });
  } catch (err) {
    // Handle invalid MongoDB ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }
    next(err);
  }
});

// ---------------------------------------------------------------
// POST /tasks  — Create a new task
// validateTask middleware runs first (Practical 7)
// Cache invalidated after successful write (Practical 9)
// Practical 10: emit task-created event for background notification
// ---------------------------------------------------------------
router.post('/', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // Task.create() calls pre-save hook which trims title (Practical 5 supplementary)
    const task = await Task.create({
      title,
      description,
      completed,
      priority,
      owner: req.user.id, // scope task to authenticated user
    });

    // Invalidate the all-tasks cache for this user
    cache.del(`tasks_${req.user.id}`);

    // Practical 10: Record timestamp at API response point
    const responseSentAt = new Date().toISOString();
    console.log(`[API] 🚀 POST /tasks HTTP 201 response sent at ${responseSentAt} for "${task.title}"`);

    // Send HTTP 201 Created response immediately (non-blocking)
    res.status(201).json({ message: 'Task created.', task });

    // Practical 10: Emit task-created event for asynchronous background processing
    taskEvents.emit('task-created', {
      task,
      userId: req.user.id,
      responseSentAt,
    });
  } catch (err) {
    // Mongoose ValidationError → structured JSON response
    if (err.name === 'ValidationError') {
      const details = {};
      Object.keys(err.errors).forEach((key) => {
        details[key] = err.errors[key].message;
      });
      return res.status(400).json({ error: 'Validation failed', details });
    }
    next(err);
  }
});

// ---------------------------------------------------------------
// PUT /tasks/:id  — Update an existing task
// Cache invalidated after successful write (Practical 9)
// ---------------------------------------------------------------
router.put('/:id', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { title: title.trim(), description, completed, priority },
      { new: true, runValidators: true } // runValidators: re-run schema validation
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Invalidate both the list cache and the per-task cache
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.params.id}`);

    res.json({ message: 'Task updated.', task });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const details = {};
      Object.keys(err.errors).forEach((key) => {
        details[key] = err.errors[key].message;
      });
      return res.status(400).json({ error: 'Validation failed', details });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }
    next(err);
  }
});

// ---------------------------------------------------------------
// DELETE /tasks/:id  — Delete a task
// Cache invalidated after successful write (Practical 9)
// Practical 10: emit task-deleted event for background audit logging
// ---------------------------------------------------------------
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Invalidate both caches
    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.params.id}`);

    // Practical 10: Record timestamp at API response point
    const responseSentAt = new Date().toISOString();
    console.log(`[API] 🚀 DELETE /tasks/${req.params.id} HTTP 200 response sent at ${responseSentAt}`);

    res.json({ message: 'Task deleted successfully.' });

    // Practical 10: Emit task-deleted event
    taskEvents.emit('task-deleted', {
      taskId: req.params.id,
      taskTitle: task.title,
      userId: req.user.id,
      responseSentAt,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }
    next(err);
  }
});

module.exports = router;
