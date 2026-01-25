# Quick Start Guide

## Data is Now Ready!

The ETL script has populated your fact tables. Your data spans:
- **Date Range**: 2020-01-01 to 2025-12-31
- **ED Hourly**: 52,608 records
- **Staff Shifts**: 60 records
- **Inventory**: 31 records

## Test the API

### 1. Start the Server
```bash
npm run dev
```

### 2. Test with Correct Dates

**ED Hourly (January 2020):**
```bash
curl "http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31"
```

**Staff Day (use a date that has staff data):**
```bash
curl "http://localhost:3000/api/ui/staff/day?date=2026-01-24"
```

**Inventory Risk:**
```bash
curl "http://localhost:3000/api/ui/inventory/risk?days=7"
```

**Agent Context:**
```bash
curl "http://localhost:3000/api/agent/context?from=2020-01-01&to=2020-01-31&date=2026-01-24"
```

## Find Valid Dates

To find dates that have data:

```bash
# ED Hourly dates
sqlite3 forecasting.db "SELECT DISTINCT date FROM fact_ed_hourly ORDER BY date LIMIT 10;"

# Staff dates
sqlite3 forecasting.db "SELECT DISTINCT date FROM fact_staff_shift ORDER BY date LIMIT 10;"
```

## If You Need to Re-run ETL

If you reload CSV data, re-run the ETL:

```bash
sqlite3 forecasting.db < database/etl_facts.sql
```
