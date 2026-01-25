# AI Agents

This directory contains AI agents that consume the forecasting API and use external AI services to generate insights and recommendations.

## Inventory Management Agent

The inventory agent analyzes critical inventory items and generates purchase recommendations with cost estimates.

### Features

- Fetches critical inventory items (items at risk of stockout)
- Retrieves supplier information for each item
- Uses DeepSeek AI to generate intelligent purchase recommendations
- Calculates cost estimates based on supplier pricing
- Saves recommendations back to the API

### Usage

```bash
# Run with default 7-day risk threshold
npm run agent:inventory

# Run with custom risk threshold (e.g., 14 days)
npm run agent:inventory 14
```

### Prerequisites

1. **API Server Running**: The forecasting API must be running on `http://localhost:3000` (or set `API_BASE_URL` env var)

2. **Database Populated**: Ensure the database has:
   - Inventory data in `fact_inventory_snapshot`
   - Supplier contract data in `fact_supplier_contract`

3. **DeepSeek API Access**: The agent uses the DeepSeek API endpoint configured in the script

### Configuration

The agent uses the following environment variables (optional):

- `API_BASE_URL`: Base URL for the forecasting API (default: `http://localhost:3000`)

DeepSeek API configuration is hardcoded in the script:
- Endpoint: `https://deepseekv32-3ca9s.paas.ai.telus.com/v1/chat/completions`
- Authorization: `a12a7d3705b12aeb46eb4cc8d77f5446`
- Model: `deepseek-ai/DeepSeek-V3.2-Exp`

### Output

The agent:
1. Displays critical inventory items found
2. Shows supplier information retrieved
3. Generates AI-powered purchase recommendations
4. Displays recommendations with:
   - Recommended purchase quantity
   - Best supplier selection
   - Cost estimates
   - Urgency levels
   - Reasoning
5. Saves recommendations to the API (accessible via `/api/agent/outputs`)

### Example Output

```
=========================================
Inventory Management AI Agent
=========================================

📦 Fetching critical inventory items (risk threshold: 7 days)...
   Found 5 critical items

🔍 Fetching supplier information...
   Found suppliers for 5 items

🤖 Generating AI recommendations...
   Generated 5 recommendations

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
  Reasoning: Critical item with only 2.5 days remaining. Need immediate restock...

💾 Saving recommendations to API...
   Saved with ID: 123

=========================================
✅ Agent completed successfully!
   Recommendations saved with ID: 123
=========================================
```

### API Endpoints Used

- `GET /api/ui/inventory/risk?days={threshold}` - Get critical inventory items
- `GET /api/ui/suppliers/by-sku/{skuId}` - Get suppliers for a single SKU
- `POST /api/ui/suppliers/by-skus` - Get suppliers for multiple SKUs
- `POST /api/agent/outputs` - Save agent recommendations
