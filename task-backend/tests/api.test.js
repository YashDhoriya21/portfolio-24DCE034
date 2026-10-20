// tests/api.test.js
// Practical 12 — Automated Testing with Jest & Supertest
// Covers API Health, Security / Authentication, Validation, and Practical 10 Events

const request = require('supertest');
const app = require('../app');
const taskEvents = require('../events/taskEvents');

describe('Task Management API Test Suite (Practical 12 CI/CD)', () => {

  // ---------------------------------------------------------------------------
  // 1. Health Check Endpoint Test
  // ---------------------------------------------------------------------------
  describe('GET / (API Health Check)', () => {
    it('should return HTTP 200 and API status object', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('status', 'Task Management API running');
      expect(res.body).toHaveProperty('version', '1.0.0');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & Authorization Security Tests
  // ---------------------------------------------------------------------------
  describe('Security & Protected Routes (Practical 7)', () => {
    it('should reject GET /tasks with HTTP 401 when no token is provided', async () => {
      const res = await request(app).get('/tasks');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'No token provided. Authorization denied.');
    });

    it('should reject GET /tasks with HTTP 401 when an invalid token is supplied', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', 'Bearer invalid_malformed_token_xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Token is invalid or expired.');
    });

    it('should reject POST /tasks with HTTP 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Unauthorized Task' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'No token provided. Authorization denied.');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Request Validation Tests
  // ---------------------------------------------------------------------------
  describe('Auth Input Validation (Practical 7)', () => {
    it('should return HTTP 400 if email or password is missing on registration', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com' }); // missing password

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password are required.');
    });

    it('should return HTTP 400 if password length is under 6 characters', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters.');
    });

    it('should return HTTP 400 if login credentials are incomplete', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' }); // missing password

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password are required.');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Cache Stats Endpoint Test (Practical 9)
  // ---------------------------------------------------------------------------
  describe('GET /debug/cache (Practical 9 Caching)', () => {
    it('should return cache telemetry and stats', async () => {
      const res = await request(app).get('/debug/cache');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hits');
      expect(res.body).toHaveProperty('misses');
      expect(res.body).toHaveProperty('keys');
      expect(Array.isArray(res.body.keys)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Practical 10 EventEmitter Tests
  // ---------------------------------------------------------------------------
  describe('Event-Driven Architecture (Practical 10)', () => {
    it('should emit task-created event without throwing synchronous errors', (done) => {
      const testTask = {
        title: 'CI Test Event Task',
        priority: 'high',
      };

      expect(() => {
        taskEvents.emit('task-created', {
          task: testTask,
          userId: 'ci_user_1',
          responseSentAt: new Date().toISOString(),
        });
      }).not.toThrow();

      done();
    });

    it('should emit task-deleted event without throwing synchronous errors', (done) => {
      expect(() => {
        taskEvents.emit('task-deleted', {
          taskId: 'fake_task_id_ci',
          taskTitle: 'Deleted CI Task',
          userId: 'ci_user_1',
          responseSentAt: new Date().toISOString(),
        });
      }).not.toThrow();

      done();
    });

    it('should catch listener errors safely through the error event listener', (done) => {
      // Emitting error with custom error handler
      const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

      expect(() => {
        taskEvents.emit('error', new Error('Simulated notification failure in CI test'));
      }).not.toThrow();

      spy.mockRestore();
      done();
    });
  });
});
