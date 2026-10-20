// routes/authRoutes.js
// Practical 7 — Register + Login + /me endpoints

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------
// POST /auth/register
// Hash password with bcrypt (salt rounds = 10) before saving
// ---------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // bcrypt.hash — intentionally slow + auto-salts (more secure than SHA)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    res.status(201).json({
      message: 'User registered successfully.',
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// POST /auth/login
// Compare plain password to stored hash using bcrypt.compare
// Return signed JWT with 1-hour expiry on success
// ---------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // bcrypt.compare: compares plain text to hashed — NEVER use ===
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Sign JWT — secret MUST come from .env, never hardcoded
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      expiresIn: '1h',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------
// GET /auth/me  (Supplementary Practical 7)
// Returns current user's details from the decoded JWT
// Protected route — requires valid token
// ---------------------------------------------------------------
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
