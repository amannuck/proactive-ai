# API Endpoint Examples

## UI Endpoints

### GET /api/ui/ed/hourly
Get ED hourly metrics for a date range.

```bash
# Example: Get data for January 2020 (adjust based on your data range: 2020-01-01 to 2025-12-31)
curl "http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31"
```

### GET /api/ui/staff/day
Get staff schedule for a specific date.

```bash
# Example: Get staff for a specific date (adjust based on your data)
curl "http://localhost:3000/api/ui/staff/day?date=2026-01-24"
```

### GET /api/ui/inventory/risk
Get inventory items at risk (default: 7 days).

```bash
# Default 7 days
curl "http://localhost:3000/api/ui/inventory/risk"

# Custom days threshold
curl "http://localhost:3000/api/ui/inventory/risk?days=14"
```

## Agent Endpoints

### GET /api/agent/context
Get comprehensive context for AI agents.

```bash
# Example: Get context for a date range (adjust based on your data)
curl "http://localhost:3000/api/agent/context?from=2020-01-01&to=2020-01-31&date=2026-01-24"
```

Response structure:
```json
{
  "ed_hourly": [...],
  "staff_day": [...],
  "inventory_risk_7d": [...],
  "events": [...]
}
```

### POST /api/agent/outputs
Save agent insights/recommendations.

```bash
curl -X POST "http://localhost:3000/api/agent/outputs" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "forecast_agent",
    "output_type": "recommendation",
    "window_start": "2020-01-15",
    "window_end": "2020-01-22",
    "payload": {
      "recommendation": "Increase staff for evening shifts",
      "confidence": 0.85,
      "reasoning": "Historical patterns show 20% spike in arrivals"
    }
  }'
```

## Health Check

### GET /health
Check server status.

```bash
curl "http://localhost:3000/health"
```
