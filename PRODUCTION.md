# Production Readiness

## Configuration

- Frontend builds with `npm run build` into `dist/`.
- Backend reads configuration from environment variables.
- Use `accessibility-backend/.env.production.example` as the deployment template.
- Set `JWT_SECRET` from a secret manager. Do not commit real secrets.
- Set `CORS_ORIGIN` to the deployed dashboard domain and Chrome extension origin.
- Set `TRUST_PROXY=true` only behind a trusted reverse proxy or load balancer.

## Security

- Helmet security headers are enabled.
- JSON body size is limited through `JSON_LIMIT`.
- Rate limiting is controlled by `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`.
- JWT auth protects product APIs.
- Role-based access controls are applied to team, project, issue, scan, and report mutations.
- MongoDB should run with authentication enabled in hosted or production environments.

## Logging

- Backend logs are structured JSON with request IDs.
- Error responses include `requestId` so production logs can be correlated with support reports.
- Stack traces are hidden when `NODE_ENV=production`.

## Docker

Run the full stack locally:

```bash
docker compose up --build
```

Services:

- Dashboard: `http://localhost:8080`
- API: `http://localhost:5000`
- MongoDB: `localhost:27017`

## CI

GitHub Actions runs:

- frontend install, lint, tests, audit, build
- backend install, lint, tests, audit, Docker build
