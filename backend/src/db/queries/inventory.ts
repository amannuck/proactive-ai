import { db } from '../index';

export interface InventoryRiskRow {
  sku_id: string;
  item_name: string | null;
  category: string | null;
  location_id: number | null;
  location_name: string | null;
  current_stock: number | null;
  par_level: number | null;
  burn_rate_daily: number | null;
  status: string | null;
  days_until_stockout: number | null;
  ts: string;
  date: string;
}

const getLatestInventorySnapshot = db.prepare(`
  WITH latest_snapshots AS (
    SELECT 
      ins.ts,
      ins.date,
      ins.sku_id,
      ins.location_id,
      ins.current_stock,
      ins.par_level,
      ins.burn_rate_daily,
      ins.status,
      ROW_NUMBER() OVER (
        PARTITION BY ins.sku_id, ins.location_id 
        ORDER BY ins.ts DESC
      ) as rn
    FROM fact_inventory_snapshot ins
  )
  SELECT 
    ls.sku_id,
    di.item_name,
    di.category,
    ls.location_id,
    dl.location_name,
    ls.current_stock,
    ls.par_level,
    ls.burn_rate_daily,
    ls.status,
    CASE 
      WHEN ls.burn_rate_daily > 0 AND ls.current_stock IS NOT NULL 
      THEN CAST(ls.current_stock AS REAL) / ls.burn_rate_daily
      ELSE NULL
    END as days_until_stockout,
    ls.ts,
    ls.date
  FROM latest_snapshots ls
  LEFT JOIN dim_item di ON ls.sku_id = di.sku_id
  LEFT JOIN dim_location dl ON ls.location_id = dl.location_id
  WHERE ls.rn = 1
    AND ls.burn_rate_daily > 0
    AND ls.current_stock IS NOT NULL
  ORDER BY days_until_stockout ASC
`);

export function getInventoryRisk(): InventoryRiskRow[] {
  return getLatestInventorySnapshot.all() as InventoryRiskRow[];
}

const getInventoryRiskByDaysStmt = db.prepare(`
  WITH latest_snapshots AS (
    SELECT 
      ins.ts,
      ins.date,
      ins.sku_id,
      ins.location_id,
      ins.current_stock,
      ins.par_level,
      ins.burn_rate_daily,
      ins.status,
      ROW_NUMBER() OVER (
        PARTITION BY ins.sku_id, ins.location_id 
        ORDER BY ins.ts DESC
      ) as rn
    FROM fact_inventory_snapshot ins
  )
  SELECT 
    ls.sku_id,
    di.item_name,
    di.category,
    ls.location_id,
    dl.location_name,
    ls.current_stock,
    ls.par_level,
    ls.burn_rate_daily,
    ls.status,
    CASE 
      WHEN ls.burn_rate_daily > 0 AND ls.current_stock IS NOT NULL 
      THEN CAST(ls.current_stock AS REAL) / ls.burn_rate_daily
      ELSE NULL
    END as days_until_stockout,
    ls.ts,
    ls.date
  FROM latest_snapshots ls
  LEFT JOIN dim_item di ON ls.sku_id = di.sku_id
  LEFT JOIN dim_location dl ON ls.location_id = dl.location_id
  WHERE ls.rn = 1
    AND ls.burn_rate_daily > 0
    AND ls.current_stock IS NOT NULL
    AND (
      CASE 
        WHEN ls.burn_rate_daily > 0 AND ls.current_stock IS NOT NULL 
        THEN CAST(ls.current_stock AS REAL) / ls.burn_rate_daily
        ELSE NULL
      END
    ) <= ?
  ORDER BY days_until_stockout ASC
`);

export function getInventoryRiskByDays(days: number): InventoryRiskRow[] {
  return getInventoryRiskByDaysStmt.all(days) as InventoryRiskRow[];
}

const getAllInventoryStmt = db.prepare(`
  WITH latest_snapshots AS (
    SELECT 
      ins.ts,
      ins.date,
      ins.sku_id,
      ins.location_id,
      ins.current_stock,
      ins.par_level,
      ins.burn_rate_daily,
      ins.status,
      ROW_NUMBER() OVER (
        PARTITION BY ins.sku_id, ins.location_id 
        ORDER BY ins.ts DESC
      ) as rn
    FROM fact_inventory_snapshot ins
  )
  SELECT 
    ls.sku_id,
    di.item_name,
    di.category,
    ls.location_id,
    dl.location_name,
    ls.current_stock,
    ls.par_level,
    ls.burn_rate_daily,
    ls.status,
    CASE 
      WHEN ls.burn_rate_daily > 0 AND ls.current_stock IS NOT NULL 
      THEN CAST(ls.current_stock AS REAL) / ls.burn_rate_daily
      ELSE NULL
    END as days_until_stockout,
    ls.ts,
    ls.date
  FROM latest_snapshots ls
  LEFT JOIN dim_item di ON ls.sku_id = di.sku_id
  LEFT JOIN dim_location dl ON ls.location_id = dl.location_id
  WHERE ls.rn = 1
  ORDER BY days_until_stockout ASC NULLS LAST
`);

export function getAllInventory(): InventoryRiskRow[] {
  return getAllInventoryStmt.all() as InventoryRiskRow[];
}
