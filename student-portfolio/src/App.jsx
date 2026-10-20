// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Practical 8 — Performance Optimization: React.lazy() + Suspense
//
// What changed from Practical 6/7 → Practical 8:
//   ✅ ProjectsPage  — lazy-loaded (was a static import)
//   ✅ Contact       — lazy-loaded (was a static import)
//   ✅ TasksPage     — lazy-loaded (was a static import; most feature-rich page)
//   ✅ NotFound      — lazy-loaded
//   ✅ Suspense wraps all lazy routes with a <LoadingFallback /> spinner
//   ✅ Home stays eagerly loaded — it is the first paint users see
//
// Why lazy-load these three?
//   Each page contains non-trivial code + its own CSS.  Lazy loading splits
//   them into separate JS chunks that are fetched only when the user actually
//   navigates to that route, reducing the initial bundle the browser must
//   download and parse before it can show the page.
//
// Observable in DevTools:
//   Network tab (Slow 3G) → on first visit to /projects a new chunk appears.
//   Lighthouse → "Reduce unused JavaScript" metric improves.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import NavBar from './components/NavBar';
import Footer from './components/Footer';

// ── Eagerly loaded ────────────────────────────────────────────────────────────
// Home is loaded in the main bundle because it is the landing page.
// Showing it immediately avoids a spinner on first paint.
import Home from './pages/Home';

// ── Lazily loaded ─────────────────────────────────────────────────────────────
// React.lazy() takes a function that calls import() and returns a Promise.
// The component file MUST have a default export (✅ all three do).
// Vite automatically splits each into a separate chunk at build time.
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const Contact      = lazy(() => import('./pages/Contact'));
const TasksPage    = lazy(() => import('./pages/TasksPage'));
const NotFound     = lazy(() => import('./pages/NotFound'));

import './index.css';

// ── Suspense fallback — shown while the lazy chunk is loading ─────────────────
// Keep it simple: a full-height centred spinner with descriptive text.
function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 140px)',
        gap: '1rem',
        color: 'var(--text-muted)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* CSS spinner — no extra dependency needed */}
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: '0.9rem' }}>Loading page…</p>
      {/* The spin keyframes are already defined in TasksPage.css / index.css */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    // AuthProvider wraps the whole app so any component can access auth state
    <AuthProvider>
      <div className={darkMode ? 'dark' : ''}>
        <NavBar darkMode={darkMode} onToggleDark={() => setDarkMode((p) => !p)} />

        {/*
          Suspense MUST wrap all lazy-loaded routes.
          fallback is rendered while the JS chunk for the target route is
          being downloaded and parsed.  Once loaded, it is cached — subsequent
          visits to the same route show the component instantly.
        */}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Home is NOT lazy — first paint should be instant */}
            <Route path="/"         element={<Home />} />

            {/* These three routes are lazy-loaded ↓ */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/contact"  element={<Contact />} />
            <Route path="/tasks"    element={<TasksPage />} />
            <Route path="*"         element={<NotFound />} />
          </Routes>
        </Suspense>

        <Footer name="Yash Dhoriya" />
      </div>
    </AuthProvider>
  );
}

export default App;
