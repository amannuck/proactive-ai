import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Package, Search, Filter, AlertTriangle, TrendingDown, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getAllInventory, InventoryRiskRow } from "@/lib/api";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  reorderPoint: number;
  daysUntilDepletion: number;
  status: "healthy" | "low" | "critical";
  lastRestocked: string;
}

function mapApiToInventoryItem(row: InventoryRiskRow): InventoryItem {
  const daysUntilDepletion = row.days_until_stockout ?? 999;
  let status: "healthy" | "low" | "critical" = "healthy";
  if (daysUntilDepletion <= 2) status = "critical";
  else if (daysUntilDepletion <= 5) status = "low";

  return {
    id: row.sku_id,
    name: row.item_name || row.sku_id,
    category: row.category || "Uncategorized",
    currentStock: row.current_stock || 0,
    maxStock: row.par_level || 100,
    unit: "units",
    reorderPoint: Math.floor((row.par_level || 100) * 0.3),
    daysUntilDepletion: Math.round(daysUntilDepletion),
    status,
    lastRestocked: row.date || "Unknown",
  };
}

const statusConfig = {
  healthy: { label: "Healthy", className: "bg-status-low-bg text-status-low" },
  low: { label: "Low", className: "bg-status-medium-bg text-status-medium" },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical" },
};

const categories = ["All Categories", "IV Fluids", "Trauma Supplies", "PPE", "Medications", "Oxygen Supplies"];

const Inventory = () => {
  const { data: apiData, loading, error } = useApi(() => getAllInventory(), []);
  
  const inventoryItems: InventoryItem[] = apiData?.map(mapApiToInventoryItem) || [];
  const criticalCount = inventoryItems.filter((i) => i.status === "critical").length;
  const lowCount = inventoryItems.filter((i) => i.status === "low").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading inventory...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load inventory: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Inventory Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor stock levels and manage supply chain
            </p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-3 py-1.5 text-sm font-semibold bg-status-critical-bg text-status-critical rounded-lg">
                {criticalCount} Critical
              </span>
            )}
            {lowCount > 0 && (
              <span className="px-3 py-1.5 text-sm font-semibold bg-status-medium-bg text-status-medium rounded-lg">
                {lowCount} Low Stock
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search inventory..." className="pl-9" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            All Categories
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            Status
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Inventory Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Level</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Depletion</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Restocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventoryItems.map((item) => {
                  const status = statusConfig[item.status];
                  const percentFull = (item.currentStock / item.maxStock) * 100;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.name}</span>
                          {item.status === "critical" && (
                            <AlertTriangle className="w-4 h-4 text-status-critical" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                item.status === "critical" ? "bg-status-critical" :
                                item.status === "low" ? "bg-status-medium" : "bg-status-low"
                              )}
                              style={{ width: `${percentFull}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {item.currentStock} / {item.maxStock} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          item.daysUntilDepletion <= 2 ? "text-status-critical" :
                          item.daysUntilDepletion <= 4 ? "text-status-medium" : "text-muted-foreground"
                        )}>
                          <TrendingDown className="w-3.5 h-3.5" />
                          {item.daysUntilDepletion} days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.lastRestocked}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
