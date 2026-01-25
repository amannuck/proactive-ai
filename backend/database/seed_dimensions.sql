-- Seed Dimension Tables from Raw Data
-- Purpose: Populate dimension tables with distinct values from raw ingestion tables
-- Run this after loading CSVs into raw tables

-- Insert distinct roles from raw_staff_schedule
INSERT OR IGNORE INTO dim_role (role)
SELECT DISTINCT role
FROM raw_staff_schedule
WHERE role IS NOT NULL AND role != '';

-- Insert distinct locations from raw_current_inventory
INSERT OR IGNORE INTO dim_location (location_name)
SELECT DISTINCT location
FROM raw_current_inventory
WHERE location IS NOT NULL AND location != '';

-- Insert distinct event types from raw_historical_events
INSERT OR IGNORE INTO dim_event_type (event_type)
SELECT DISTINCT event_type
FROM raw_historical_events
WHERE event_type IS NOT NULL AND event_type != '';

-- Insert distinct clinical categories from raw_patient_data
INSERT OR IGNORE INTO dim_clinical_category (clinical_category)
SELECT DISTINCT clinical_category
FROM raw_patient_data
WHERE clinical_category IS NOT NULL AND clinical_category != '';

-- Upsert items from raw_current_inventory (primary source)
INSERT OR IGNORE INTO dim_item (sku_id, item_name, category)
SELECT DISTINCT sku_id, item_name, category
FROM raw_current_inventory
WHERE sku_id IS NOT NULL AND sku_id != '';

-- Upsert items from raw_supplier_contract (may have additional items)
INSERT OR IGNORE INTO dim_item (sku_id, item_name)
SELECT DISTINCT item_sku, item_name
FROM raw_supplier_contract
WHERE item_sku IS NOT NULL AND item_sku != ''
  AND item_sku NOT IN (SELECT sku_id FROM dim_item);

-- Update item names/categories from supplier_contract if they exist and dim_item has NULL
UPDATE dim_item
SET item_name = (
    SELECT item_name
    FROM raw_supplier_contract
    WHERE raw_supplier_contract.item_sku = dim_item.sku_id
    LIMIT 1
)
WHERE item_name IS NULL OR item_name = '';

UPDATE dim_item
SET category = (
    SELECT category
    FROM raw_current_inventory
    WHERE raw_current_inventory.sku_id = dim_item.sku_id
    LIMIT 1
)
WHERE category IS NULL OR category = '';

-- Upsert suppliers from raw_supplier_contract
INSERT OR IGNORE INTO dim_supplier (supplier_id, supplier_name)
SELECT DISTINCT supplier_id, supplier_name
FROM raw_supplier_contract
WHERE supplier_id IS NOT NULL AND supplier_id != '';

-- Update supplier names if they changed (ON CONFLICT DO UPDATE equivalent)
UPDATE dim_supplier
SET supplier_name = (
    SELECT supplier_name
    FROM raw_supplier_contract
    WHERE raw_supplier_contract.supplier_id = dim_supplier.supplier_id
    LIMIT 1
)
WHERE supplier_id IN (SELECT supplier_id FROM raw_supplier_contract);
