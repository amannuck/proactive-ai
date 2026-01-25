# How Recommendations Are Stored

## Storage Flow

```
┌─────────────────┐
│  AI Agent       │
│  Generates      │
│  Recommendations│
└────────┬────────┘
         │
         │ POST /api/agent/outputs
         │ {
         │   agent_name: "inventory_agent",
         │   output_type: "purchase_recommendation",
         │   payload: { recommendations: [...] }
         │ }
         ▼
┌─────────────────┐
│  API Route      │
│  /api/agent/    │
│  outputs        │
└────────┬────────┘
         │
         │ Calls saveAgentOutput()
         ▼
┌─────────────────┐
│  Database       │
│  agent_outputs  │
│  Table          │
└─────────────────┘
```

## Database Table: `agent_outputs`

The recommendations are stored in the `agent_outputs` table with the following structure:

```sql
CREATE TABLE agent_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    agent_name TEXT NOT NULL,              -- 'inventory_agent'
    output_type TEXT NOT NULL,             -- 'purchase_recommendation'
    window_start TEXT,                     -- Date when analysis started
    window_end TEXT,                       -- Date when analysis ended (null)
    payload_json TEXT NOT NULL             -- JSON string with all recommendations
);
```

## What Gets Stored

The `payload_json` column contains a JSON object with:

```json
{
  "generated_at": "2026-01-25T12:30:00.000Z",
  "recommendations": [
    {
      "sku_id": "IV-LR-1000",
      "item_name": "IV Lactated Ringer's 1000ml",
      "current_stock": 15,
      "par_level": 50,
      "days_until_stockout": 2.5,
      "recommended_quantity": 200,
      "suppliers": [
        {
          "supplier_name": "Medical Supplies Co.",
          "price_per_unit": 12.50,
          "lead_time_hours": 72,
          "reliability_score": 0.95,
          "min_order_qty": 10,
          "total_cost": 2500.00,
          "recommended": true
        }
      ],
      "reasoning": "Critical item with only 2.5 days remaining...",
      "urgency": "critical"
    }
  ],
  "summary": {
    "total_items": 5,
    "critical_count": 2,
    "high_count": 2,
    "estimated_total_cost": 12500.00
  }
}
```

## Querying Stored Recommendations

### 1. View All Recommendations

```bash
sqlite3 forecasting.db "SELECT id, created_at, agent_name, output_type FROM agent_outputs ORDER BY created_at DESC;"
```

### 2. Get Latest Recommendation

```bash
sqlite3 forecasting.db "SELECT payload_json FROM agent_outputs WHERE agent_name = 'inventory_agent' ORDER BY created_at DESC LIMIT 1;"
```

### 3. View Recommendation Details (Pretty JSON)

```bash
sqlite3 forecasting.db "SELECT json_extract(payload_json, '$.summary') FROM agent_outputs WHERE agent_name = 'inventory_agent' ORDER BY created_at DESC LIMIT 1;" | jq
```

### 4. Count Recommendations by Type

```bash
sqlite3 forecasting.db "SELECT output_type, COUNT(*) as count FROM agent_outputs GROUP BY output_type;"
```

### 5. Get All Recommendations for a Specific Date

```bash
sqlite3 forecasting.db "SELECT * FROM agent_outputs WHERE window_start = '2026-01-25' ORDER BY created_at DESC;"
```

## Using the API to Retrieve Recommendations

### Get Recent Agent Outputs

The API has a query function `getRecentAgentOutputs()` but no endpoint yet. You can add one:

**Option 1: Query directly via SQL**

```bash
curl "http://localhost:3000/api/agent/outputs"  # Would need to be implemented
```

**Option 2: Query database directly**

```bash
sqlite3 forecasting.db <<EOF
.mode json
SELECT 
  id,
  created_at,
  agent_name,
  output_type,
  json_extract(payload_json, '$.summary') as summary
FROM agent_outputs
WHERE agent_name = 'inventory_agent'
ORDER BY created_at DESC
LIMIT 5;
EOF
```

## Example: Extracting Recommendations

### Get All Critical Items from Latest Recommendation

```sql
SELECT 
  json_extract(value, '$.sku_id') as sku_id,
  json_extract(value, '$.item_name') as item_name,
  json_extract(value, '$.urgency') as urgency,
  json_extract(value, '$.recommended_quantity') as recommended_quantity
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations'))
WHERE agent_name = 'inventory_agent'
  AND created_at = (SELECT MAX(created_at) FROM agent_outputs WHERE agent_name = 'inventory_agent')
  AND json_extract(value, '$.urgency') = 'critical';
```

### Get Total Estimated Cost from Latest Run

```sql
SELECT 
  json_extract(payload_json, '$.summary.estimated_total_cost') as total_cost,
  json_extract(payload_json, '$.summary.total_items') as total_items,
  created_at
FROM agent_outputs
WHERE agent_name = 'inventory_agent'
ORDER BY created_at DESC
LIMIT 1;
```

## Adding an API Endpoint to Retrieve Recommendations

If you want to add an endpoint to retrieve stored recommendations, you could add this to `src/routes/agent.ts`:

```typescript
import { getRecentAgentOutputs } from '../db/queries/agent';

router.get('/outputs', (req, res) => {
  const limitParam = req.query.limit as string;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const agentName = req.query.agent_name as string;

  try {
    let outputs = getRecentAgentOutputs(limit);
    
    // Filter by agent_name if provided
    if (agentName) {
      outputs = outputs.filter(o => o.agent_name === agentName);
    }
    
    // Parse JSON payloads
    const parsed = outputs.map(o => ({
      ...o,
      payload: JSON.parse(o.payload_json)
    }));
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent outputs', details: String(error) });
  }
});
```

Then you could query:
```bash
curl "http://localhost:3000/api/agent/outputs?limit=5&agent_name=inventory_agent"
```

## Summary

✅ **Recommendations ARE stored in the database**
- Table: `agent_outputs`
- Column: `payload_json` (contains full JSON with all recommendations)
- Automatically created when the agent runs
- Each run creates a new row with a unique `id`
- Includes timestamp, agent name, and full recommendation data

The recommendations persist in the database and can be queried, analyzed, and retrieved at any time!
