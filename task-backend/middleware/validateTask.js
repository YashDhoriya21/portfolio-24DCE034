// middleware/validateTask.js
// Practical 7 — Input validation middleware
// Rejects requests missing required fields BEFORE they reach the DB

function validateTask(req, res, next) {
  const { title } = req.body;

  // Server-side validation: title is required for create/update
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: { title: 'Title is required and must be a non-empty string.' },
    });
  }

  // Validate priority if provided
  const validPriorities = ['low', 'medium', 'high'];
  if (req.body.priority && !validPriorities.includes(req.body.priority)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: { priority: 'Priority must be one of: low, medium, high.' },
    });
  }

  next();
}

module.exports = validateTask;
