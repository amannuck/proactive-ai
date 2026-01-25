# Frontend Integration Guide

## How the Frontend Consumes the API

### Current Problem
The API returns **raw time-series data** (e.g., 744 rows for one month). This is inefficient for:
- Charts (need aggregated data)
- Initial page loads (too much data)
- Mobile devices (bandwidth concerns)

### Solution: Add Chart-Optimized Endpoints

We need **two types of endpoints**:

1. **Aggregated/Summary endpoints** - For charts (small, fast)
2. **Detailed endpoints** - For drill-downs (with pagination)

---

## Frontend Consumption Patterns

### Pattern 1: Chart Data (Aggregated)

**What frontend needs:**
- Daily/hourly summaries, not every single row
- Small payloads (< 100KB)
- Fast response times

**Example React Component:**

```typescript
// components/EDChart.tsx
import { useEffect, useState } from 'react';

interface EDChartData {
  date: string;
  total_arrivals: number;
  avg_wait_time: number;
  peak_occupancy: number;
}

export function EDChart() {
  const [data, setData] = useState<EDChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch aggregated daily data (not hourly!)
    fetch('/api/ui/ed/daily?from=2020-01-01&to=2020-01-31')
      .then(res => res.json())
      .then(data => {
        setData(data); // ~31 rows instead of 744
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <LineChart data={data}>
      <Line dataKey="total_arrivals" />
      <Line dataKey="avg_wait_time" />
    </LineChart>
  );
}
```

### Pattern 2: Detailed Data (Paginated)

**What frontend needs:**
- Pagination (limit/offset)
- Lazy loading
- Virtual scrolling for tables

**Example React Component:**

```typescript
// components/EDTable.tsx
import { useState, useEffect } from 'react';

export function EDTable() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    fetch(`/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31&page=${page}&limit=${pageSize}`)
      .then(res => res.json())
      .then(result => {
        setData(result.data); // Only 50 rows
        setLoading(false);
      });
  }, [page]);

  return (
    <Table data={data} />
    <Pagination page={page} onChange={setPage} />
  );
}
```

### Pattern 3: Real-time Updates

**What frontend needs:**
- WebSocket or polling for latest data
- Incremental updates

```typescript
// components/LiveDashboard.tsx
useEffect(() => {
  // Poll every 5 minutes for latest hour
  const interval = setInterval(() => {
    fetch('/api/ui/ed/latest')
      .then(res => res.json())
      .then(latest => {
        // Update only the latest data point
        setLatestHour(latest);
      });
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

---

## Recommended API Improvements

### 1. Add Aggregated Endpoints

```typescript
// NEW: Daily aggregated (for charts)
GET /api/ui/ed/daily?from=2020-01-01&to=2020-01-31
// Returns: ~31 rows (one per day) instead of 744

// NEW: Hourly summary (for hourly charts)
GET /api/ui/ed/hourly-summary?date=2020-01-15
// Returns: 24 rows (one per hour) for a single day

// EXISTING: Full hourly (for drill-downs, with pagination)
GET /api/ui/ed/hourly?from=2020-01-01&to=2020-01-31&page=1&limit=100
```

### 2. Add Pagination to Existing Endpoints

```typescript
// Current response (all 744 rows):
[{ ts: "...", date: "...", ... }, ...]

// Improved response (paginated):
{
  data: [{ ts: "...", ... }], // 50-100 rows
  pagination: {
    page: 1,
    limit: 100,
    total: 744,
    totalPages: 8
  }
}
```

### 3. Add Field Selection

```typescript
// Only fetch what you need
GET /api/ui/ed/hourly?from=...&to=...&fields=date,hour,arrivals_last_hour
// Returns only selected fields (smaller payload)
```

---

## Complete Frontend Example

### Dashboard Component

```typescript
// Dashboard.tsx
import { EDChart } from './components/EDChart';
import { StaffChart } from './components/StaffChart';
import { InventoryAlerts } from './components/InventoryAlerts';

export function Dashboard() {
  return (
    <div>
      {/* Chart: Aggregated daily data (small payload) */}
      <EDChart dateRange={{ from: '2020-01-01', to: '2020-01-31' }} />
      
      {/* Chart: Staff summary (small payload) */}
      <StaffChart date="2026-01-24" />
      
      {/* Alerts: Only at-risk items (small payload) */}
      <InventoryAlerts days={7} />
    </div>
  );
}
```

### Data Fetching Hook

```typescript
// hooks/useEDData.ts
import { useState, useEffect } from 'react';

export function useEDData(from: string, to: string, aggregation: 'hourly' | 'daily' = 'daily') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint = aggregation === 'daily' 
      ? `/api/ui/ed/daily?from=${from}&to=${to}`
      : `/api/ui/ed/hourly?from=${from}&to=${to}&limit=100`;

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [from, to, aggregation]);

  return { data, loading, error };
}
```

---

## Performance Considerations

### Current Issues:
1. **744 rows** for one month = ~500KB JSON
2. **52,608 rows** for full dataset = ~35MB JSON (too large!)
3. Frontend must parse and process all data

### Solutions:

#### 1. **Aggregation at API Level**
```sql
-- Instead of returning 744 rows:
SELECT * FROM fact_ed_hourly WHERE date >= '2020-01-01' AND date <= '2020-01-31';

-- Return 31 aggregated rows:
SELECT 
  date,
  SUM(arrivals_last_hour) as total_arrivals,
  AVG(longest_wait_time_min) as avg_wait_time,
  MAX(bed_occupancy_pct) as peak_occupancy
FROM fact_ed_hourly
WHERE date >= '2020-01-01' AND date <= '2020-01-31'
GROUP BY date;
```

#### 2. **Pagination**
```typescript
// Limit to 100 rows per request
GET /api/ui/ed/hourly?from=...&to=...&limit=100&offset=0
```

#### 3. **Date Range Limits**
```typescript
// Enforce max range (e.g., 30 days)
if (daysBetween(from, to) > 30) {
  return error("Date range too large. Max 30 days.");
}
```

#### 4. **Compression**
```typescript
// Enable gzip compression in Express
app.use(compression());
```

---

## Recommended Next Steps

1. **Add aggregated endpoints** for charts (daily/hourly summaries)
2. **Add pagination** to detailed endpoints
3. **Add date range limits** (max 30-90 days)
4. **Add field selection** (only return needed columns)
5. **Enable compression** (gzip responses)

This will reduce payload sizes from **500KB+ to <50KB** for typical chart use cases.
