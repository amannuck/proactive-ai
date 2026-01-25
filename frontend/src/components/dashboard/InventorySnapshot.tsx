import { Package, AlertTriangle, TrendingDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";


interface InventoryItem {
  id: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  daysUntilDepletion: number;
  status: "healthy" | "low" | "critical";
}

const inventoryData: InventoryItem[] = [
  { id: "1", category: "IV Fluids", currentStock: 850, maxStock: 2000, unit: "bags", daysUntilDepletion: 3, status: "low" },
  { id: "2", category: "Trauma Supplies", currentStock: 45, maxStock: 100, unit: "kits", daysUntilDepletion: 2, status: "critical" },
  { id: "3", category: "PPE (N95 Masks)", currentStock: 3500, maxStock: 5000, unit: "units", daysUntilDepletion: 8, status: "healthy" },
  { id: "4", category: "Medications", currentStock: 420, maxStock: 600, unit: "doses", daysUntilDepletion: 5, status: "healthy" },
  { id: "5", category: "Oxygen Supplies", currentStock: 25, maxStock: 80, unit: "tanks", daysUntilDepletion: 2, status: "critical" },
];

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
  const criticalCount = inventoryData.filter((i) => i.status === "critical").length;
  const lowCount = inventoryData.filter((i) => i.status === "low").length;

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
        <div className="space-y-4">
          {inventoryData.map((item) => {
            const status = statusConfig[item.status];
            const percentFull = (item.currentStock / item.maxStock) * 100;

            return (
              <div key={item.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{item.category}</span>
                    {item.status === "critical" && (
                      <AlertTriangle className="w-4 h-4 text-status-critical" />
                    )}
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
                    style={{ width: `${percentFull}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
