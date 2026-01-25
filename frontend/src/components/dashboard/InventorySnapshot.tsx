import { Package, AlertTriangle, TrendingDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { getInventoryRisk, type InventoryRiskRow } from "@/lib/api";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  daysUntilDepletion: number;
  status: "healthy" | "low" | "critical";
}

function mapApiToInventoryItem(row: InventoryRiskRow): InventoryItem {
  const daysUntilDepletion = Math.round(row.days_until_stockout ?? 999);
  let status: "healthy" | "low" | "critical" = "healthy";
  if (daysUntilDepletion <= 2) status = "critical";
  else if (daysUntilDepletion <= 5) status = "low";

  return {
    id: row.sku_id,
    name: row.item_name || row.sku_id,
    category: row.category || "Uncategorized",
    currentStock: row.current_stock ?? 0,
    maxStock: row.par_level ?? 100,
    unit: "units",
    daysUntilDepletion,
    status,
  };
}

const statusConfig = {
  healthy: {
    color: "bg-status-low",
    textColor: "text-status-low",
    bgColor: "bg-status-low-bg",
  },
  low: {
    color: "bg-status-medium",
    textColor: "text-status-medium",
    bgColor: "bg-status-medium-bg",
  },
  critical: {
    color: "bg-status-critical",
    textColor: "text-status-critical",
    bgColor: "bg-status-critical-bg",
  },
};

export function InventorySnapshot() {
  const { data: apiData, loading, error } = useApi(() => getInventoryRisk(2), []);

  const inventoryItems: InventoryItem[] = apiData?.map(mapApiToInventoryItem) || [];
  const criticalItems = inventoryItems.filter((i) => i.status === "critical");

  const criticalCount = criticalItems.length;
  const lowCount = inventoryItems.filter((i) => i.status === "low").length;

  return (
    <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Inventory Status
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Current stock levels and projected depletion
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-status-critical-bg text-status-critical rounded-full">
              {criticalCount} Critical
            </span>
          )}
          {lowCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-status-medium-bg text-status-medium rounded-full">
              {lowCount} Low
            </span>
          )}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading inventory risk…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10 text-sm text-status-critical">
            Failed to load inventory risk: {error}
          </div>
        ) : criticalItems.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No critical inventory items.
          </div>
        ) : (
          <div className="space-y-4">
            {criticalItems.map((item) => {
              const status = statusConfig[item.status];
              const percentFull = item.maxStock > 0 ? (item.currentStock / item.maxStock) * 100 : 0;

              return (
                <div key={item.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-status-critical" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {item.currentStock.toLocaleString()} / {item.maxStock.toLocaleString()} {item.unit}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                          status.bgColor,
                          status.textColor
                        )}
                      >
                        <TrendingDown className="w-3 h-3" />
                        {item.daysUntilDepletion}d
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                        status.color
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, percentFull))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Depletion timeline based on predicted surge demand
        </div>
        <Link
          to="/inventory"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View full inventory
          <ChevronRight className="w-4 h-4" />
        </Link>

      </div>
    </section>
  );
}
