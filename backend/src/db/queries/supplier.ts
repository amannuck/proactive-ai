import { db } from '../index';

export interface SupplierContractRow {
  contract_id: number;
  supplier_id: string;
  supplier_name: string | null;
  contract_type: string | null;
  sku_id: string;
  item_name: string | null;
  price_per_unit: number | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  min_order_qty: number | null;
  notes: string | null;
}

// Get all suppliers for a specific SKU
const getSuppliersBySku = db.prepare(`
  SELECT 
    fsc.contract_id,
    fsc.supplier_id,
    ds.supplier_name,
    fsc.contract_type,
    fsc.sku_id,
    di.item_name,
    fsc.price_per_unit,
    fsc.lead_time_hours,
    fsc.reliability_score,
    fsc.min_order_qty,
    fsc.notes
  FROM fact_supplier_contract fsc
  LEFT JOIN dim_supplier ds ON fsc.supplier_id = ds.supplier_id
  LEFT JOIN dim_item di ON fsc.sku_id = di.sku_id
  WHERE fsc.sku_id = ?
  ORDER BY fsc.reliability_score DESC, fsc.price_per_unit ASC
`);

export function getSuppliersBySkuId(skuId: string): SupplierContractRow[] {
  return getSuppliersBySku.all(skuId) as SupplierContractRow[];
}

// Get suppliers for multiple SKUs
// Note: SQLite doesn't support array parameters directly, so we'll build the query dynamically
// For safety, we'll use a prepared statement with placeholders
export function getSuppliersBySkuIds(skuIds: string[]): SupplierContractRow[] {
  if (skuIds.length === 0) return [];
  
  // Create placeholders for the IN clause
  const placeholders = skuIds.map(() => '?').join(',');
  
  const query = db.prepare(`
    SELECT 
      fsc.contract_id,
      fsc.supplier_id,
      ds.supplier_name,
      fsc.contract_type,
      fsc.sku_id,
      di.item_name,
      fsc.price_per_unit,
      fsc.lead_time_hours,
      fsc.reliability_score,
      fsc.min_order_qty,
      fsc.notes
    FROM fact_supplier_contract fsc
    LEFT JOIN dim_supplier ds ON fsc.supplier_id = ds.supplier_id
    LEFT JOIN dim_item di ON fsc.sku_id = di.sku_id
    WHERE fsc.sku_id IN (${placeholders})
    ORDER BY fsc.sku_id, fsc.reliability_score DESC, fsc.price_per_unit ASC
  `);
  
  return query.all(...skuIds) as SupplierContractRow[];
}

// Get all supplier contracts (for reference)
const getAllSupplierContractsStmt = db.prepare(`
  SELECT 
    fsc.contract_id,
    fsc.supplier_id,
    ds.supplier_name,
    fsc.contract_type,
    fsc.sku_id,
    di.item_name,
    fsc.price_per_unit,
    fsc.lead_time_hours,
    fsc.reliability_score,
    fsc.min_order_qty,
    fsc.notes
  FROM fact_supplier_contract fsc
  LEFT JOIN dim_supplier ds ON fsc.supplier_id = ds.supplier_id
  LEFT JOIN dim_item di ON fsc.sku_id = di.sku_id
  ORDER BY fsc.sku_id, fsc.reliability_score DESC, fsc.price_per_unit ASC
`);

export function getAllSupplierContracts(): SupplierContractRow[] {
  return getAllSupplierContractsStmt.all() as SupplierContractRow[];
}

export interface SupplierSummaryRow {
  supplier_id: string;
  supplier_name: string | null;
  category: string | null;
  lead_time_hours: number | null;
  reliability_score: number | null;
  primary_products: string;
}

const getAllSuppliersStmt = db.prepare(`
  SELECT 
    ds.supplier_id,
    ds.supplier_name,
    (SELECT di.category FROM fact_supplier_contract fsc2 
     LEFT JOIN dim_item di ON fsc2.sku_id = di.sku_id 
     WHERE fsc2.supplier_id = ds.supplier_id LIMIT 1) as category,
    AVG(fsc.lead_time_hours) as lead_time_hours,
    AVG(fsc.reliability_score) as reliability_score,
    GROUP_CONCAT(DISTINCT di.item_name) as primary_products
  FROM dim_supplier ds
  LEFT JOIN fact_supplier_contract fsc ON ds.supplier_id = fsc.supplier_id
  LEFT JOIN dim_item di ON fsc.sku_id = di.sku_id
  GROUP BY ds.supplier_id, ds.supplier_name
  ORDER BY reliability_score DESC
`);

export function getAllSuppliers(): SupplierSummaryRow[] {
  return getAllSuppliersStmt.all() as SupplierSummaryRow[];
}
