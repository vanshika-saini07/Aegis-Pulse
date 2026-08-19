# Aegis Pulse

Aegis Pulse is a live personal-safety tether. A traveller creates a protected journey, shares a secure tracking link with a trusted contact, checks in periodically, and can activate an intentional SOS signal. The trusted view polls the real backend for the latest state.

## Stack

- React, Vite, and TypeScript
- Node.js and Express
- PostgreSQL with Prisma ORM
- Zod request validation
- Same-origin production build, ready for a Cloud Run container

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Replace `DATABASE_URL` with a reachable PostgreSQL connection string.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:migrate`.
6. Run `npm run dev` and open `http://localhost:5173`.

Vite proxies `/api` to Express on port 4000 during development. For the production shape, run `npm run build` and then `npm start`; Express serves both the REST API and the compiled React app on `process.env.PORT || 4000`.

## API

- `GET /api/health`
- `POST /api/sessions`
- `GET /api/sessions/:shareCode`
- `POST /api/sessions/:id/check-in`
- `POST /api/sessions/:id/location`
- `POST /api/sessions/:id/sos`
- `POST /api/sessions/:id/complete`

Session reads atomically promote expired active journeys to `OVERDUE` and write an audit event. Share codes are generated from cryptographically secure random bytes. Validation and error middleware return safe structured responses without exposing database internals.

## Deployment

The multi-stage `Dockerfile` builds the client and server into a compact Node runtime. Configure `DATABASE_URL` as a Cloud Run secret/environment variable and apply the retained Prisma migration before serving production traffic.
