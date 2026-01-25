# Frontend API Consumption Examples

## How It Works: Visual Flow

```
┌─────────────┐         HTTP Request          ┌──────────────┐
│   React     │  ──────────────────────────>  │   Express    │
│  Frontend   │                                │     API      │
│             │  <──────────────────────────  │              │
└─────────────┘      JSON Response            └──────────────┘
                                                       │
                                                       │ SQL Query
                                                       ▼
                                              ┌──────────────┐
                                              │  SQLite DB   │
                                              │  (fact_*)    │
                                              └──────────────┘
```

## Example 1: Simple Chart Component

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';

interface EDData {
  date: string;
  hour: number;
  arrivals_last_hour: number;
  waiting_patients: number;
}

function App() {
  const [data, setData] = useState<EDData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from your API
    fetch('http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-05')
      .then(response => response.json())  // Parse JSON
      .then(json => {
        setData(json);  // Store in state
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading chart data...</div>;

  return (
    <div>
      <h1>ED Hourly Data</h1>
      <Chart data={data} />
      <p>Loaded {data.length} data points</p>
    </div>
  );
}
```

## Example 2: Using Fetch with Error Handling

```typescript
async function fetchEDData(from: string, to: string) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/ui/ed/hourly?from=${from}&to=${to}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch ED data:', error);
    return [];
  }
}
```

## Example 3: Using Axios (Alternative)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/ui',
});

// In your component
const [edData, setEdData] = useState([]);

useEffect(() => {
  api.get('/ed/hourly', {
    params: {
      from: '2020-01-01',
      to: '2020-01-31'
    }
  })
  .then(response => setEdData(response.data))
  .catch(error => console.error(error));
}, []);
```

## Example 4: Multiple API Calls (Dashboard)

```typescript
function Dashboard() {
  const [edData, setEdData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data in parallel
    Promise.all([
      fetch('http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-05')
        .then(r => r.json()),
      fetch('http://localhost:3000/api/ui/staff/day?date=2026-01-24')
        .then(r => r.json()),
      fetch('http://localhost:3000/api/ui/inventory/risk?days=7')
        .then(r => r.json())
    ])
    .then(([ed, staff, inventory]) => {
      setEdData(ed);
      setStaffData(staff);
      setInventoryData(inventory);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <EDChart data={edData} />
      <StaffTable data={staffData} />
      <InventoryAlerts data={inventoryData} />
    </div>
  );
}
```

## Example 5: Custom React Hook

```typescript
// hooks/useAPI.ts
import { useState, useEffect } from 'react';

export function useEDHourly(from: string, to: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/ui/ed/hourly?from=${from}&to=${to}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [from, to]);

  return { data, loading, error };
}

// Usage in component
function MyComponent() {
  const { data, loading, error } = useEDHourly('2020-01-01', '2020-01-31');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <Chart data={data} />;
}
```

## Example 6: Handling Large Responses

**Problem:** 744 rows = large JSON payload

**Solution A: Request smaller date ranges**
```typescript
// Instead of one month, fetch one week at a time
fetch('/api/ui/ed/hourly?from=2020-01-01&to=2020-01-07')  // ~168 rows
```

**Solution B: Use aggregated endpoint (when available)**
```typescript
// Fetch daily summary instead of hourly
fetch('/api/ui/ed/daily?from=2020-01-01&to=2020-01-31')  // ~31 rows
```

**Solution C: Pagination (when available)**
```typescript
// Fetch first page only
fetch('/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31&page=1&limit=100')
```

## Example 7: Real-World Chart Library Integration

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

function EDArrivalsChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-05')
      .then(r => r.json())
      .then(data => {
        // Transform API data for chart library
        const transformed = data.map(row => ({
          time: `${row.date} ${row.hour}:00`,
          arrivals: row.arrivals_last_hour || 0,
          waiting: row.waiting_patients || 0
        }));
        setChartData(transformed);
      });
  }, []);

  return (
    <LineChart width={800} height={400} data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="time" />
      <YAxis />
      <Line type="monotone" dataKey="arrivals" stroke="#8884d8" />
      <Line type="monotone" dataKey="waiting" stroke="#82ca9d" />
    </LineChart>
  );
}
```

## CORS Configuration

If your frontend runs on a different port (e.g., `localhost:3001`), ensure CORS is enabled:

```typescript
// Already configured in server.ts
app.use(cors());  // Allows all origins
```

For production, restrict to your domain:
```typescript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

## Response Format

**Current API Response:**
```json
[
  {
    "ts": "2020-01-01T00:00:00Z",
    "date": "2020-01-01",
    "hour": 0,
    "arrivals_last_hour": 5,
    "departures_last_hour": 3,
    "waiting_patients": 12,
    ...
  },
  ...
]
```

**Frontend receives:** Array of objects, ready to use in charts/tables.
