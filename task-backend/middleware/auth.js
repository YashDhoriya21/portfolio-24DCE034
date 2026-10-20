// middleware/auth.js
// Practical 7 — JWT authentication middleware
// Protects all task routes; sets req.user on success

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Token expected in Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify throws if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, iat, exp }
    next();
  } catch (err) {
    // Wrap in try/catch so invalid tokens don't crash the server
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }
}

module.exports = authMiddleware;
