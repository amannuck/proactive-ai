# Supplier API Testing Guide

## Available SKUs in Database

The database contains supplier contracts for the following SKUs (sample):

- `BL-O-NEG` - Blood products
- `IV-LR-1000` - IV Lactated Ringer's
- `IV-NS-1000` - IV Normal Saline
- `IV-START-KIT` - IV Start Kit
- `RX-CEFTRIAXONE` - Antibiotic
- `RX-EPI-PEN` - Epinephrine
- `RX-FENTANYL` - Pain medication
- `RX-INSULIN` - Insulin
- `RX-MORPHINE` - Pain medication
- `OR-SLING` - Orthopedic sling
- `TR-KIT-ADV` - Trauma kit advanced
- `GN-SUTURE-KIT` - Suture kit

## Testing the Supplier API

### Get Suppliers for a Single SKU

```bash
# Test with a real SKU
curl "http://localhost:3000/api/ui/suppliers/by-sku/IV-LR-1000"

# Another example
curl "http://localhost:3000/api/ui/suppliers/by-sku/OR-SLING"

# If SKU doesn't exist, you'll get an empty array
curl "http://localhost:3000/api/ui/suppliers/by-sku/SKU-001"
# Returns: []
```

### Get Suppliers for Multiple SKUs

```bash
curl -X POST "http://localhost:3000/api/ui/suppliers/by-skus" \
  -H "Content-Type: application/json" \
  -d '{
    "sku_ids": ["IV-LR-1000", "OR-SLING", "RX-EPI-PEN"]
  }'
```

### Find All Available SKUs

```bash
# List all SKUs that have supplier contracts
sqlite3 forecasting.db "SELECT DISTINCT sku_id FROM fact_supplier_contract ORDER BY sku_id;"
```

## Expected Response Format

```json
[
  {
    "contract_id": 1,
    "supplier_id": "SUP-001",
    "supplier_name": "Medical Supplies Co.",
    "contract_type": "Standard",
    "sku_id": "IV-LR-1000",
    "item_name": "IV Lactated Ringer's 1000ml",
    "price_per_unit": 12.50,
    "lead_time_hours": 72,
    "reliability_score": 0.95,
    "min_order_qty": 10,
    "notes": "Bulk discount available"
  }
]
```

## Troubleshooting

### Empty Array Response

If you get `[]`, it means:
- The SKU doesn't exist in `fact_supplier_contract` table
- OR the SKU has no supplier contracts

**Solution**: Use a real SKU from the database. Check available SKUs:
```bash
sqlite3 forecasting.db "SELECT DISTINCT sku_id FROM fact_supplier_contract LIMIT 10;"
```

### No Data in fact_supplier_contract

If the table is empty:
```bash
# Check if table exists and has data
sqlite3 forecasting.db "SELECT COUNT(*) FROM fact_supplier_contract;"

# If 0, run ETL to populate it
sqlite3 forecasting.db < database/etl_facts.sql
```
