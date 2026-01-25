import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ShoppingCart, Check, AlertTriangle, Loader2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { getApprovedPurchases, getPendingPurchases, getRejectedPurchases, PendingPurchaseRow, PurchaseRow } from "@/lib/api";

type PurchaseLike = PurchaseRow | PendingPurchaseRow;

function getPurchaseDate(purchase: PurchaseLike): string {
  if ("approved_at" in purchase && purchase.approved_at) return purchase.approved_at;
  if ("updated_at" in purchase && purchase.updated_at) return purchase.updated_at;
  return purchase.created_at;
}

function getStatusBadge(status: string): { className: string; icon: typeof Check } {
  const normalized = status.toLowerCase();
  if (normalized.includes("reject")) {
    return { className: "bg-status-critical-bg text-status-critical", icon: X };
  }
  if (normalized.includes("pend")) {
    return { className: "bg-status-medium-bg text-status-medium", icon: Clock };
  }
  return { className: "bg-status-low-bg text-status-low", icon: Check };
}

function PurchasesTable({
  purchases,
  emptyTitle,
  emptyDescription,
  dateHeader,
}: {
  purchases: PurchaseLike[];
  emptyTitle: string;
  emptyDescription: string;
  dateHeader: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {purchases.length === 0 ? (
        <div className="p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Item</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Supplier</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Qty</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Unit Price</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Total</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">{dateHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((purchase) => {
              const badge = getStatusBadge(purchase.status);
              const Icon = badge.icon;
              return (
                <tr key={purchase.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{purchase.item_name || purchase.sku_id}</div>
                    <div className="text-xs text-muted-foreground">{purchase.category}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{purchase.supplier_name || purchase.supplier_id}</td>
                  <td className="py-3 px-4 text-sm text-right text-foreground">{purchase.quantity}</td>
                  <td className="py-3 px-4 text-sm text-right text-foreground">
                    {purchase.unit_price ? formatCurrencyCompact(purchase.unit_price) : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-foreground">
                    {purchase.total_cost ? formatCurrencyCompact(purchase.total_cost) : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        badge.className
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {purchase.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(getPurchaseDate(purchase)).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const Purchases = () => {
  const {
    data: purchasesData,
    loading,
    error,
  } = useApi(
    async () => {
      const [pending, approved, rejected] = await Promise.all([
        getPendingPurchases(),
        getApprovedPurchases(),
        getRejectedPurchases(),
      ]);
      return { pending, approved, rejected };
    },
    []
  );

  const pendingList = purchasesData?.pending || [];
  const approvedList = purchasesData?.approved || [];
  const rejectedList = purchasesData?.rejected || [];

  const totalApprovedCost = approvedList.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalPendingCost = pendingList.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalRejectedCost = rejectedList.reduce((sum, p) => sum + (p.total_cost || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading purchases...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load purchases: {error}</p>
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
              <ShoppingCart className="w-6 h-6 text-primary" />
              Purchases
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Approved, pending, and rejected purchase orders
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Approved: <span className="font-semibold text-foreground">{approvedList.length}</span> · {formatCurrencyCompact(totalApprovedCost)}
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Pending Purchases</h2>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{pendingList.length}</span> · {formatCurrencyCompact(totalPendingCost)}
            </div>
          </div>
          <PurchasesTable
            purchases={pendingList}
            emptyTitle="No Pending Purchases"
            emptyDescription="Pending purchases will appear here."
            dateHeader="Updated"
          />
        </div>

        {/* Approved Purchases */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Approved Purchases</h2>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{approvedList.length}</span> · {formatCurrencyCompact(totalApprovedCost)}
            </div>
          </div>
          <PurchasesTable
            purchases={approvedList}
            emptyTitle="No Approved Purchases"
            emptyDescription="Approved purchases will appear here."
            dateHeader="Approved"
          />
        </div>

        {/* Rejected Purchases */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Rejected Purchases</h2>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{rejectedList.length}</span> · {formatCurrencyCompact(totalRejectedCost)}
            </div>
          </div>
          <PurchasesTable
            purchases={rejectedList}
            emptyTitle="No Rejected Purchases"
            emptyDescription="Rejected purchases will appear here."
            dateHeader="Updated"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Purchases;
