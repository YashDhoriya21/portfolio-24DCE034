// routes/taskRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Practical 4 → Practical 5 upgrade
//
// Practical 4 used an in-memory array for all CRUD:
//   let tasks = [];
//   tasks.push(...)           → create
//   tasks.find(...)           → read
//   tasks = tasks.map(...)    → update
//   tasks = tasks.filter(...) → delete
//
// Practical 5 REPLACES those array methods with Mongoose model methods:
//   Task.find()               → replaces tasks.filter() / tasks
//   Task.findById()           → replaces tasks.find(t => t.id === id)
//   Task.create()             → replaces tasks.push()
//   Task.findByIdAndUpdate()  → replaces tasks.map() update logic
//   Task.findByIdAndDelete()  → replaces tasks.filter() delete logic
//
// Every route is wrapped in try/catch (Lab Step 5).
// Errors are passed to next(err) so the global handler in server.js
// returns clean JSON — never a raw Mongoose error object.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const Task    = require('../models/Task');

const router = express.Router();

// ── GET /tasks ────────────────────────────────────────────────────────────────
// Practical 4: return tasks array
// Practical 5: Task.find() queries MongoDB, sorted newest first
router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err); // → global error handler
  }
});

// ── GET /tasks/:id ────────────────────────────────────────────────────────────
// Supplementary (Practical 5): returns 404 JSON if the ID doesn't exist
// Practical 4 had no individual task endpoint.
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    // Mongoose returns null when no document matches — explicit 404
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ task });
  } catch (err) {
    // CastError → the ID in the URL is not a valid MongoDB ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }
    next(err);
  }
});

// ── POST /tasks ───────────────────────────────────────────────────────────────
// Practical 4: tasks.push({ id, title, ... })
// Practical 5: Task.create() → runs schema validation + pre-save hook first
router.post('/', async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // Task.create() internally calls new Task(...).save()
    // This triggers the pre-save hook (trims title whitespace)
    // AND runs schema validation (required, enum checks)
    const task = await Task.create({ title, description, completed, priority });

    res.status(201).json({ message: 'Task created.', task });
  } catch (err) {
    // Mongoose ValidationError → convert nested err.errors into clean JSON
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

// ── PUT /tasks/:id ────────────────────────────────────────────────────────────
// Practical 4: tasks = tasks.map(t => t.id === id ? { ...t, ...body } : t)
// Practical 5: Task.findByIdAndUpdate() — atomic update in MongoDB
//   new: true          → return the updated document (not the old version)
//   runValidators: true → re-run schema validation on the new values
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, completed, priority },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

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

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────────
// Practical 4: tasks = tasks.filter(t => t.id !== id)
// Practical 5: Task.findByIdAndDelete() — removes the document from MongoDB
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }
    next(err);
  }
});

module.exports = router;
