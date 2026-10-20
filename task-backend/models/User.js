// models/User.js
// Practical 7 — User schema for authentication

const mongoose = require('mongoose');

// ---------------------------------------------------------------
// User Schema
// email: unique identifier; password: stored as bcrypt hash
// ---------------------------------------------------------------
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },

  // password is ALWAYS stored as a bcrypt hash — NEVER plain text
  password: {
    type: String,
    required: [true, 'Password is required'],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
