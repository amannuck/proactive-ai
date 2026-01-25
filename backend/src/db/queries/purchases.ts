import { db } from '../index';

export interface PendingPurchaseRow {
  id: number;
  sku_id: string;
  item_name: string | null;
  category: string | null;
  quantity: number;
  supplier_id: string;
  supplier_name: string | null;
  unit_price: number | null;
  total_cost: number | null;
  status: string;
  reason: string | null;
  urgency: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRow {
  id: number;
  sku_id: string;
  item_name: string | null;
  category: string | null;
  quantity: number;
  supplier_id: string;
  supplier_name: string | null;
  unit_price: number | null;
  total_cost: number | null;
  status: string;
  reason: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface CreatePurchaseInput {
  sku_id: string;
  quantity: number;
  supplier_id: string;
  reason?: string;
  urgency?: string;
}

// Get all pending purchases
const getPendingPurchasesStmt = db.prepare(`
  SELECT 
    pp.id,
    pp.sku_id,
    di.item_name,
    di.category,
    pp.quantity,
    pp.supplier_id,
    ds.supplier_name,
    pp.unit_price,
    (pp.quantity * pp.unit_price) as total_cost,
    pp.status,
    pp.reason,
    pp.urgency,
    pp.created_at,
    pp.updated_at
  FROM pending_purchases pp
  LEFT JOIN dim_item di ON pp.sku_id = di.sku_id
  LEFT JOIN dim_supplier ds ON pp.supplier_id = ds.supplier_id
  WHERE pp.status = 'pending'
  ORDER BY pp.created_at DESC
`);

export function getPendingPurchases(): PendingPurchaseRow[] {
  return getPendingPurchasesStmt.all() as PendingPurchaseRow[];
}

// Get all approved purchases
const getApprovedPurchasesStmt = db.prepare(`
  SELECT 
    p.id,
    p.sku_id,
    di.item_name,
    di.category,
    p.quantity,
    p.supplier_id,
    ds.supplier_name,
    p.unit_price,
    (p.quantity * p.unit_price) as total_cost,
    p.status,
    p.reason,
    p.approved_at,
    p.created_at
  FROM purchases p
  LEFT JOIN dim_item di ON p.sku_id = di.sku_id
  LEFT JOIN dim_supplier ds ON p.supplier_id = ds.supplier_id
  ORDER BY p.approved_at DESC
`);

export function getApprovedPurchases(): PurchaseRow[] {
  return getApprovedPurchasesStmt.all() as PurchaseRow[];
}

// Create a new pending purchase
export function createPendingPurchase(input: CreatePurchaseInput): number {
  // Get unit price from supplier contract
  const priceQuery = db.prepare(`
    SELECT price_per_unit 
    FROM fact_supplier_contract 
    WHERE sku_id = ? AND supplier_id = ?
    LIMIT 1
  `);
  const priceResult = priceQuery.get(input.sku_id, input.supplier_id) as { price_per_unit: number } | undefined;
  const unitPrice = priceResult?.price_per_unit || 0;

  const insertStmt = db.prepare(`
    INSERT INTO pending_purchases (sku_id, quantity, supplier_id, unit_price, status, reason, urgency, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))
  `);
  
  const result = insertStmt.run(
    input.sku_id,
    input.quantity,
    input.supplier_id,
    unitPrice,
    input.reason || null,
    input.urgency || 'normal'
  );
  
  return result.lastInsertRowid as number;
}

// Approve a pending purchase (move to purchases table)
export function approvePendingPurchase(pendingId: number): number | null {
  // Get the pending purchase
  const getPendingStmt = db.prepare(`
    SELECT * FROM pending_purchases WHERE id = ? AND status = 'pending'
  `);
  const pending = getPendingStmt.get(pendingId) as {
    sku_id: string;
    quantity: number;
    supplier_id: string;
    unit_price: number;
    reason: string | null;
  } | undefined;

  if (!pending) {
    return null;
  }

  // Insert into purchases
  const insertStmt = db.prepare(`
    INSERT INTO purchases (sku_id, quantity, supplier_id, unit_price, status, reason, approved_at, created_at)
    VALUES (?, ?, ?, ?, 'approved', ?, datetime('now'), datetime('now'))
  `);
  
  const result = insertStmt.run(
    pending.sku_id,
    pending.quantity,
    pending.supplier_id,
    pending.unit_price,
    pending.reason
  );

  // Update pending purchase status
  const updateStmt = db.prepare(`
    UPDATE pending_purchases 
    SET status = 'approved', updated_at = datetime('now')
    WHERE id = ?
  `);
  updateStmt.run(pendingId);

  return result.lastInsertRowid as number;
}

// Reject a pending purchase
export function rejectPendingPurchase(pendingId: number): boolean {
  const updateStmt = db.prepare(`
    UPDATE pending_purchases 
    SET status = 'rejected', updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `);
  
  const result = updateStmt.run(pendingId);
  return result.changes > 0;
}

// Get inventory items for ordering (with supplier info)
const getInventoryForOrderingStmt = db.prepare(`
  SELECT DISTINCT
    di.sku_id,
    di.item_name,
    di.category,
    fsc.supplier_id,
    ds.supplier_name,
    fsc.price_per_unit,
    fsc.lead_time_hours,
    fsc.min_order_qty
  FROM dim_item di
  LEFT JOIN fact_supplier_contract fsc ON di.sku_id = fsc.sku_id
  LEFT JOIN dim_supplier ds ON fsc.supplier_id = ds.supplier_id
  WHERE fsc.supplier_id IS NOT NULL
  ORDER BY di.item_name, fsc.price_per_unit ASC
`);

export interface InventoryForOrderingRow {
  sku_id: string;
  item_name: string | null;
  category: string | null;
  supplier_id: string;
  supplier_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  min_order_qty: number | null;
}

export function getInventoryForOrdering(): InventoryForOrderingRow[] {
  return getInventoryForOrderingStmt.all() as InventoryForOrderingRow[];
}

// Get supplier options for a specific SKU (for comparison during approval)
export interface SupplierComparisonRow {
  supplier_id: string;
  supplier_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  contract_type: string | null;
  min_order_qty: number | null;
  is_primary: number;
}

export function getSupplierOptionsForSku(skuId: string): SupplierComparisonRow[] {
  const stmt = db.prepare(`
    SELECT 
      fsc.supplier_id,
      ds.supplier_name,
      fsc.price_per_unit,
      fsc.lead_time_hours,
      fsc.reliability_score,
      fsc.contract_type,
      fsc.min_order_qty,
      CASE WHEN fsc.contract_type = 'primary' THEN 1 ELSE 0 END as is_primary
    FROM fact_supplier_contract fsc
    LEFT JOIN dim_supplier ds ON fsc.supplier_id = ds.supplier_id
    WHERE fsc.sku_id = ?
    ORDER BY is_primary DESC, fsc.reliability_score DESC, fsc.price_per_unit ASC
  `);
  
  return stmt.all(skuId) as SupplierComparisonRow[];
}

// Update supplier on a pending purchase
export function updatePendingPurchaseSupplier(pendingId: number, newSupplierId: string): boolean {
  // Get the SKU for this pending purchase
  const getSkuStmt = db.prepare('SELECT sku_id FROM pending_purchases WHERE id = ? AND status = "pending"');
  const result = getSkuStmt.get(pendingId) as { sku_id: string } | undefined;
  
  if (!result) {
    return false;
  }

  // Get the new price from the supplier contract
  const priceStmt = db.prepare(`
    SELECT price_per_unit 
    FROM fact_supplier_contract 
    WHERE sku_id = ? AND supplier_id = ?
    LIMIT 1
  `);
  const priceResult = priceStmt.get(result.sku_id, newSupplierId) as { price_per_unit: number } | undefined;
  
  if (!priceResult) {
    return false;
  }

  // Update the pending purchase
  const updateStmt = db.prepare(`
    UPDATE pending_purchases 
    SET supplier_id = ?, unit_price = ?, updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `);
  
  const updateResult = updateStmt.run(newSupplierId, priceResult.price_per_unit, pendingId);
  return updateResult.changes > 0;
}

// Get rejected purchases (for history view)
export function getRejectedPurchases(): PendingPurchaseRow[] {
  const stmt = db.prepare(`
    SELECT 
      pp.id,
      pp.sku_id,
      di.item_name,
      di.category,
      pp.quantity,
      pp.supplier_id,
      ds.supplier_name,
      pp.unit_price,
      (pp.quantity * pp.unit_price) as total_cost,
      pp.status,
      pp.reason,
      pp.urgency,
      pp.created_at,
      pp.updated_at
    FROM pending_purchases pp
    LEFT JOIN dim_item di ON pp.sku_id = di.sku_id
    LEFT JOIN dim_supplier ds ON pp.supplier_id = ds.supplier_id
    WHERE pp.status = 'rejected'
    ORDER BY pp.updated_at DESC
  `);
  
  return stmt.all() as PendingPurchaseRow[];
}
