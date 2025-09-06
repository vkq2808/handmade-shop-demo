## HM Monorepo – Install, Seed, and Run

This guide covers installing dependencies, configuring environment variables, seeding sample data, and running the frontend and backend in development.

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local instance or a cloud URI)

## 1) Install dependencies

From the repository root:

```bash
npm install
```

This runs both frontend and backend installs via the root scripts.

Alternative (manual):

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2) Configure environment variables (backend)

Create `backend/.env` (you can copy from the provided example):

```bash
cp backend/.env.example backend/.env
```

Edit values as needed. Key variables used by the backend:
- PORT: API port (default 5000)
- MONGODB_URI: Mongo connection string
- JWT_SECRET: Secret for JWT signing
- FRONTEND_URL: Your Vite dev URL (default http://localhost:5173)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM: Optional SMTP settings for emails

## 3) Seed sample data

Ensure `MONGODB_URI` is set in `backend/.env`, then run from the repo root:

```bash
npm run seed:all
```

This seeds settings and sample data (users, categories, products, orders) from `backend/sample_data/`.

Useful variants (run inside `backend/`):

```bash
npm run seed:sample        # import sample data
npm run seed:sample:drop   # drop target collections before import
npm run seed:settings      # seed settings only
```

## 4) Run in development

Option A – start both (frontend + backend) from root:

```bash
npm start
```

Note: This uses the `concurrently` CLI. If you see "concurrently: command not found", install it at the root:

```bash
npm i -D concurrently
```

Option B – start each separately:

Backend (Express + MongoDB):
```bash
cd backend
npm run dev
```

Frontend (Vite + React):
```bash
cd frontend
npm run dev
```

## URLs
- API base: http://localhost:5000 (configurable via `PORT`)
- Frontend: http://localhost:5173 (Vite default)

## Troubleshooting
- Mongo connection error: verify `MONGODB_URI` in `backend/.env`, and ensure MongoDB is running and reachable.
- CORS issues: set `FRONTEND_URL` in `backend/.env` to your actual frontend origin, e.g. `http://localhost:5173`.
- Email not sending: configure SMTP variables in `backend/.env` and use an app password if required by your provider.
- `concurrently` missing: install it with `npm i -D concurrently` at the repo root or run backend/frontend in separate terminals.

## Scripts overview
- Root: `npm run install` (install both), `npm run seed:all`, `npm run start:fe`, `npm run start:be`, `npm start`
- Backend: `npm run dev`, `npm run seed:all`, `npm run seed:sample`, `npm run seed:sample:drop`, `npm run seed:settings`

