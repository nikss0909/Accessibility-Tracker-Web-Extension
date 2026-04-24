# Accessibility Tracker API

Node.js, Express, MongoDB, and JWT backend for the Accessibility Tracker product.

## Setup

```bash
cd accessibility-backend
npm install
copy .env.example .env
npm run dev
```

MongoDB must be running locally or `MONGODB_URI` must point to a hosted MongoDB database.

## Core Routes

- `POST /api/auth/signup` - create user and team
- `POST /api/auth/login` - receive JWT
- `GET /api/auth/me` - current user profile
- `GET /api/teams` - current team list
- `POST /api/teams/:teamId/members` - invite member
- `GET /api/projects` - project and website list
- `POST /api/projects` - create project
- `POST /api/projects/:projectId/websites` - add website
- `GET /api/scans` - scan history
- `POST /api/scans` - save extension/dashboard scan
- `GET /api/scans/analytics` - score trend and recurring issues
- `GET /api/issues` - shared issue tracker
- `POST /api/issues` - create issue
- `PATCH /api/issues/:issueId` - assign issue or update status
- `POST /api/issues/:issueId/comments` - comment on issue
- `GET /api/reports` - saved reports
- `POST /api/reports` - store report metadata/payload
- `POST /api/reports/extension` - extension-compatible report ingestion
- `POST /api/reports/weekly-summary` - generate weekly summary report

Protected routes require:

```http
Authorization: Bearer <jwt>
```

## Roles

Supported roles are `admin`, `owner`, `manager`, `member`, and `viewer`.
