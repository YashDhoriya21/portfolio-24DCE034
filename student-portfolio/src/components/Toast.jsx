// src/components/Toast.jsx
// Supplementary Practical 6 — Toast/notification component
// Shows success or failure after each API operation.
// Usage:
//   const { toasts, showToast } = useToast();
//   showToast('Task created!', 'success');
//   <ToastContainer toasts={toasts} onClose={removeToast} />

import { useState, useCallback } from 'react';
import './Toast.css';

let _id = 0;

// ── Hook — call this inside the component that triggers toasts ────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-remove after 3.5 s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

// ── Icons per type ────────────────────────────────────────────────────────────
const ICONS = { success: '✅', error: '❌', info: 'ℹ️' };

// ── Rendered container — place once near the root of the page ────────────────
export function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => onClose(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
