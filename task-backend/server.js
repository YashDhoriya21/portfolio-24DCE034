// server.js
// Practical 4  — Express server foundation
// Practical 5  — MongoDB + Mongoose connection
// Practical 6  — CORS enabled for React frontend
// Practical 7  — Auth routes + protected task routes
// Practical 9  — Debug cache stats endpoint
// Practical 10 — Event-Driven Architecture background listeners
// Practical 11 — Docker container host/port configuration
// Practical 12 — Server listener separated from app instance

require('dotenv').config();
const mongoose = require('mongoose');
const app      = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ---------------------------------------------------------------
// MONGODB CONNECTION (Practical 5)
// Connect first, then start the HTTP server
// ---------------------------------------------------------------
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully.');
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log('📋 Routes: GET/POST/PUT/DELETE /tasks | POST /auth/register | POST /auth/login');
      console.log('⚡ Practical 10 EventEmitter background notifications active.');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit if DB cannot connect
  });

