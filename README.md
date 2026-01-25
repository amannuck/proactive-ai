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

## Database initialization (optional)

The backend will automatically initialize and populate `forecasting.db` on startup using the scripts in `backend/database/`.

If you want to reproduce the initialization manually using the SQLite CLI, run the steps below from the repo root.

```sh
cd backend

# Step 1: Create raw/dim/fact tables
sqlite3 forecasting.db < database/migration.sql

# Step 2: Load CSV data into raw_* tables
sqlite3 forecasting.db \
  ".mode csv" \
  ".import --skip 1 database/csv-data/supplier_contracts.csv raw_supplier_contract" \
  ".import --skip 1 database/csv-data/staffing_schedule.csv raw_staff_schedule" \
  ".import --skip 1 database/csv-data/patient_data.csv raw_patient_data" \
  ".import --skip 1 database/csv-data/historical_events.csv raw_historical_events" \
  ".import --skip 1 database/csv-data/ed_hourly_snapshots.csv raw_ed_hourly_snapshot" \
  ".import --skip 1 database/csv-data/current_inventory.csv raw_current_inventory"

# Step 3: Seed dimension tables from raw_* tables
sqlite3 forecasting.db < database/seed_dimensions.sql

# Step 4: Populate fact tables from raw_* tables
sqlite3 forecasting.db < database/etl_facts.sql
```

### What `database/etl_facts.sql` does

`etl_facts.sql` is the transformation step that converts CSV-ingested `raw_*` tables into the typed, query-optimized `fact_*` tables that the API reads.

It populates:

- **`fact_ed_hourly`**
  - Builds an ISO8601 hour bucket `ts` (e.g. `2024-01-15T14:00:00Z`) from `raw_ed_hourly_snapshot.date_str` + `hour_of_day`
  - Casts numeric strings into integers/reals for metrics (arrivals, occupancy, etc.)

- **`fact_staff_shift`**
  - Normalizes `raw_staff_schedule` into typed staffing rows
  - Casts numeric fields and converts boolean-like flags (e.g. `needs_on_call_activation`) into `0/1`

- **`fact_inventory_snapshot`**
  - Creates a point-in-time inventory snapshot from `raw_current_inventory`
  - Maps `location` to `dim_location.location_id`
  - Casts stock/par/burn-rate fields into numeric types

- **`fact_event`**
  - Normalizes `raw_historical_events` into typed event rows
  - Casts severity/volume fields into numeric types

- **`fact_encounter`**
  - Normalizes `raw_patient_data` into patient encounter rows
  - Constructs `ts_admit`/`ts_discharge` as ISO8601 timestamps by combining `admission_date` + `time_admission/time_discharge`
  - Handles overnight discharges (adds `+1 day` if discharge time is earlier than admission time)

- **`fact_supplier_contract`**
  - Normalizes `raw_supplier_contract` into typed supplier contract rows
  - Casts price, lead time, reliability, and min order quantity into numeric types

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
