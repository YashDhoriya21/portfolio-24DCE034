// events/taskEvents.js
// Practical 10 — Asynchronous Processing with Event-Driven Architecture
// Dedicated event module using Node.js's native 'events' module

const EventEmitter = require('events');

class TaskEventEmitter extends EventEmitter {}

// Instantiate a single shared TaskEventEmitter for the application
const taskEvents = new TaskEventEmitter();

// Safe default error handler to catch any custom 'error' events
// This ensures listener errors do not crash the Node.js process
taskEvents.on('error', (err) => {
  console.error('\n[taskEvents] ⚠️ Handled error in task event listener:');
  console.error(`   Message: ${err && err.message ? err.message : err}`);
  console.error('   Application continues running normally without crashing.\n');
});

module.exports = taskEvents;
