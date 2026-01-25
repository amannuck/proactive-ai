# API Testing Guide

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure the database is initialized with data:
```bash
# From project root
sqlite3 forecasting.db < database/migration.sql
sqlite3 forecasting.db < database/seed_dimensions.sql
# (CSV data should already be loaded)
```

## Starting the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the PORT environment variable).

## Testing Methods

### 1. Quick Test Script

Run the automated test script:
```bash
chmod +x test-api.sh
./test-api.sh
```

Or manually:
```bash
bash test-api.sh
```

### 2. Manual Testing with curl

#### Health Check
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

#### UI Endpoints

**ED Hourly Data:**
```bash
# Get data for a date range (adjust dates based on your data)
curl "http://localhost:3000/api/ui/ed/hourly?from=2024-01-01&to=2024-01-31"
```

**Staff Schedule:**
```bash
# Get staff for a specific date (adjust date based on your data)
curl "http://localhost:3000/api/ui/staff/day?date=2024-01-15"
```

**Inventory Risk:**
```bash
# Default 7 days
curl "http://localhost:3000/api/ui/inventory/risk"

# Custom threshold
curl "http://localhost:3000/api/ui/inventory/risk?days=14"
```

#### Agent Endpoints

**Get Context:**
```bash
curl "http://localhost:3000/api/agent/context?from=2024-01-01&to=2024-01-31&date=2024-01-15"
```

**Save Agent Output:**
```bash
curl -X POST "http://localhost:3000/api/agent/outputs" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "test_agent",
    "output_type": "recommendation",
    "window_start": "2024-01-15",
    "window_end": "2024-01-22",
    "payload": {
      "recommendation": "Test recommendation",
      "confidence": 0.85
    }
  }'
```

### 3. Testing with Browser

Open these URLs in your browser:
- Health: http://localhost:3000/health
- ED Hourly: http://localhost:3000/api/ui/ed/hourly?from=2024-01-01&to=2024-01-31
- Staff: http://localhost:3000/api/ui/staff/day?date=2024-01-15
- Inventory: http://localhost:3000/api/ui/inventory/risk

### 4. Testing with Postman/Insomnia

Import the collection:
1. Create a new request for each endpoint
2. Use the URLs and methods from `API_EXAMPLES.md`
3. For POST requests, set Content-Type to `application/json`

### 5. Testing with Node.js Script

```bash
node test-api.js
```

## Finding Valid Test Data

To find valid dates in your database:

```bash
sqlite3 forecasting.db "SELECT DISTINCT date FROM fact_ed_hourly ORDER BY date LIMIT 5;"
sqlite3 forecasting.db "SELECT DISTINCT date FROM fact_staff_shift ORDER BY date LIMIT 5;"
```

Use these dates in your test requests.

## Expected Responses

### Success Responses
- Status: 200 (or 201 for POST)
- Content-Type: application/json
- Body: JSON array or object

### Error Responses
- Status: 400 (bad request) or 500 (server error)
- Body: `{"error": "...", "details": "..."}`

## Troubleshooting

**Server won't start:**
- Check if port 3000 is already in use
- Verify `forecasting.db` exists in project root
- Check Node.js version (should be 18+)

**Empty responses:**
- Verify data exists in the database
- Check date formats (YYYY-MM-DD)
- Ensure tables are populated

**Database errors:**
- Verify database file exists: `ls -la forecasting.db`
- Check database schema: `sqlite3 forecasting.db ".schema"`
- Verify foreign keys are enabled
