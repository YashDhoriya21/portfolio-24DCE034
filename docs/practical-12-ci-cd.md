# Practical 12 — CI/CD Pipeline with GitHub Actions

**Student:** Yash Dhoriya (24DCE034)  
**Subject:** Advanced Web Development Frameworks (ITUE301) | Semester: 5th  
**Date:** 20 October 2026  
**Project:** Task Management Application — Automated CI Pipeline  

---

## 1. Objective

Design, configure, and execute an automated Continuous Integration (CI) pipeline using **GitHub Actions** that triggers automatically on code pushes and pull requests to the `main` branch. The pipeline installs dependencies in isolated environments, executes real automated tests with Jest & Supertest, builds the React frontend production bundle, and provides pass/fail feedback with status badges.

---

## 2. Pipeline Architecture & Workflow

```text
git push origin main / Pull Request
                │
                ▼
      GitHub Actions Trigger
                │
        ┌───────┴────────────────────────┐
        ▼                                ▼
[Job 1: backend-test]          [Job 2: frontend-build]
  │                              │
  ├─► Service: MongoDB 6         ├─► Checkout repo
  ├─► Checkout repo              ├─► Setup Node.js 18
  ├─► Setup Node.js 18           ├─► Install frontend deps
  ├─► Install backend deps       └─► Run 'npm run build' (Vite)
  └─► Run 'npm test' (Jest)              │
        │                                │
        └───────────────┬────────────────┘
                        ▼
           Workflow Result on GitHub:
         ✅ Green Check (All Jobs Passed)
                      OR
         ❌ Red Cross (Test / Build Failed)
```

---

## 3. Workflow Configuration (`.github/workflows/ci.yml`)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  # -------------------------------------------------------------
  # Job 1: Backend Testing (Jest, Supertest, Events, Security)
  # -------------------------------------------------------------
  backend-test:
    name: Backend Tests & Quality Checks
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6-jammy
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --quiet --eval \"db.adminCommand('ping').ok\""
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: task-backend/package-lock.json

      - name: Install Backend Dependencies
        working-directory: ./task-backend
        run: npm ci || npm install

      - name: Run Backend Automated Test Suite
        working-directory: ./task-backend
        env:
          NODE_ENV: test
          PORT: 5000
          MONGO_URI: mongodb://localhost:27017/testdb
          JWT_SECRET: ci_github_actions_test_jwt_secret_key_32chars
        run: npm test

  # -------------------------------------------------------------
  # Job 2: Frontend Production Build & Bundle Verification
  # -------------------------------------------------------------
  frontend-build:
    name: Frontend Build & Verification
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: student-portfolio/package-lock.json

      - name: Install Frontend Dependencies
        working-directory: ./student-portfolio
        run: npm ci || npm install

      - name: Build React Application
        working-directory: ./student-portfolio
        env:
          VITE_API_BASE_URL: ''
        run: npm run build
```

---

## 4. Automated Test Suite Specification (`task-backend/tests/api.test.js`)

The test suite contains **11 genuine, meaningful test cases** executed using **Jest** and **Supertest** against the decoupled Express `app`:

| Test Category | Test Case | Expected Assertion |
|---------------|-----------|--------------------|
| **Health Check** | `GET /` | Status `200`, `status: 'Task Management API running'`, `version: '1.0.0'` |
| **Security** | `GET /tasks` (no token) | Status `401`, `error: 'No token provided. Authorization denied.'` |
| **Security** | `GET /tasks` (invalid token) | Status `401`, `error: 'Token is invalid or expired.'` |
| **Security** | `POST /tasks` (unauthenticated) | Status `401`, `error: 'No token provided. Authorization denied.'` |
| **Validation** | `POST /auth/register` (missing password) | Status `400`, `error: 'Email and password are required.'` |
| **Validation** | `POST /auth/register` (password < 6 chars) | Status `400`, `error: 'Password must be at least 6 characters.'` |
| **Validation** | `POST /auth/login` (missing password) | Status `400`, `error: 'Email and password are required.'` |
| **Cache Stats** | `GET /debug/cache` | Status `200`, returns `hits`, `misses`, `keys` array |
| **Practical 10 Events** | `task-created` event emission | Emits payload without synchronous exception |
| **Practical 10 Events** | `task-deleted` event emission | Emits payload without synchronous exception |
| **Practical 10 Events** | Listener error resilience | Safe error listener catches error; application does not crash |

---

## 5. Local Test Execution Results

Running `npm test` inside `task-backend`:

```text
PASS tests/api.test.js
  Task Management API Test Suite (Practical 12 CI/CD)
    GET / (API Health Check)
      √ should return HTTP 200 and API status object (70 ms)
    Security & Protected Routes (Practical 7)
      √ should reject GET /tasks with HTTP 401 when no token is provided (22 ms)
      √ should reject GET /tasks with HTTP 401 when an invalid token is supplied (7 ms)
      √ should reject POST /tasks with HTTP 401 when unauthenticated (18 ms)
    Auth Input Validation (Practical 7)
      √ should return HTTP 400 if email or password is missing on registration (11 ms)
      √ should return HTTP 400 if password length is under 6 characters (16 ms)
      √ should return HTTP 400 if login credentials are incomplete (9 ms)
    GET /debug/cache (Practical 9 Caching)
      √ should return cache telemetry and stats (8 ms)
    Event-Driven Architecture (Practical 10)
      √ should emit task-created event without throwing synchronous errors (5 ms)
      √ should emit task-deleted event without throwing synchronous errors (3 ms)
      √ should catch listener errors safely through the error event listener (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        1.179 s
Ran all test suites.
```

---

## 6. Required Demonstration: Failed Run & Passed Run

The subject practical rubric requires demonstrating both a pipeline failure and a recovery.

### Step A: Creating a Deliberate Test Failure
1. In `task-backend/tests/api.test.js`, locate line 16 in the Health Check test:
   ```javascript
   // Change expected status from 200 to 201:
   expect(res.statusCode).toBe(201); // Deliberate failure
   ```
2. Commit and push:
   ```bash
   git add task-backend/tests/api.test.js
   git commit -m "test: deliberately trigger test failure for Practical 12 demonstration"
   git push origin main
   ```
3. Open the **Actions** tab on your GitHub repository.
4. **Observation:**
   - The workflow icon turns **Red (❌)**.
   - Clicking `backend-test` displays:
     ```text
     FAIL tests/api.test.js
       ● Task Management API Test Suite (Practical 12 CI/CD) › GET / (API Health Check) › should return HTTP 200 and API status object
         Expected: 201
         Received: 200
     ```
   - Process exits with non-zero code `1`.
5. Capture a screenshot of the red failure status.

### Step B: Restoring the Test to Pass
1. Revert line 16 back to `200`:
   ```javascript
   expect(res.statusCode).toBe(200);
   ```
2. Commit and push:
   ```bash
   git add task-backend/tests/api.test.js
   git commit -m "fix: restore health check test expectation to HTTP 200"
   git push origin main
   ```
3. Check the **Actions** tab on GitHub:
   - The workflow icon turns **Green (✅)**.
   - All 11 tests pass and the frontend build succeeds.
4. Capture a screenshot of the green passed run.

---

## 7. Status Badge Configuration

The badge in your root `README.md` is configured as:

```markdown
[![CI Pipeline](https://github.com/YashDhoriya21/portfolio-24DCE034/actions/workflows/ci.yml/badge.svg)](https://github.com/YashDhoriya21/portfolio-24DCE034/actions/workflows/ci.yml)
```


---

## 8. Viva & Practical Discussion Questions

1. **What is the difference between Continuous Integration and Continuous Deployment?**  
   - **Continuous Integration (CI):** The practice of automating the integration of code changes from multiple contributors into a single software project. Code is automatically built, linted, and tested on every push or pull request to catch bugs early.  
   - **Continuous Deployment (CD):** The automated process of releasing every validated build directly to production environments without human intervention. This practical focuses specifically on CI.
2. **Why does running automated tests on every push prevent "integration hell"?**  
   Developers receive immediate feedback within minutes if an error or regression is introduced. Finding a bug when only 10 lines of code have changed is exponentially easier than finding a bug after months of accumulated unverified merges.
3. **Why do we use service containers for MongoDB in GitHub Actions instead of connecting to a remote MongoDB Atlas database?**  
   - Prevents exposing private database credentials in CI logs or pull requests.
   - Ensures fast, isolated, deterministic, and network-independent test runs that start with a pristine, empty database each time.
