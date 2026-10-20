// models/Task.js
// ─────────────────────────────────────────────────────────────────────────────
// Practical 5 — Mongoose Schema Definition
//
// This file REPLACES the in-memory array from Practical 4.
// Practical 4 stored tasks like this:
//
//   let tasks = [];   // ← in-memory: data lost on every server restart
//
// Practical 5 defines a Mongoose Schema so that MongoDB enforces:
//   • Required fields (title must never be empty)
//   • Data types (Boolean for completed, Date for createdAt)
//   • Default values (completed = false, createdAt = now)
//   • Enum validation (priority restricted to 3 allowed strings)
//
// A schema in a NoSQL database like MongoDB is useful because MongoDB
// itself is schema-less — without Mongoose, any shape of document can
// be inserted.  The schema enforces consistency at the application layer.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// ── Core Schema (Practical 5 — 4 required fields) ────────────────────────────
const taskSchema = new mongoose.Schema({

  // title — String, required
  // Mongoose throws a ValidationError before saving if this is missing.
  // This stops invalid documents at the ODM layer, before they reach MongoDB.
  title: {
    type: String,
    required: [true, 'Title is required'],
  },

  // description — optional free-text, defaults to empty string
  description: {
    type: String,
    default: '',
  },

  // completed — Boolean, default false
  // Every new task starts as "pending" unless explicitly set to true.
  completed: {
    type: Boolean,
    default: false,
  },

  // createdAt — Date, default Date.now
  // Set automatically when the document is first inserted.
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ── Supplementary: priority enum ─────────────────────────────────────────
  // Restricts the value to exactly three allowed strings.
  // Any other value (e.g. "urgent") causes a ValidationError.
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high',
    },
    default: 'medium',
  },

});

// ── Supplementary: pre-save hook ─────────────────────────────────────────────
// Runs automatically before every .save() or .create() call.
// 'this' refers to the document about to be saved.
// Trims whitespace so "  Buy milk  " becomes "Buy milk" in the DB.
taskSchema.pre('save', async function () {
  if (this.title) {
    this.title = this.title.trim();
  }
});

// Compile the schema into a Model.
// Mongoose will use the 'tasks' collection in MongoDB (lowercase + plural).
module.exports = mongoose.model('Task', taskSchema);
