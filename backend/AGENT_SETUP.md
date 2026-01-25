# AI Agent Setup Guide

## Overview

An AI agent has been created to analyze critical inventory items and generate purchase recommendations with cost estimates.

## What Was Created

### 1. Supplier API Endpoints

**New Database Query Module**: `src/db/queries/supplier.ts`
- `getSuppliersBySkuId(skuId)` - Get suppliers for a single SKU
- `getSuppliersBySkuIds(skuIds[])` - Get suppliers for multiple SKUs
- `getAllSupplierContracts()` - Get all supplier contracts

**New API Endpoints**: Added to `src/routes/ui.ts`
- `GET /api/ui/suppliers/by-sku/:skuId` - Get suppliers for a specific item
- `POST /api/ui/suppliers/by-skus` - Get suppliers for multiple items (body: `{ "sku_ids": ["SKU1", "SKU2"] }`)

### 2. Inventory Management AI Agent

**Agent Script**: `src/agents/inventory-agent.ts`

The agent:
1. Fetches critical inventory items from `/api/ui/inventory/risk`
2. Retrieves supplier information for each critical item
3. Uses DeepSeek AI to generate intelligent purchase recommendations
4. Calculates cost estimates based on supplier pricing
5. Saves recommendations back to the API

## Setup Instructions

### 1. Ensure Database Has Supplier Data

The agent requires supplier contract data. Verify it exists:

```bash
sqlite3 forecasting.db "SELECT COUNT(*) FROM fact_supplier_contract;"
```

If the count is 0, ensure the ETL has been run:

```bash
sqlite3 forecasting.db < database/etl_facts.sql
```

### 2. Start the API Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

### 3. Test the New Supplier API

```bash
# Get suppliers for a specific SKU
curl "http://localhost:3000/api/ui/suppliers/by-sku/SKU-001"

# Get suppliers for multiple SKUs
curl -X POST "http://localhost:3000/api/ui/suppliers/by-skus" \
  -H "Content-Type: application/json" \
  -d '{"sku_ids": ["SKU-001", "SKU-002"]}'
```

### 4. Run the AI Agent

```bash
# With default 7-day risk threshold
npm run agent:inventory

# With custom threshold (e.g., 14 days)
npm run agent:inventory 14
```

## Configuration

### DeepSeek API Settings

The agent is configured with:
- **Endpoint**: `https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions`
- **Authorization**: `a12a7d3705b12aeb46eb4cc8d77f5446`
- **Model**: `deepseek-ai/DeepSeek-V3.2-Exp`

These are hardcoded in `src/agents/inventory-agent.ts`. To change them, edit the constants at the top of the file.

### API Base URL

By default, the agent connects to `http://localhost:3000`. To change this:

```bash
API_BASE_URL=http://your-api-url:3000 npm run agent:inventory
```

## How It Works

### Flow Diagram

```
┌─────────────────┐
│  AI Agent       │
│  (inventory-    │
│   agent.ts)     │
└────────┬────────┘
         │
         │ 1. GET /api/ui/inventory/risk?days=7
         ▼
┌─────────────────┐
│  Forecasting    │
│  API            │
└────────┬────────┘
         │
         │ 2. Query fact_inventory_snapshot
         ▼
┌─────────────────┐
│  SQLite DB      │
│  Returns critical│
│  items          │
└─────────────────┘
         │
         │ 3. POST /api/ui/suppliers/by-skus
         ▼
┌─────────────────┐
│  API queries    │
│  fact_supplier_ │
│  contract       │
└────────┬────────┘
         │
         │ 4. Returns supplier data
         ▼
┌─────────────────┐
│  AI Agent       │
│  Prepares       │
│  context for AI │
└────────┬────────┘
         │
         │ 5. Calls DeepSeek API
         ▼
┌─────────────────┐
│  DeepSeek AI    │
│  Generates      │
│  recommendations│
└────────┬────────┘
         │
         │ 6. Returns recommendations
         ▼
┌─────────────────┐
│  AI Agent       │
│  Saves to API   │
│  via POST       │
│  /api/agent/    │
│  outputs        │
└─────────────────┘
```

## Example Agent Output

```
=========================================
Inventory Management AI Agent
=========================================

📦 Fetching critical inventory items (risk threshold: 7 days)...
   Found 3 critical items

🔍 Fetching supplier information...
   Found suppliers for 3 items

🤖 Generating AI recommendations...
   Generated 3 recommendations

📋 Purchase Recommendations:
=========================================

Gauze Pads (SKU-001)
  Urgency: CRITICAL
  Current Stock: 15
  Days Until Stockout: 2.5
  Recommended Quantity: 200
  Recommended Supplier: Medical Supplies Co.
  Unit Price: $2.50
  Total Cost: $500.00
  Lead Time: 3.0 days
  Reasoning: Critical item with only 2.5 days remaining...

💾 Saving recommendations to API...
   Saved with ID: 42

=========================================
✅ Agent completed successfully!
   Recommendations saved with ID: 42
=========================================
```

## Troubleshooting

### Agent can't connect to API

**Error**: `ECONNREFUSED` or `Server not running`

**Solution**: Ensure the API server is running:
```bash
npm run dev
```

### No suppliers found for items

**Error**: Empty supplier arrays in recommendations

**Solution**: Verify supplier data exists:
```bash
sqlite3 forecasting.db "SELECT COUNT(*) FROM fact_supplier_contract;"
```

If 0, run ETL:
```bash
sqlite3 forecasting.db < database/etl_facts.sql
```

### DeepSeek API errors

**Error**: `DeepSeek API error 401` or `403`

**Solution**: Verify the authorization token is correct in `src/agents/inventory-agent.ts`

### No critical items found

**Message**: `No critical inventory items found`

This is normal if all items are well-stocked. Try:
- Lowering the risk threshold: `npm run agent:inventory 3`
- Checking inventory data exists: `sqlite3 forecasting.db "SELECT COUNT(*) FROM fact_inventory_snapshot;"`

## Next Steps

1. **Test the supplier API endpoints** to ensure they work
2. **Run the agent** with your data
3. **Review recommendations** saved in the database:
   ```bash
   sqlite3 forecasting.db "SELECT * FROM agent_outputs ORDER BY created_at DESC LIMIT 1;"
   ```
4. **Customize the agent** as needed (prompts, thresholds, etc.)
