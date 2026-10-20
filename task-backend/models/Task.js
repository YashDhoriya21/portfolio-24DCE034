// models/Task.js
// Practical 5 — Mongoose schema with validation
// Practical 7 — owner field links task to authenticated user

const mongoose = require('mongoose');

// ---------------------------------------------------------------
// Task Schema  (Practical 5 core requirement)
// Fields: title (required), description, completed, createdAt
// Supplementary: priority enum, pre-save trim hook
// ---------------------------------------------------------------
const taskSchema = new mongoose.Schema({
  // title: String, required — validation enforced at Mongoose layer
  title: {
    type: String,
    required: [true, 'Title is required'],
  },

  description: {
    type: String,
    default: '',
  },

  // completed: Boolean with default false
  completed: {
    type: Boolean,
    default: false,
  },

  // createdAt: Date with default Date.now
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Supplementary (Practical 5): priority restricted to enum values
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high',
    },
    default: 'medium',
  },

  // Practical 7 — associate task with a specific user
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// ---------------------------------------------------------------
// Supplementary pre-save hook (Practical 5): trim title whitespace
// Mongoose 9 supports async pre hooks without the next() callback
// ---------------------------------------------------------------
taskSchema.pre('save', async function () {
  if (this.title) {
    this.title = this.title.trim();
  }
});

module.exports = mongoose.model('Task', taskSchema);
