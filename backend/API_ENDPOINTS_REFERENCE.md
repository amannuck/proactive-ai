# API Endpoints Reference

This document lists all available API endpoints and their exact URLs.

## Base URL

- **Development**: `http://localhost:3000`
- **Configurable**: Set via `API_BASE_URL` environment variable

## API Endpoints

### UI Endpoints (`/api/ui/*`)

#### 1. Get ED Hourly Data
- **Method**: `GET`
- **URL**: `/api/ui/ed/hourly`
- **Query Parameters**:
  - `from` (required): Start date (YYYY-MM-DD)
  - `to` (required): End date (YYYY-MM-DD)
- **Example**:
  ```bash
  curl "http://localhost:3000/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31"
  ```
- **Route File**: `src/routes/ui.ts` (line 9-22)
- **Query Function**: `src/db/queries/ed.ts` → `getEDHourly()`

#### 2. Get Staff Schedule for a Day
- **Method**: `GET`
- **URL**: `/api/ui/staff/day`
- **Query Parameters**:
  - `date` (required): Date (YYYY-MM-DD)
- **Example**:
  ```bash
  curl "http://localhost:3000/api/ui/staff/day?date=2026-01-24"
  ```
- **Route File**: `src/routes/ui.ts` (line 25-37)
- **Query Function**: `src/db/queries/staff.ts` → `getStaffDay()`

#### 3. Get Inventory Risk Items
- **Method**: `GET`
- **URL**: `/api/ui/inventory/risk`
- **Query Parameters**:
  - `days` (optional): Risk threshold in days (default: 7)
- **Example**:
  ```bash
  curl "http://localhost:3000/api/ui/inventory/risk?days=7"
  ```
- **Route File**: `src/routes/ui.ts` (line 40-54)
- **Query Function**: `src/db/queries/inventory.ts` → `getInventoryRiskByDays()`

#### 4. Get Suppliers for a Single SKU
- **Method**: `GET`
- **URL**: `/api/ui/suppliers/by-sku/:skuId`
- **Path Parameters**:
  - `skuId` (required): SKU identifier
- **Example**:
  ```bash
  curl "http://localhost:3000/api/ui/suppliers/by-sku/IV-LR-1000"
  ```
- **Route File**: `src/routes/ui.ts` (line 56-69)
- **Query Function**: `src/db/queries/supplier.ts` → `getSuppliersBySkuId()`

#### 5. Get Suppliers for Multiple SKUs
- **Method**: `POST`
- **URL**: `/api/ui/suppliers/by-skus`
- **Request Body**:
  ```json
  {
    "sku_ids": ["IV-LR-1000", "OR-SLING", "RX-EPI-PEN"]
  }
  ```
- **Example**:
  ```bash
  curl -X POST "http://localhost:3000/api/ui/suppliers/by-skus" \
    -H "Content-Type: application/json" \
    -d '{"sku_ids": ["IV-LR-1000", "OR-SLING"]}'
  ```
- **Route File**: `src/routes/ui.ts` (line 71-84)
- **Query Function**: `src/db/queries/supplier.ts` → `getSuppliersBySkuIds()`

### Agent Endpoints (`/api/agent/*`)

#### 6. Get Agent Context
- **Method**: `GET`
- **URL**: `/api/agent/context`
- **Query Parameters**:
  - `from` (required): Start date (YYYY-MM-DD)
  - `to` (required): End date (YYYY-MM-DD)
  - `date` (required): Reference date (YYYY-MM-DD)
- **Example**:
  ```bash
  curl "http://localhost:3000/api/agent/context?from=2020-01-01&to=2020-01-31&date=2026-01-24"
  ```
- **Route File**: `src/routes/agent.ts` (line 10-34)
- **Returns**: Combined data from ED, staff, inventory, and events

#### 7. Save Agent Output
- **Method**: `POST`
- **URL**: `/api/agent/outputs`
- **Request Body**:
  ```json
  {
    "agent_name": "inventory_agent",
    "output_type": "purchase_recommendation",
    "window_start": "2026-01-25",
    "window_end": null,
    "payload": {
      "generated_at": "2026-01-25T12:30:00.000Z",
      "recommendations": [...],
      "summary": {...}
    }
  }
  ```
- **Example**:
  ```bash
  curl -X POST "http://localhost:3000/api/agent/outputs" \
    -H "Content-Type: application/json" \
    -d '{
      "agent_name": "inventory_agent",
      "output_type": "purchase_recommendation",
      "payload": {"test": "data"}
    }'
  ```
- **Route File**: `src/routes/agent.ts` (line 36-61)
- **Query Function**: `src/db/queries/agent.ts` → `saveAgentOutput()`

### Health Check

#### 8. Health Check
- **Method**: `GET`
- **URL**: `/health`
- **Example**:
  ```bash
  curl "http://localhost:3000/health"
  ```
- **Route File**: `src/server.ts` (line 16-18)

## Complete URL List

Here are all the complete URLs (assuming `http://localhost:3000`):

1. `GET http://localhost:3000/health`
2. `GET http://localhost:3000/api/ui/ed/hourly?from={date}&to={date}`
3. `GET http://localhost:3000/api/ui/staff/day?date={date}`
4. `GET http://localhost:3000/api/ui/inventory/risk?days={number}`
5. `GET http://localhost:3000/api/ui/suppliers/by-sku/{skuId}`
6. `POST http://localhost:3000/api/ui/suppliers/by-skus`
7. `GET http://localhost:3000/api/agent/context?from={date}&to={date}&date={date}`
8. `POST http://localhost:3000/api/agent/outputs`

## Inventory Agent API Calls

If you're looking at the inventory agent, it would call these endpoints in this order:

1. **Get Critical Inventory**:
   ```
   GET /api/ui/inventory/risk?days=7
   ```

2. **Get Suppliers for Items**:
   ```
   POST /api/ui/suppliers/by-skus
   Body: { "sku_ids": ["SKU1", "SKU2", ...] }
   ```

3. **Save Recommendations**:
   ```
   POST /api/agent/outputs
   Body: {
     "agent_name": "inventory_agent",
     "output_type": "purchase_recommendation",
     "payload": { ... }
   }
   ```

## Route Registration

Routes are registered in `src/server.ts`:

```typescript
app.use('/api/ui', uiRoutes);      // Lines 13
app.use('/api/agent', agentRoutes); // Line 14
app.get('/health', ...);            // Line 16
```

## Database Queries

Each endpoint calls a query function from `src/db/queries/`:

- `ed.ts` → `getEDHourly()`
- `staff.ts` → `getStaffDay()`
- `inventory.ts` → `getInventoryRiskByDays()`
- `supplier.ts` → `getSuppliersBySkuId()`, `getSuppliersBySkuIds()`
- `events.ts` → `getEvents()`
- `agent.ts` → `saveAgentOutput()`

## Testing Endpoints

You can test all endpoints using:

```bash
# Test script
npm test

# Or manually with curl
curl "http://localhost:3000/health"
```
