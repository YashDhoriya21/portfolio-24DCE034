# Practical 8 — Performance Optimization and Lazy Loading in React

**Student:** Yash Dhoriya (24DCE034)  
**Date:** 14 October 2026  
**Project:** Student Portfolio — Full-Stack Task Manager

---

## 1. Objective

Reduce the initial JavaScript bundle size using React code-splitting via `React.lazy()` and `Suspense`, so that route-specific code is only downloaded when the user navigates to that route.

---

## 2. What Was Changed

### File Modified: `src/App.jsx`

**Before (Practical 6/7):** All four pages were statically imported.

```js
import ProjectsPage from './pages/ProjectsPage';  // static
import Contact      from './pages/Contact';         // static
import TasksPage    from './pages/TasksPage';        // static
import NotFound     from './pages/NotFound';         // static
```

All of this code was bundled into a single `index-*.js` chunk loaded on the very first page visit.

**After (Practical 8):** Three pages (+ NotFound) are lazily imported.

```js
import Home from './pages/Home';   // still eager — first-paint page

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const Contact      = lazy(() => import('./pages/Contact'));
const TasksPage    = lazy(() => import('./pages/TasksPage'));
const NotFound     = lazy(() => import('./pages/NotFound'));
```

A `<Suspense fallback={<LoadingFallback />}>` wrapper renders a spinner while the chunk downloads.

**Why Home stays eager:** Home is the landing page. Making it lazy would add a flash of the fallback spinner on every cold first load, which degrades perceived performance rather than improving it.

---

## 3. Build Measurements

### Baseline — Before Lazy Loading (static imports, single bundle)

| File | Raw Size | Gzip |
|------|----------|------|
| `dist/assets/index-BG-E5YgH.js` | **253.18 kB** | 79.77 kB |
| `dist/assets/index-BuW6Bjlm.css` | 24.24 kB | 5.28 kB |

> **Note:** Baseline was captured from the existing build (before App.jsx was modified) on 14 October 2026. The single `index.js` bundle contained all four page components.

---

### After Lazy Loading (code-split bundles)

| File | Raw Size | Gzip | Notes |
|------|----------|------|-------|
| `dist/assets/index-QdkpIz9v.js` | **236.49 kB** | **75.74 kB** | Main bundle (React + router + Home) |
| `dist/assets/TasksPage-BHciX8tf.js` | 11.49 kB | 3.61 kB | Lazy chunk — loaded on `/tasks` |
| `dist/assets/ProjectsPage-CLxyZTu_.js` | 3.35 kB | 1.28 kB | Lazy chunk — loaded on `/projects` |
| `dist/assets/Contact-DZFC2dYz.js` | 3.02 kB | 1.11 kB | Lazy chunk — loaded on `/contact` |
| `dist/assets/NotFound-CJya_wli.js` | 0.53 kB | 0.29 kB | Lazy chunk — loaded on `/*` |
| `dist/assets/index-BBuWcv4U.css` | 6.74 kB | 1.90 kB | Core CSS (split from per-route CSS) |
| `dist/assets/TasksPage-BwPAFizf.css` | 8.80 kB | 2.38 kB | Lazy CSS chunk |
| `dist/assets/ProjectsPage-D4hxCjCa.css` | 4.80 kB | 1.57 kB | Lazy CSS chunk |
| `dist/assets/Contact-DLkVM6xd.css` | 3.29 kB | 1.06 kB | Lazy CSS chunk |
| `dist/assets/NotFound-DVfytVTB.css` | 0.76 kB | 0.39 kB | Lazy CSS chunk |

---

## 4. Comparison and Observations

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Initial JS (raw) | 253.18 kB | **236.49 kB** | −16.69 kB (−6.6%) |
| Initial JS (gzip) | 79.77 kB | **75.74 kB** | −4.03 kB (−5.1%) |
| Number of JS chunks | 1 | 5 | +4 route chunks |

> **Observation:** The main bundle reduced by ~16.7 kB (raw) because TasksPage (~11.5 kB), ProjectsPage (~3.4 kB), Contact (~3.0 kB), and NotFound (~0.5 kB) were extracted into their own on-demand chunks.
>
> In a larger real-world application the savings would be proportionally greater. This project is relatively small (~20 components). The principle scales well: any page with heavy dependencies (charting libs, rich text editors, etc.) would produce much larger chunk savings.

---

## 5. How Lazy Loading Works (Concept Explanation)

1. **`React.lazy(fn)`** — accepts a function that returns a `Promise` resolving to a module with a default export. Vite detects the dynamic `import()` call and creates a separate chunk file.
2. **`<Suspense fallback>`** — renders the fallback while the Promise is pending (chunk downloading). Once resolved, React renders the actual component. On subsequent visits the module is cached by the browser — no re-download.
3. **Code splitting** — Vite/Rollup automatically determines chunk boundaries at the dynamic `import()` call sites. Each lazy page gets its own JS + CSS file.

---

## 6. How to Observe Lazy Loading in the Browser (Manual Steps)

1. Run the production preview:
   ```
   cd student-portfolio
   npm run preview
   ```
2. Open `http://localhost:4173` in Chrome.
3. Open **DevTools → Network tab**.
4. Set throttling to **Slow 3G** (dropdown at the top of the Network tab).
5. Hard-refresh the page (`Ctrl+Shift+R`) — only `index-*.js` and `index-*.css` should load.
6. Click **Projects** in the navbar — `ProjectsPage-*.js` and `ProjectsPage-*.css` appear as new requests.
7. Click **Contact** — `Contact-*.js` and `Contact-*.css` load.
8. Click **Tasks** — `TasksPage-*.js` and `TasksPage-*.css` load.
9. On Slow 3G, the `<LoadingFallback />` spinner is briefly visible before each chunk finishes — this is the Suspense fallback in action.
10. Navigate back to **Projects** — no new network requests (chunk is now cached).

> **Note:** On a fast connection the spinner may flash for < 50 ms. Slow 3G throttling makes the fallback clearly visible (approximately 0.5–2 seconds per chunk).

---

## 7. Limitations

- This is a small application. The absolute kB saving is modest (~17 kB raw). In a production app with heavyweight dependencies the savings are far more significant.
- Build times (207 ms after vs 336 ms before) are not a meaningful comparison metric at this scale.
- Network timing measurements cannot be automated without browser automation. Section 6 provides exact manual reproduction steps.

---

## 8. Practical 8 Requirements Checklist

| Requirement | Status |
|-------------|--------|
| `React.lazy()` on ProjectsPage | Done |
| `React.lazy()` on Contact | Done |
| `React.lazy()` on TasksPage (substantial 3rd component) | Done |
| `Suspense` with meaningful fallback (loading spinner) | Done |
| Home route stays functional (not lazy) | Done |
| Baseline build recorded | 253.18 kB single bundle |
| After build recorded | 236.49 kB initial + 4 chunks |
| Chunk sizes documented | Table in Section 3 |
| DevTools observation steps provided | Section 6 |
| No fabricated measurements | All figures from real `npm run build` output |
