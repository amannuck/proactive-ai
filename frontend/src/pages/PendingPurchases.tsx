import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Clock, Check, X, AlertTriangle, Package, DollarSign, Loader2, RefreshCw, TrendingUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/contexts/BudgetContext";
import { useApi } from "@/hooks/useApi";
import { getPendingPurchases, approvePurchase, rejectPurchase, PendingPurchaseRow, getSupplierOptionsForPurchase, updatePurchaseSupplier, SupplierComparisonRow } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const urgencyConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-status-low-bg text-status-low" },
  normal: { label: "Normal", className: "bg-status-medium-bg text-status-medium" },
  high: { label: "High", className: "bg-status-high-bg text-status-high" },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical" },
};

const PendingPurchases = () => {
  const { approvePurchase: approveBudget, remainingBudget } = useBudget();
  const { toast } = useToast();
  const { data: purchases, loading, error, refetch } = useApi(() => getPendingPurchases(), []);
  
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PendingPurchaseRow | null>(null);
  const [supplierOptions, setSupplierOptions] = useState<SupplierComparisonRow[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [changingSupplier, setChangingSupplier] = useState(false);

  const pendingList = purchases || [];
  const totalPending = pendingList.length;
  const totalCost = pendingList.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const criticalCount = pendingList.filter((p) => p.urgency === "critical").length;

  const handleApprovePurchase = async (purchase: PendingPurchaseRow) => {
    const cost = purchase.total_cost || 0;
    if (cost > remainingBudget) {
      toast({
        title: "Insufficient Budget",
        description: `Cannot approve purchase. Remaining budget: ${formatCurrencyCompact(remainingBudget)}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await approvePurchase(purchase.id);
      approveBudget(cost);
      toast({
        title: "Purchase Approved",
        description: `${purchase.item_name} has been approved.`,
      });
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to approve purchase",
        variant: "destructive",
      });
    }
  };

  const handleRejectPurchase = async (purchase: PendingPurchaseRow) => {
    try {
      await rejectPurchase(purchase.id);
      toast({
        title: "Purchase Rejected",
        description: `${purchase.item_name} has been rejected.`,
        variant: "destructive",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reject purchase",
        variant: "destructive",
      });
    }
  };

  const openSupplierComparison = async (purchase: PendingPurchaseRow) => {
    setSelectedPurchase(purchase);
    setSupplierDialogOpen(true);
    setLoadingSuppliers(true);
    
    try {
      const options = await getSupplierOptionsForPurchase(purchase.id);
      setSupplierOptions(options);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load supplier options",
        variant: "destructive",
      });
      setSupplierOptions([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleChangeSupplier = async (supplierId: string) => {
    if (!selectedPurchase) return;
    
    setChangingSupplier(true);
    try {
      await updatePurchaseSupplier(selectedPurchase.id, supplierId);
      toast({
        title: "Supplier Updated",
        description: "Supplier has been changed successfully.",
      });
      setSupplierDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    } finally {
      setChangingSupplier(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading pending purchases...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load pending purchases: {error}</p>
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
              <Clock className="w-6 h-6 text-status-medium" />
              Pending Purchases
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase orders awaiting approval
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Budget Remaining: <span className="font-semibold text-foreground">{formatCurrencyCompact(remainingBudget)}</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Pending Items</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalPending}</p>
            <p className="text-xs text-muted-foreground">purchase requests</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrencyCompact(totalCost)}</p>
            <p className="text-xs text-muted-foreground">estimated cost</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Critical</span>
            </div>
            <p className="text-2xl font-bold text-status-critical">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">urgent requests</p>
          </div>
        </div>

        {/* Pending Items */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Purchases</h3>
              <p className="text-sm text-muted-foreground">All purchases have been processed.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Item</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Supplier</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">Unit Price</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Urgency</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Created</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((purchase) => {
                  const urgency = urgencyConfig[purchase.urgency || "normal"] || urgencyConfig.normal;
                  return (
                    <tr key={purchase.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{purchase.item_name || purchase.sku_id}</div>
                        <div className="text-xs text-muted-foreground">{purchase.category}</div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{purchase.supplier_name || purchase.supplier_id}</td>
                      <td className="p-4 text-sm text-right text-foreground">{purchase.quantity}</td>
                      <td className="p-4 text-sm text-right text-foreground">
                        {purchase.unit_price ? formatCurrencyCompact(purchase.unit_price) : "-"}
                      </td>
                      <td className="p-4 text-sm text-right font-semibold text-foreground">
                        {purchase.total_cost ? formatCurrencyCompact(purchase.total_cost) : "-"}
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", urgency.className)}>
                          {urgency.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSupplierComparison(purchase)}
                            title="Compare suppliers"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePurchase(purchase)}
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-status-high hover:text-status-high"
                            onClick={() => handleRejectPurchase(purchase)}
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Supplier Comparison Dialog */}
        <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Supplier Comparison - {selectedPurchase?.item_name || selectedPurchase?.sku_id}
              </DialogTitle>
            </DialogHeader>
            
            {loadingSuppliers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading supplier options...</span>
              </div>
            ) : supplierOptions.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No alternative suppliers available for this item.</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Supplier:</span>
                      <span className="ml-2 font-medium text-foreground">{selectedPurchase?.supplier_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Price:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {selectedPurchase?.unit_price ? formatCurrencyCompact(selectedPurchase.unit_price) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Supplier</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Price/Unit</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Lead Time</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Reliability</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Min Order</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplierOptions.map((supplier) => {
                      const isCurrentSupplier = supplier.supplier_id === selectedPurchase?.supplier_id;
                      const totalCost = (supplier.price_per_unit || 0) * (selectedPurchase?.quantity || 1);
                      const leadTimeDays = Math.round((supplier.lead_time_hours || 0) / 24);
                      
                      return (
                        <tr 
                          key={supplier.supplier_id} 
                          className={cn(
                            "hover:bg-muted/30",
                            isCurrentSupplier && "bg-primary/5"
                          )}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{supplier.supplier_name || supplier.supplier_id}</span>
                              {supplier.is_primary === 1 && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">Primary</span>
                              )}
                              {isCurrentSupplier && (
                                <span className="px-2 py-0.5 bg-status-low-bg text-status-low text-xs rounded">Current</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-medium text-foreground">
                              {supplier.price_per_unit ? formatCurrencyCompact(supplier.price_per_unit) : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total: {formatCurrencyCompact(totalCost)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Truck className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">{leadTimeDays}d</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className={cn(
                                "w-3 h-3",
                                (supplier.reliability_score || 0) >= 95 ? "text-status-low" : "text-status-medium"
                              )} />
                              <span className={cn(
                                "font-medium",
                                (supplier.reliability_score || 0) >= 95 ? "text-status-low" : "text-status-medium"
                              )}>
                                {supplier.reliability_score || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs text-muted-foreground capitalize">
                              {supplier.contract_type || 'standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                            {supplier.min_order_qty || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleChangeSupplier(supplier.supplier_id)}
                              disabled={isCurrentSupplier || changingSupplier}
                              variant={isCurrentSupplier ? "secondary" : "default"}
                            >
                              {changingSupplier ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isCurrentSupplier ? (
                                "Selected"
                              ) : (
                                "Select"
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Changing the supplier will update the unit price and total cost. 
                    The purchase will remain pending until approved.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PendingPurchases;
