# SQLite Queries for Purchase Recommendations

## Quick Queries

### 1. View All Purchase Recommendation Runs

```sql
SELECT 
  id,
  created_at,
  agent_name,
  output_type,
  window_start,
  json_extract(payload_json, '$.summary.total_items') as total_items,
  json_extract(payload_json, '$.summary.critical_count') as critical_count,
  json_extract(payload_json, '$.summary.estimated_total_cost') as total_cost
FROM agent_outputs
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
ORDER BY created_at DESC;
```

### 2. View Latest Recommendation Summary

```sql
SELECT 
  id,
  created_at,
  json_extract(payload_json, '$.summary') as summary
FROM agent_outputs
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
ORDER BY created_at DESC
LIMIT 1;
```

### 3. View All Recommendations from Latest Run

```sql
SELECT 
  json_extract(value, '$.sku_id') as sku_id,
  json_extract(value, '$.item_name') as item_name,
  json_extract(value, '$.urgency') as urgency,
  json_extract(value, '$.current_stock') as current_stock,
  json_extract(value, '$.days_until_stockout') as days_until_stockout,
  json_extract(value, '$.recommended_quantity') as recommended_quantity,
  json_extract(value, '$.reasoning') as reasoning
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations'))
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
  AND created_at = (
    SELECT MAX(created_at) 
    FROM agent_outputs 
    WHERE agent_name = 'inventory_agent' 
      AND output_type = 'purchase_recommendation'
  )
ORDER BY 
  CASE json_extract(value, '$.urgency')
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  json_extract(value, '$.days_until_stockout');
```

### 4. View Recommended Suppliers with Costs

```sql
SELECT 
  rec.value ->> '$.sku_id' as sku_id,
  rec.value ->> '$.item_name' as item_name,
  rec.value ->> '$.urgency' as urgency,
  supplier.value ->> '$.supplier_name' as supplier_name,
  supplier.value ->> '$.price_per_unit' as price_per_unit,
  supplier.value ->> '$.total_cost' as total_cost,
  supplier.value ->> '$.lead_time_hours' as lead_time_hours,
  supplier.value ->> '$.recommended' as is_recommended
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations')) as rec,
json_each(rec.value, '$.suppliers') as supplier
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
  AND created_at = (
    SELECT MAX(created_at) 
    FROM agent_outputs 
    WHERE agent_name = 'inventory_agent' 
      AND output_type = 'purchase_recommendation'
  )
  AND supplier.value ->> '$.recommended' = 1
ORDER BY supplier.value ->> '$.total_cost' DESC;
```

### 5. View Full JSON Payload (Pretty)

```sql
SELECT payload_json
FROM agent_outputs
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
ORDER BY created_at DESC
LIMIT 1;
```

### 6. Count Total Recommendations by Urgency

```sql
SELECT 
  json_extract(value, '$.urgency') as urgency,
  COUNT(*) as count,
  SUM(json_extract(value, '$.recommended_quantity')) as total_quantity
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations'))
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
  AND created_at = (
    SELECT MAX(created_at) 
    FROM agent_outputs 
    WHERE agent_name = 'inventory_agent' 
      AND output_type = 'purchase_recommendation'
  )
GROUP BY json_extract(value, '$.urgency')
ORDER BY 
  CASE json_extract(value, '$.urgency')
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;
```

### 7. Total Estimated Cost by Supplier

```sql
SELECT 
  supplier.value ->> '$.supplier_name' as supplier_name,
  COUNT(DISTINCT rec.value ->> '$.sku_id') as items_count,
  SUM(CAST(supplier.value ->> '$.total_cost' AS REAL)) as total_cost
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations')) as rec,
json_each(rec.value, '$.suppliers') as supplier
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
  AND created_at = (
    SELECT MAX(created_at) 
    FROM agent_outputs 
    WHERE agent_name = 'inventory_agent' 
      AND output_type = 'purchase_recommendation'
  )
  AND supplier.value ->> '$.recommended' = 1
GROUP BY supplier.value ->> '$.supplier_name'
ORDER BY total_cost DESC;
```

## Command Line Examples

### View Latest Summary

```bash
sqlite3 forecasting.db "SELECT json_extract(payload_json, '$.summary') FROM agent_outputs WHERE agent_name = 'inventory_agent' AND output_type = 'purchase_recommendation' ORDER BY created_at DESC LIMIT 1;" | jq
```

### View All Recommendations (Table Format)

```bash
sqlite3 forecasting.db -header -column "
SELECT 
  json_extract(value, '$.sku_id') as SKU,
  json_extract(value, '$.item_name') as Item,
  json_extract(value, '$.urgency') as Urgency,
  json_extract(value, '$.current_stock') as Stock,
  json_extract(value, '$.days_until_stockout') as Days_Left,
  json_extract(value, '$.recommended_quantity') as Qty
FROM agent_outputs,
json_each(json_extract(payload_json, '$.recommendations'))
WHERE agent_name = 'inventory_agent' 
  AND output_type = 'purchase_recommendation'
  AND created_at = (SELECT MAX(created_at) FROM agent_outputs WHERE agent_name = 'inventory_agent' AND output_type = 'purchase_recommendation')
ORDER BY json_extract(value, '$.days_until_stockout');
"
```

### View Full JSON (Pretty with jq)

```bash
sqlite3 forecasting.db "SELECT payload_json FROM agent_outputs WHERE agent_name = 'inventory_agent' AND output_type = 'purchase_recommendation' ORDER BY created_at DESC LIMIT 1;" | jq
```

### Count Total Runs

```bash
sqlite3 forecasting.db "SELECT COUNT(*) as total_runs FROM agent_outputs WHERE agent_name = 'inventory_agent' AND output_type = 'purchase_recommendation';"
```

## Quick Reference

**Table**: `agent_outputs`
**Filter**: `agent_name = 'inventory_agent' AND output_type = 'purchase_recommendation'`
**JSON Path**: `payload_json -> $.recommendations` (array)
**JSON Path**: `payload_json -> $.summary` (object)
