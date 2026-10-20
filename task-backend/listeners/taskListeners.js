// listeners/taskListeners.js
// Practical 10 — Asynchronous Processing with Event-Driven Architecture
// Separate listener module registered during server startup

const taskEvents = require('../events/taskEvents');

let listenersRegistered = false;

/**
 * Registers all task-related event listeners on the shared TaskEventEmitter.
 * Guarded by a flag to guarantee one-time registration during server startup.
 */
function registerTaskListeners() {
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  // ---------------------------------------------------------------------------
  // 1. 'task-created' Event Listener
  // ---------------------------------------------------------------------------
  // Handles background notification dispatch when a task is created.
  // Uses setTimeout to simulate a 2-second async processing delay (e.g. sending
  // an email or webhook) without blocking the client HTTP response.
  // ---------------------------------------------------------------------------
  taskEvents.on('task-created', (payload) => {
    try {
      const { task, userId, responseSentAt } = payload || {};
      const receivedAt = new Date().toISOString();

      console.log(`[Event Received] 📥 'task-created' event queued at ${receivedAt} for task: "${task ? task.title : 'N/A'}" (User: ${userId})`);

      // Simulated 2-second background processing delay
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
          // Pass listener errors to the custom error event handler
          taskEvents.emit('error', innerErr);
        }
      }, 2000);
      if (timer && timer.unref) timer.unref();
    } catch (outerErr) {
      taskEvents.emit('error', outerErr);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. 'task-deleted' Event Listener
  // ---------------------------------------------------------------------------
  // Handles background audit logging and deletion cleanup notifications.
  // ---------------------------------------------------------------------------
  taskEvents.on('task-deleted', (payload) => {
    try {
      const { taskId, taskTitle, userId, responseSentAt } = payload || {};
      const receivedAt = new Date().toISOString();

      console.log(`[Event Received] 📥 'task-deleted' event queued at ${receivedAt} for Task ID: ${taskId}`);

      // Simulated 1-second background audit delay
      const deleteTimer = setTimeout(() => {
        try {
          const notificationCompletedAt = new Date().toISOString();

          console.log('\n=============================================================');
          console.log('🗑️ [NOTIFICATION DISPATCHED: TASK DELETION]');
          console.log(`   Deleted Task ID        : ${taskId}`);
          console.log(`   Deleted Task Title     : ${taskTitle || 'Untitled'}`);
          console.log(`   Deleted by User ID     : ${userId}`);
          console.log(`   API Response Point     : ${responseSentAt || 'N/A'}`);
          console.log(`   Audit Completed At     : ${notificationCompletedAt}`);
          console.log('   Message                : Task deletion audit log recorded and notification sent.');
          console.log('   Execution Timing       : Asynchronous handler finished after HTTP 200 response.');
          console.log('=============================================================\n');
        } catch (innerErr) {
          taskEvents.emit('error', innerErr);
        }
      }, 1000);
      if (deleteTimer && deleteTimer.unref) deleteTimer.unref();
    } catch (outerErr) {
      taskEvents.emit('error', outerErr);
    }
  });

  console.log('⚡ [Events] Practical 10 task listeners registered.');
}

module.exports = { registerTaskListeners };
