# Practical 10 — Asynchronous Processing with Event-Driven Architecture

**Student:** Yash Dhoriya (24DCE034)  
**Subject:** Advanced Web Development Frameworks (ITUE301) | Semester: 5th  
**Date:** 20 October 2026  
**Project:** Task Management Backend — Node.js + Express + EventEmitter  

---

## 1. Objective

Implement asynchronous background task processing and decoupled notifications using Node.js's native `EventEmitter` module without external message broker dependencies (e.g., RabbitMQ, Bull, or Redis). Demonstrate that the main HTTP request-response critical path returns immediately while background tasks process separately on the event loop.

---

## 2. Architecture & Design

### Request Lifecycle Diagram

```text
Client (Browser / Postman)
      │
      │ HTTP POST /tasks (JWT Auth Header + JSON Body)
      ▼
Express Router (routes/taskRoutes.js)
      │
      ├─► 1. Authenticate JWT (middleware/auth.js)
      ├─► 2. Validate payload (middleware/validateTask.js)
      ├─► 3. Save task document to MongoDB via Mongoose
      ├─► 4. Invalidate user task cache (cache/taskCache.js)
      │
      ├─► 5. Send HTTP 201 Created Response IMMEDIATELY ──────► Client receives 201 (< 50ms)
      │
      └─► 6. taskEvents.emit('task-created', payload)
                  │
                  ▼
         TaskEventEmitter (events/taskEvents.js)
                  │
                  ▼
         Listener (listeners/taskListeners.js)
                  │
                  ├─► Log event queue receipt
                  ├─► setTimeout (2-second simulated async delay)
                  │         │
                  │         ▼ (Runs 2s later on event loop)
                  ├─► Log notification details (title, user ID, timestamps)
                  └─► Catch errors safely without process crash
```

### Key Architectural Concepts

1. **Synchronous Emission vs Asynchronous Handling:**  
   Node.js's built-in `EventEmitter.emit()` invokes registered listener callbacks **synchronously** in the order they were registered. Therefore, to ensure background work (such as sending emails, dispatching webhooks, or processing media) does not block the HTTP response thread, asynchronous constructs (e.g., `setTimeout`, `setImmediate`, or `Promise`/`async`) are employed inside the listener.
2. **Decoupling Side Effects:**  
   The HTTP route handler is solely responsible for validating input, persisting data to the database, invalidating stale cache, and returning the HTTP response. Notification logic, audit logging, and external dispatching are completely decoupled.
3. **Single Registration:**  
   Listeners are registered strictly once during application startup in `app.js` / `server.js` using a guard flag to prevent duplicate event invocations.
4. **Safe Error Handling:**  
   Node's `EventEmitter` has a special behavior: if an `'error'` event is emitted and no listener is registered for `'error'`, Node throws an unhandled exception and terminates the process. We register a dedicated safe error listener on `taskEvents` upon instantiation and wrap all listener execution blocks in `try / catch`.

---

## 3. Implementation Files

| File | Role |
|------|------|
| `events/taskEvents.js` | Subclasses `EventEmitter` and exports a singleton `taskEvents` instance with default error protection. |
| `listeners/taskListeners.js` | Contains listeners for `task-created`, `task-deleted`, and background notification simulation. |
| `routes/taskRoutes.js` | Emits `task-created` on successful `POST /tasks` (after 201 response) and `task-deleted` on `DELETE /tasks/:id`. |
| `app.js` | Initializes `registerTaskListeners()` once during application bootstrap. |
| `server.js` | Starts HTTP server with database connection and background event logging active. |

---

## 4. Code Highlights

### `events/taskEvents.js`
```javascript
const EventEmitter = require('events');

class TaskEventEmitter extends EventEmitter {}
const taskEvents = new TaskEventEmitter();

// Safe error listener preventing uncaught exception crashes
taskEvents.on('error', (err) => {
  console.error('\n[taskEvents] ⚠️ Handled error in task event listener:');
  console.error(`   Message: ${err && err.message ? err.message : err}`);
  console.error('   Application continues running normally without crashing.\n');
});

module.exports = taskEvents;
```

### `listeners/taskListeners.js`
```javascript
const taskEvents = require('../events/taskEvents');
let listenersRegistered = false;

function registerTaskListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  // 1. task-created listener with 2s simulated async delay
  taskEvents.on('task-created', (payload) => {
    try {
      const { task, userId, responseSentAt } = payload || {};
      const receivedAt = new Date().toISOString();
      console.log(`[Event Received] 📥 'task-created' event queued at ${receivedAt} for task: "${task ? task.title : 'N/A'}" (User: ${userId})`);

      const timer = setTimeout(() => {
        try {
          if (!task || !task.title) {
            throw new Error('Malformed task payload provided to task-created listener.');
          }
          const notificationCompletedAt = new Date().toISOString();
          console.log('\n=============================================================');
          console.log('🔔 [NOTIFICATION DISPATCHED: TASK CREATION]');
          console.log(`   Task Title             : ${task.title}`);
          console.log(`   Task Priority          : ${task.priority || 'medium'}`);
          console.log(`   Assigned User ID       : ${userId}`);
          console.log(`   API Response Point     : ${responseSentAt || 'N/A'}`);
          console.log(`   Notification Completed : ${notificationCompletedAt}`);
          console.log('   Message                : Task notification sent successfully to assignee.');
          console.log('   Execution Timing       : Asynchronous handler finished after HTTP 201 response.');
          console.log('=============================================================\n');
        } catch (innerErr) {
          taskEvents.emit('error', innerErr);
        }
      }, 2000);
      if (timer && timer.unref) timer.unref();
    } catch (outerErr) {
      taskEvents.emit('error', outerErr);
    }
  });

  // 2. task-deleted listener
  taskEvents.on('task-deleted', (payload) => {
    try {
      const { taskId, taskTitle, userId, responseSentAt } = payload || {};
      const timer = setTimeout(() => {
        try {
          const notificationCompletedAt = new Date().toISOString();
          console.log('\n=============================================================');
          console.log('🗑️ [NOTIFICATION DISPATCHED: TASK DELETION]');
          console.log(`   Deleted Task ID        : ${taskId}`);
          console.log(`   Deleted Task Title     : ${taskTitle || 'Untitled'}`);
          console.log(`   Deleted by User ID     : ${userId}`);
          console.log(`   API Response Point     : ${responseSentAt || 'N/A'}`);
          console.log(`   Audit Completed At     : ${notificationCompletedAt}`);
          console.log('   Message                : Task deletion audit log recorded.');
          console.log('=============================================================\n');
        } catch (err) {
          taskEvents.emit('error', err);
        }
      }, 1000);
      if (timer && timer.unref) timer.unref();
    } catch (err) {
      taskEvents.emit('error', err);
    }
  });
}
```

### Route Handler Emission (`routes/taskRoutes.js`)
```javascript
// POST /tasks
const responseSentAt = new Date().toISOString();
console.log(`[API] 🚀 POST /tasks HTTP 201 response sent at ${responseSentAt} for "${task.title}"`);

// 1. Send HTTP 201 response promptly to client
res.status(201).json({ message: 'Task created.', task });

// 2. Emit event for background notification processing
taskEvents.emit('task-created', {
  task,
  userId: req.user.id,
  responseSentAt,
});
```

---

## 5. Verification & Execution Evidence

### Observation 1: API Response Sent Before Background Notification Completes

When creating a new task, terminal execution produces:

```text
[API] 🚀 POST /tasks HTTP 201 response sent at 2026-10-20T16:35:00.440Z for "Study Docker and Events"
[Event Received] 📥 'task-created' event queued at 2026-10-20T16:35:00.441Z for task: "Study Docker and Events" (User: user_12345)

... (2-second simulated async delay elapsed) ...

=============================================================
🔔 [NOTIFICATION DISPATCHED: TASK CREATION]
   Task Title             : Study Docker and Events
   Task Priority          : high
   Assigned User ID       : user_12345
   API Response Point     : 2026-10-20T16:35:00.440Z
   Notification Completed : 2026-10-20T16:35:02.447Z
   Message                : Task notification sent successfully to assignee.
   Execution Timing       : Asynchronous handler finished after HTTP 201 response.
=============================================================
```

**Timestamp Proof:**
- API Response Sent: `16:35:00.440Z`
- Notification Dispatched: `16:35:02.447Z`
- **Elapsed Delta:** `2.007 seconds` (proves the client received HTTP 201 immediately without waiting 2 seconds).

---

### Observation 2: Safe Error Handling Demonstration

When a malformed event payload is emitted or a listener throws an error:

```text
[taskEvents] ⚠️ Handled error in task event listener:
   Message: Malformed task payload provided to task-created listener.
   Application continues running normally without crashing.
```

- Process remains alive.
- Core CRUD APIs, cache, and MongoDB operations continue functioning uninterrupted.

---

## 6. How to Run Locally

### Start Backend
```powershell
cd task-backend
npm run dev
```

### Create a Task via curl or Thunder Client
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Practical 10 Testing","priority":"high"}'
```

### Delete a Task
```bash
curl -X DELETE http://localhost:5000/tasks/<TASK_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 7. Viva & Practical Discussion Questions

1. **Why does EventEmitter not block the API response?**  
   Because the heavy work inside the listener is scheduled asynchronously (e.g. via `setTimeout` or I/O operations). The event loop processes the immediate response, writes headers and body to the socket, and later handles the timer callback when it expires.
2. **Why is EventEmitter ideal for single-instance Node.js apps but insufficient for distributed clusters?**  
   Node's `EventEmitter` is an in-memory process-bound event bus. Events cannot cross process boundaries. In a multi-instance or multi-server deployment, messages would not reach other worker instances; a distributed broker like Redis Pub/Sub, RabbitMQ, or Kafka would be required.
3. **What happens if an error is thrown inside an EventEmitter callback without try/catch?**  
   If an uncaught exception occurs or an unhandled `'error'` event is emitted, Node.js terminates the entire process with an unhandled exception. Wrapping callbacks in try/catch and listening to `'error'` ensures process resilience.
