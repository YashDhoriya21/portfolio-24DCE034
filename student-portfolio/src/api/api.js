// src/api/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Practical 6 — Full Stack Integration: central API module
//
// Step 2 (Practical 6): BASE_URL points to the Express backend
// The Vite dev proxy (vite.config.js) forwards /auth and /tasks to this URL,
// so fetch() calls use relative paths with no CORS errors in development.
// ─────────────────────────────────────────────────────────────────────────────

// Practical 6 Step 2 — base URL of the Express backend
const BASE_URL = 'http://localhost:5000';

// Vite proxy rewrites /tasks → BASE_URL/tasks automatically in dev.
// In containerized/production setups, Nginx reverse proxies relative paths, or VITE_API_BASE_URL can override.
const BASE = import.meta.env.VITE_API_BASE_URL || '';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the stored JWT token (or null if not logged in). */
function getToken() {
  return localStorage.getItem('token');
}

/** Builds fetch headers. Protected routes need the Authorization header. */
function headers(auth = false) {
  const h = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

/**
 * Thin fetch wrapper — throws on non-2xx with the backend's error message.
 */
async function request(method, path, body = null, auth = false) {
  const options = {
    method,
    headers: headers(auth),
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    // Prefer the backend's error message
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// ── Auth API ─────────────────────────────────────────────────────────────────

/** POST /auth/register */
export async function register(email, password) {
  return request('POST', '/auth/register', { email, password });
}

/** POST /auth/login → returns { token, expiresIn, message } */
export async function login(email, password) {
  return request('POST', '/auth/login', { email, password });
}

/** GET /auth/me — returns current user (protected) */
export async function getMe() {
  return request('GET', '/auth/me', null, true);
}

// ── Tasks API ─────────────────────────────────────────────────────────────────

/** GET /tasks → { tasks, source } */
export async function getTasks() {
  return request('GET', '/tasks', null, true);
}

/** GET /tasks/:id → { task, source } */
export async function getTask(id) {
  return request('GET', `/tasks/${id}`, null, true);
}

/** POST /tasks → { task, message } */
export async function createTask(taskData) {
  return request('POST', '/tasks', taskData, true);
}

/** PUT /tasks/:id → { task, message } */
export async function updateTask(id, taskData) {
  return request('PUT', `/tasks/${id}`, taskData, true);
}

/** DELETE /tasks/:id → { message } */
export async function deleteTask(id) {
  return request('DELETE', `/tasks/${id}`, null, true);
}
