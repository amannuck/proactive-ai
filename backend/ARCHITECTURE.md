# Architecture: Raw vs Fact Tables

## Current Design: Raw → Fact (ETL Pattern)

```
CSV Files → raw_* tables (TEXT) → ETL Script → fact_* tables (Typed) → API Queries
```

### Why This Design?

#### 1. **Data Types Matter**
- **Raw tables**: Everything is TEXT
  ```sql
  SELECT arrivals_last_hour FROM raw_ed_hourly_snapshot;
  -- Returns: "42" (string)
  ```
- **Fact tables**: Proper types
  ```sql
  SELECT arrivals_last_hour FROM fact_ed_hourly;
  -- Returns: 42 (integer)
  ```

**Impact on queries:**
```sql
-- Raw table (requires casting, slower)
SELECT SUM(CAST(arrivals_last_hour AS INTEGER)) FROM raw_ed_hourly_snapshot;

-- Fact table (native types, faster)
SELECT SUM(arrivals_last_hour) FROM fact_ed_hourly;
```

#### 2. **Performance**
- Fact tables have **indexes** on common query patterns:
  - `idx_fact_ed_hourly_date_hour` for time-series queries
  - `idx_fact_staff_shift_date_role` for staffing queries
- Raw tables have **no indexes** → full table scans

#### 3. **Data Quality**
- Fact tables enforce constraints:
  - `hour >= 0 AND hour <= 23`
  - `needs_on_call_activation IN (0, 1)`
- Fact tables normalize data:
  - Convert "true"/"false" strings → 1/0 integers
  - Standardize timestamps to ISO8601
  - Map location names → location_id (foreign keys)

#### 4. **Schema Stability**
- Raw tables: Schema changes with CSV format
- Fact tables: Stable API contract for frontend/agents

## Alternative: Query Raw Tables Directly

If you want to skip ETL and query raw tables:

### Pros:
- ✅ Always current (no ETL lag)
- ✅ Simpler pipeline (one less step)
- ✅ Less storage (no duplicate data)

### Cons:
- ❌ Slower queries (no indexes, type casting)
- ❌ More complex queries (CAST everywhere)
- ❌ Data quality issues (invalid values pass through)
- ❌ No referential integrity (no foreign keys)

### Example: Querying Raw Tables

```typescript
// Would need to do this:
const getEDHourlyRaw = db.prepare(`
  SELECT 
    date_str as date,
    CAST(hour_of_day AS INTEGER) as hour,
    CAST(arrivals_last_hour AS INTEGER) as arrivals_last_hour,
    -- ... many more CASTs
  FROM raw_ed_hourly_snapshot
  WHERE date_str >= ? AND date_str <= ?
  ORDER BY CAST(date_str AS DATE) ASC, CAST(hour_of_day AS INTEGER) ASC
`);
```

vs. current fact table query:
```typescript
const getHourlyByDateRange = db.prepare(`
  SELECT * FROM fact_ed_hourly
  WHERE date >= ? AND date <= ?
  ORDER BY date ASC, hour ASC
`);
```

## When to Use Each Approach

### Use Fact Tables (Current Design) When:
- ✅ Performance matters (dashboards, real-time queries)
- ✅ Data quality is critical
- ✅ You need aggregations/calculations
- ✅ Schema is stable
- ✅ You can tolerate ETL lag (seconds/minutes)

### Use Raw Tables When:
- ✅ You need real-time data (no ETL delay)
- ✅ Data changes frequently
- ✅ Simple queries only
- ✅ Storage is a concern
- ✅ You're okay with slower queries

## Hybrid Approach

You could query **both**:
- Raw tables for latest data (real-time)
- Fact tables for historical analytics (fast)

```typescript
// Latest hour from raw (real-time)
const latest = getLatestFromRaw();

// Historical from fact (fast)
const historical = getEDHourly(from, to);
```

## Recommendation

**Keep the current ETL pattern** because:
1. Your use case (forecasting/analytics) benefits from fast queries
2. Data quality matters for medical/healthcare data
3. The ETL step is fast (seconds) and can be automated
4. You get better performance for dashboard queries

If you need real-time data, add a hybrid approach that queries raw for the latest hour and fact for historical.
