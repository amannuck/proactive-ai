# Proactive Pulse

An AI-powered emergency department surge prediction and resource management system.

This repository contains:
- `frontend/`: React dashboard UI
- `backend/`: Express API + SQLite forecasting dataset

## Tech Stack

### Frontend

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn-ui

See: `frontend/README.md`

### Backend

- Node.js + TypeScript
- Express (REST API)
- SQLite (via `better-sqlite3`)

The backend serves API routes under:
- `GET /health`
- `GET /api/ui/*`
- `GET /api/agent/*`

Default port: `3000` (configurable via `PORT`).

## Prerequisites

- Node.js `>=16`
- npm

Optional (only if you want to inspect the DB from CLI):
- `sqlite3`

## Setup

Install dependencies separately for backend and frontend.

### Backend setup

```sh
cd backend
npm install
```

### Frontend setup

```sh
cd frontend
npm install
```

## Run the application (development)

Open two terminals.

### 1) Start the backend API

```sh
cd backend
npm run dev
```

Backend will run at:
- `http://localhost:3000`
- `http://localhost:3000/health`

### 2) Start the frontend

```sh
cd frontend
npm run dev
```

Frontend will run at:
- `http://localhost:5173` (or the next available port)

## Useful docs

- Frontend details: `frontend/README.md`
- Backend quick start / sample curls: `backend/QUICK_START.md`
- Backend API examples: `backend/API_EXAMPLES.md`
- API endpoint reference: `backend/API_ENDPOINTS_REFERENCE.md`

## Scripts (high level)

### Backend (`backend/package.json`)

- `npm run dev` (dev server)
- `npm run build` (TypeScript compile)
- `npm start` (run compiled server)

### Frontend

See `frontend/README.md` for the full list (dev/build/preview/lint).
