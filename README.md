# School Management System API

RESTful API for managing schools, classrooms, and students with role-based access (superadmin, school administrator). Built on the axion template.

**Live API:** [https://soar-backend-engineer-test.onrender.com/](https://soar-backend-engineer-test.onrender.com/) — API docs and base URL for all endpoints.

## Tech stack

- **Runtime:** Node.js
- **HTTP:** Express
- **Auth:** JWT (long token in `token` header)
- **Persistence:** MongoDB (Mongoose), Redis (cache/session)
- **Validation:** qantra-pineapple + schema files

## Prerequisites

- Node.js 18+
- MongoDB
- Redis

## Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. Environment variables (create `.env` or export):

   - `MONGO_URI` – MongoDB connection (default: `mongodb://localhost:27017/axion`)
   - `REDIS_URI` or `CACHE_REDIS` – Redis URL (default: `redis://127.0.0.1:6379`)
   - `LONG_TOKEN_SECRET` – JWT secret for long-lived tokens (required)
   - `SHORT_TOKEN_SECRET` – JWT secret for short-lived tokens (required)
   - `NACL_SECRET` – Required by template
   - `USER_PORT` – API port (default: 5111)

3. Create first superadmin (only when no users exist):

   ```bash
   INITIAL_SUPERADMIN_EMAIL=admin@example.com INITIAL_SUPERADMIN_PASSWORD=yourpassword node scripts/seed-superadmin.js
   ```

4. Start the API:

   ```bash
   npm start
   ```

   Server listens on `USER_PORT` (default 5111).

## API overview

- **Base path:** `/api/:moduleName/:fnName` (e.g. `/api/auth/login`, `/api/school/list`)
- **Auth:** Send JWT in header: `token: <longToken>`
- **Roles:** `superadmin` (full access), `school_admin` (assigned school only)

See [docs/API.md](docs/API.md) for full endpoint list, request/response formats, and error codes.  
See [docs/DATABASE.md](docs/DATABASE.md) for database schema and diagram.

## Tests

1. Start MongoDB and Redis.
2. Run seed script (see above).
3. Start the server: `npm start`.
4. In another terminal, run tests:

   ```bash
   npm test
   ```

   Tests use superadmin credentials from `.env` (`INITIAL_SUPERADMIN_EMAIL`, `INITIAL_SUPERADMIN_PASSWORD`) — the same you used for the seed script. Optional: set `BASE_URL` if the server is not on `http://localhost:5111`, or set `TEST_SUPERADMIN_EMAIL` and `TEST_SUPERADMIN_PASSWORD` to override.

## Deployment

For step-by-step public hosting (Railway + MongoDB Atlas + Upstash Redis), see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Short version: push to GitHub, create MongoDB Atlas and Redis (e.g. Upstash) free tiers, deploy the repo to Railway (or Render/Heroku), set env vars (MONGO_URI, REDIS_URI, LONG_TOKEN_SECRET, SHORT_TOKEN_SECRET, NACL_SECRET, INITIAL_SUPERADMIN_EMAIL, INITIAL_SUPERADMIN_PASSWORD), generate a domain, then run the seed script once to create the first superadmin.

## Project structure (additions)

- `managers/entities/auth/` – Login, create user (RBAC)
- `managers/entities/school/` – School CRUD and profile
- `managers/entities/classroom/` – Classroom CRUD (school-scoped)
- `managers/entities/student/` – Student CRUD, enroll, transfer
- `mws/__requireSuperadmin.mw.js`, `mws/__requireSchoolAdmin.mw.js` – RBAC middleware
- `docs/API.md`, `docs/DATABASE.md` – API and schema documentation
- `scripts/seed-superadmin.js` – Initial superadmin seed