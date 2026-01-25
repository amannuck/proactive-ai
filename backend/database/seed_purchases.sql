-- ============================================
-- Seed realistic purchase data
-- Ensures pending_purchases and purchases are populated
-- Inventory (dim_item) is the source of truth
-- ============================================

-- Clear existing seed data
DELETE FROM pending_purchases;
DELETE FROM purchases;

-- ============================================
-- 1. PENDING PURCHASES (awaiting approval)
-- MINIMUM 10 REQUIRED
-- ============================================
INSERT INTO pending_purchases (
  sku_id,
  quantity,
  supplier_id,
  unit_price,
  status,
  reason,
  urgency,
  created_at,
  updated_at
)
SELECT
  di.sku_id,
  CASE
    WHEN di.category = 'Medication' THEN 120
    WHEN di.category = 'PPE' THEN 600
    WHEN di.category = 'Medical Supplies' THEN 250
    ELSE 80
  END AS quantity,
  fsc.supplier_id,
  fsc.price_per_unit,
  'pending',
  'Low stock detected with projected demand increase',
  CASE (ABS(RANDOM()) % 4)
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'normal'
    WHEN 2 THEN 'high'
    ELSE 'critical'
  END AS urgency,
  datetime('now', '-' || (ABS(RANDOM()) % 5) || ' days'),
  datetime('now', '-' || (ABS(RANDOM()) % 5) || ' days')
FROM dim_item di
JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
WHERE fsc.reliability_score >= 90
GROUP BY di.sku_id
LIMIT 12;

-- ============================================
-- 2. REJECTED PURCHASE REQUESTS (decision made, never approved)
-- Stored in pending_purchases for audit/history
-- ============================================
INSERT INTO pending_purchases (
  sku_id,
  quantity,
  supplier_id,
  unit_price,
  status,
  reason,
  urgency,
  created_at,
  updated_at
)
SELECT
  di.sku_id,
  60,
  fsc.supplier_id,
  fsc.price_per_unit,
  'rejected',
  'Rejected due to budget constraints or supplier delay',
  'low',
  datetime('now', '-' || (12 + ABS(RANDOM()) % 10) || ' days'),
  datetime('now', '-' || (6 + ABS(RANDOM()) % 5) || ' days')
FROM dim_item di
JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
WHERE di.category IN ('Medical Supplies', 'Equipment')
GROUP BY di.sku_id
LIMIT 8;

-- ============================================
-- 3. APPROVED PURCHASES (historical)
-- ============================================
INSERT INTO purchases (
  sku_id,
  quantity,
  supplier_id,
  unit_price,
  status,
  reason,
  approved_at,
  created_at
)
SELECT
  di.sku_id,
  CASE
    WHEN di.category = 'Medication' THEN 180
    WHEN di.category = 'PPE' THEN 1200
    WHEN di.category = 'Medical Supplies' THEN 400
    ELSE 150
  END AS quantity,
  fsc.supplier_id,
  fsc.price_per_unit,
  'approved',
  'Emergency stock replenishment during surge event',
  datetime('now', '-' || (15 + ABS(RANDOM()) % 20) || ' days'),
  datetime('now', '-' || (20 + ABS(RANDOM()) % 30) || ' days')
FROM dim_item di
JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
WHERE fsc.reliability_score >= 85
GROUP BY di.sku_id
LIMIT 20;

-- ============================================
-- 4. REJECTED PURCHASES (historical, already decided)
-- ============================================
INSERT INTO purchases (
  sku_id,
  quantity,
  supplier_id,
  unit_price,
  status,
  reason,
  approved_at,
  created_at
)
SELECT
  di.sku_id,
  90,
  fsc.supplier_id,
  fsc.price_per_unit,
  'rejected',
  'Rejected post-review due to vendor reliability concerns',
  datetime('now', '-' || (8 + ABS(RANDOM()) % 10) || ' days'),
  datetime('now', '-' || (12 + ABS(RANDOM()) % 15) || ' days')
FROM dim_item di
JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
WHERE fsc.reliability_score < 80
GROUP BY di.sku_id
LIMIT 10;

-- ============================================
-- 5. RECENT APPROVED PURCHASES (routine restocking)
-- ============================================
INSERT INTO purchases (
  sku_id,
  quantity,
  supplier_id,
  unit_price,
  status,
  reason,
  approved_at,
  created_at
)
SELECT
  di.sku_id,
  100,
  fsc.supplier_id,
  fsc.price_per_unit,
  'approved',
  'Routine monthly restocking',
  datetime('now', '-' || (1 + ABS(RANDOM()) % 5) || ' days'),
  datetime('now', '-' || (2 + ABS(RANDOM()) % 8) || ' days')
FROM dim_item di
JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
WHERE di.category IN ('Medication', 'PPE')
GROUP BY di.sku_id
LIMIT 12;
