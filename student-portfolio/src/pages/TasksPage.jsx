// src/pages/TasksPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Practical 6 — Full Stack Integration: React + Node + MongoDB
//
// Key requirements met:
//   ✅ api.js with BASE_URL = 'http://localhost:5000' (via Vite proxy)
//   ✅ CRUD: GET / POST / PUT / DELETE → Express → MongoDB
//   ✅ Loading + error state on EVERY API call (not just initial fetch)
//   ✅ Local state sync after every write (POST/PUT/DELETE)
//   ✅ Data persisted in MongoDB — survives browser refresh
//
// Supplementary requirements met:
//   ✅ Optimistic UI — new task appears in list BEFORE server confirms
//   ✅ Confirmation dialog before delete (window.confirm)
//   ✅ Toast/notification component after every operation
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../api/api';
import { useToast, ToastContainer } from '../components/Toast';
import './TasksPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITIES = ['low', 'medium', 'high'];
const FILTERS    = ['all', 'pending', 'completed'];
const BLANK_TASK = { title: '', description: '', priority: 'medium', completed: false };

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SECTION — Login / Register card
// ─────────────────────────────────────────────────────────────────────────────
function AuthSection() {
  const { login, register } = useAuth();
  const [mode, setMode]   = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState('');
  const [ok,   setOk]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setOk('');
    try {
      if (mode === 'login') {
        await login(email, pass);
      } else {
        await register(email, pass);
        setOk('Account created! Please log in.');
        setMode('login');
        setPass('');
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">📋</span>
          <h1 className="auth-title">Task Manager</h1>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to manage your tasks' : 'Create a free account'}
          </p>
        </div>

        {err && <div className="alert alert-error">⚠️ {err}</div>}
        {ok  && <div className="alert alert-success">✅ {ok}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="auth-pass">Password</label>
            <input
              id="auth-pass"
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={busy || !email || !pass}
          >
            {busy ? <span className="spin" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button id="switch-to-register" onClick={() => { setMode('register'); setErr(''); setOk(''); }}>
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button id="switch-to-login" onClick={() => { setMode('login'); setErr(''); setOk(''); }}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK FORM MODAL — Create and Edit
// ─────────────────────────────────────────────────────────────────────────────
function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || BLANK_TASK);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const isEdit = !!initial?._id;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      setErr(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Task' : '➕ New Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {err && <div className="alert alert-error">⚠️ {err}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              name="title"
              type="text"
              placeholder="e.g. Study for the exam"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
          <div className="form-field">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              name="description"
              placeholder="Optional details..."
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="form-field">
            <label htmlFor="task-priority">Priority</label>
            <select id="task-priority" name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                id="task-completed"
                name="completed"
                type="checkbox"
                checked={form.completed}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <label htmlFor="task-completed" style={{ marginBottom: 0 }}>Mark as completed</label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              id="modal-save-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={busy || !form.title.trim()}
            >
              {busy ? <span className="spin" /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS MANAGER — shown when logged in
// ─────────────────────────────────────────────────────────────────────────────
function TasksManager() {
  const { user, logout }            = useAuth();
  const { toasts, showToast, removeToast } = useToast(); // Supplementary: toasts

  const [tasks,   setTasks]    = useState([]);
  const [source,  setSource]   = useState('');
  const [filter,  setFilter]   = useState('all');
  const [modal,   setModal]    = useState(null);    // null | 'create' | task object
  const [loading, setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // ── Step 2 (Practical 6): Fetch all tasks from backend ──────────────────────
  // Practical 3 pattern reused: loading → fetch → set state → catch error
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const data = await getTasks(); // GET /tasks via api.js
      setTasks(data.tasks);
      setSource(data.source);
    } catch (e) {
      setFetchErr(e.message);
      showToast(`Failed to load tasks: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Step 4 (Practical 6): POST /tasks — with OPTIMISTIC UI ──────────────────
  // Supplementary: Optimistic update — add task to list immediately before
  // server confirms. If server fails, roll back and show error toast.
  async function handleCreate(form) {
    // 1. Build a temporary task with a fake ID for immediate display
    const tempId   = `temp-${Date.now()}`;
    const optimistic = { ...form, _id: tempId, createdAt: new Date().toISOString(), __optimistic: true };

    // 2. Show it in the list RIGHT NOW (before server responds)
    setTasks((prev) => [optimistic, ...prev]);
    setModal(null); // close modal immediately — feels fast

    try {
      // 3. Actually POST to the backend
      const data = await createTask(form);

      // 4. Replace the temp entry with the real server response
      setTasks((prev) => prev.map((t) => (t._id === tempId ? data.task : t)));
      showToast('Task created successfully!', 'success'); // Supplementary: toast
    } catch (e) {
      // 5. Roll back — remove the optimistic entry
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      showToast(`Failed to create task: ${e.message}`, 'error');
      throw e; // re-throw so modal can show error too (if still open)
    }
  }

  // ── Step 5 (Practical 6): PUT /tasks/:id ────────────────────────────────────
  // State is updated on success — UI stays in sync with server
  async function handleUpdate(form) {
    const data = await updateTask(form._id, form);
    setTasks((prev) => prev.map((t) => (t._id === form._id ? data.task : t)));
    showToast('Task updated!', 'success');
  }

  // ── Toggle completed via PUT ─────────────────────────────────────────────────
  async function handleToggle(task) {
    try {
      const data = await updateTask(task._id, { ...task, completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data.task : t)));
      showToast(
        data.task.completed ? 'Task marked as completed ✓' : 'Task marked as pending',
        'success'
      );
    } catch (e) {
      showToast(`Could not update task: ${e.message}`, 'error');
    }
  }

  // ── Step 5 (Practical 6): DELETE /tasks/:id ──────────────────────────────────
  // Supplementary: confirmation dialog before deleting
  async function handleDelete(id, title) {
    // Supplementary: confirmation dialog
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await deleteTask(id); // DELETE /tasks/:id
      setTasks((prev) => prev.filter((t) => t._id !== id)); // sync local state
      showToast('Task deleted.', 'info'); // Supplementary: toast
    } catch (e) {
      showToast(`Failed to delete: ${e.message}`, 'error');
    }
  }

  // ── Filtered view ────────────────────────────────────────────────────────────
  const filtered = tasks.filter((t) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'pending')   return !t.completed;
    return true;
  });

  const total   = tasks.length;
  const done    = tasks.filter((t) => t.completed).length;
  const pending = total - done;

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="tasks-page">
      <div className="tasks-manager">

        {/* Top bar */}
        <div className="tasks-topbar">
          <div>
            <h1 className="tasks-heading">📋 My Tasks</h1>
            {user && <p className="tasks-email">Signed in as {user.email}</p>}
          </div>
          <div className="topbar-actions">
            <button
              id="create-task-btn"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => setModal('create')}
            >
              + New Task
            </button>
            <button
              id="refresh-tasks-btn"
              className="btn btn-ghost btn-sm"
              onClick={fetchTasks}
              disabled={loading}
            >
              {loading
                ? <span className="spin" style={{ borderTopColor: 'var(--accent-blue)', borderColor: 'var(--border)' }} />
                : '↻'} Refresh
            </button>
            <button id="logout-btn" className="btn btn-sm btn-danger" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="tasks-stats">
          <div className="stat-card">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#10b981' }}>{done}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f59e0b' }}>{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        {/* Fetch error */}
        {fetchErr && <div className="alert alert-error">⚠️ {fetchErr}</div>}

        {/* Cache/DB source badge */}
        {source && (
          <div className="source-badge">
            {source === 'cache' ? '⚡ Served from cache' : '🗄️ Fetched from database'}
          </div>
        )}

        {/* Filter chips */}
        <div className="tasks-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="page-loading">
            <span className="spin" style={{ width: 28, height: 28, borderTopColor: 'var(--accent-blue)', borderColor: 'var(--border)' }} />
            Loading tasks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="tasks-empty">
            <div className="tasks-empty-icon">🗂️</div>
            <h3>{filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}</h3>
            <p>{filter === 'all' ? 'Click "+ New Task" to get started.' : 'Try a different filter.'}</p>
          </div>
        ) : (
          <ul className="task-list" style={{ listStyle: 'none', padding: 0 }}>
            {filtered.map((task) => (
              <li key={task._id}>
                <div
                  className={`task-card${task.completed ? ' completed' : ''}${task.__optimistic ? ' optimistic' : ''}`}
                  data-priority={task.priority}
                  style={task.__optimistic ? { opacity: 0.7 } : {}}
                >
                  {/* Completion checkbox */}
                  <input
                    type="checkbox"
                    className="task-check"
                    checked={task.completed}
                    onChange={() => !task.__optimistic && handleToggle(task)}
                    disabled={!!task.__optimistic}
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
                  />

                  {/* Body */}
                  <div className="task-body">
                    <div className="task-title">
                      {task.__optimistic && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saving… </span>}
                      {task.title}
                    </div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.completed && <span className="badge badge-done">✓ done</span>}
                      <span className="task-date">{fmtDate(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions — disabled while optimistic */}
                  {!task.__optimistic && (
                    <div className="task-actions">
                      <button
                        className="btn btn-sm btn-warn"
                        onClick={() => setModal(task)}
                        title="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(task._id, task.title)}
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <TaskModal
          initial={modal === 'create' ? null : modal}
          onSave={modal === 'create' ? handleCreate : handleUpdate}
          onClose={() => setModal(null)}
        />
      )}

      {/* Supplementary: Toast notification container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────────
function TasksPage() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spin" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-blue)', borderColor: 'var(--border)' }} />
        Checking session…
      </div>
    );
  }

  return token ? <TasksManager /> : <AuthSection />;
}

export default TasksPage;
