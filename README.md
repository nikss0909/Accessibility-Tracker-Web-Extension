# Accessibility Tracker

Accessibility Tracker is a developer-friendly accessibility testing platform with a Chrome Extension, SaaS-style dashboard, reporting, team collaboration, and a Node.js API backend.

The extension popup keeps the original lightweight scan workflow. Product expansion happens through richer scanner intelligence, exports, scan history, a separate dashboard, and backend APIs.

## Product Modules

- Chrome Extension: scans the active page, highlights issues, exports reports, stores scan history, and provides AI-style remediation guidance.
- Dashboard: login/signup experience, profile, scan history, score charts, recurring issue analytics, team projects, issue collaboration, saved reports, shared dashboards, and website management.
- Backend API: JWT auth, user accounts, teams, role-based access, projects, websites, scans, reports, issues, comments, assignments, status tracking, weekly summaries, and MongoDB persistence.
- Production tooling: tests, linting, CI, Docker, rate limiting, security headers, structured logging, and production environment examples.

## Tech Stack

- Frontend: React, Vite
- Extension: Chrome Manifest V3
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT
- Testing: Vitest, Testing Library, Node test runner, Supertest
- Linting: ESLint flat config
- Deployment: Docker, Docker Compose, GitHub Actions

## Quick Start

Install frontend/dashboard dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd accessibility-backend
npm install
copy .env.example .env
cd ..
```

Start the dashboard dev server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/dashboard.html
```

Start the backend:

```bash
cd accessibility-backend
npm run dev
```

The backend expects MongoDB at:

```text
mongodb://127.0.0.1:27017/accessibility_tracker
```

## Build The Extension

```bash
npm run build
```

Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `dist` folder.
5. Open a website, click the extension, and run Scan Page.

The extension popup remains intentionally compact. The only added optional controls are reporting, realtime monitoring, backend send, and dashboard access.

## Quality Commands

Frontend, dashboard, and extension:

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=low
```

Backend:

```bash
cd accessibility-backend
npm run lint
npm test
npm audit --audit-level=low
```

## Folder Structure

```text
.
├── public/
│   ├── content.js              # Extension scanner, issue intelligence, highlighting, auto-fix
│   ├── manifest.json           # Chrome Manifest V3 config
│   └── icons/                  # Extension icons
├── src/
│   ├── popup/                  # Existing extension popup UI
│   └── dashboard/              # SaaS dashboard React app
├── accessibility-backend/
│   ├── src/
│   │   ├── config/             # Env and database config
│   │   ├── controllers/        # API business logic
│   │   ├── middleware/         # Auth, errors, request context
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # REST API routes
│   │   └── utils/              # Logger, tokens, async helpers
│   ├── Dockerfile
│   ├── README.md
│   └── server.js
├── dashboard.html              # Dashboard Vite entry
├── popup.html                  # Extension popup Vite entry
├── docker-compose.yml          # MongoDB + API + dashboard
├── Dockerfile.dashboard        # Dashboard container
├── PRODUCTION.md               # Production checklist
└── .github/workflows/ci.yml    # CI pipeline
```

## Scanner Coverage

The scanner checks for:

- Missing alt text
- Heading hierarchy problems
- Missing form labels
- Empty buttons
- Weak link text
- Duplicate IDs
- ARIA misuse
- Focus visibility issues
- Keyboard navigation issues
- Contrast problems
- Missing landmarks
- Semantic HTML issues
- Missing language/title metadata

Each issue includes:

- Severity: Critical, High, Medium, Low
- Exact selector
- Simple explanation
- Disabled-user impact
- Corrected HTML example
- Contrast color suggestions
- Semantic replacement guidance
- Best-practice tip
- Optional auto-fix when safe

## Backend API Overview

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Teams and users:

- `GET /api/teams`
- `PATCH /api/teams/:teamId`
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/members`
- `PATCH /api/teams/:teamId/members/:userId`
- `GET /api/users`
- `PATCH /api/users/me`

Projects and websites:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `POST /api/projects/:projectId/websites`
- `PATCH /api/projects/:projectId/websites/:websiteId`
- `DELETE /api/projects/:projectId/websites/:websiteId`

Scans and analytics:

- `GET /api/scans`
- `POST /api/scans`
- `GET /api/scans/analytics`
- `GET /api/scans/:scanId`
- `DELETE /api/scans/:scanId`

Issues:

- `GET /api/issues`
- `POST /api/issues`
- `GET /api/issues/summary`
- `PATCH /api/issues/:issueId`
- `POST /api/issues/:issueId/comments`

Reports:

- `GET /api/reports`
- `POST /api/reports`
- `POST /api/reports/extension`
- `POST /api/reports/weekly-summary`
- `GET /api/reports/:reportId`
- `PATCH /api/reports/:reportId/archive`

Protected routes require:

```http
Authorization: Bearer <jwt>
```

## Deployment Guide

### Docker Compose

```bash
docker compose up --build
```

Services:

- Dashboard: `http://localhost:8080`
- API: `http://localhost:5000`
- MongoDB: `localhost:27017`

### Backend Production

Use `accessibility-backend/.env.production.example` as the template.

Required production values:

- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `TRUST_PROXY=true` when behind a trusted proxy

Recommended:

- Use managed MongoDB with authentication enabled.
- Store secrets in the deployment platform secret manager.
- Put the API behind HTTPS.
- Restrict CORS to the dashboard domain and extension origin.
- Forward logs to a central log platform.

### Dashboard Production

Build static assets:

```bash
npm run build
```

Host `dist` using Nginx, Netlify, Vercel static hosting, S3/CloudFront, or the included `Dockerfile.dashboard`.

### Chrome Extension Release

```bash
npm run build
```

Package the generated `dist` folder for Chrome Web Store submission after validating:

- `manifest.json`
- popup behavior
- content script scanning
- permissions
- icons

## CI/CD

GitHub Actions runs on push and pull requests to `main`:

- frontend install, lint, tests, audit, build
- backend install, lint, tests, audit, Docker build

Workflow file:

```text
.github/workflows/ci.yml
```

## Security And Reliability

- JWT auth with role-based access control
- Helmet security headers
- Rate limiting
- Configurable CORS
- JSON request size limits
- Structured JSON logging
- Request IDs on all responses
- Production-safe error responses
- Dependency audit in CI
- Dockerized runtime

## Current Verification

The following commands pass locally:

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=low
```

```bash
cd accessibility-backend
npm run lint
npm test
npm audit --audit-level=low
```

Docker files are included, but Docker must be installed locally to run compose/build checks.
