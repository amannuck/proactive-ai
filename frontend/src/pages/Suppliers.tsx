import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Truck, Search, Phone, Mail, TrendingUp, CheckCircle2, Clock, Loader2, AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getAllSuppliers, getInventoryForOrdering, createPendingPurchase, InventoryForOrderingRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyCompact } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Supplier {
  supplier_id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  lead_time_days: number;
  reliability_score: number;
  primary_products: string[];
  status: string;
  last_order_date: string;
}

const Suppliers = () => {
  const { toast } = useToast();
  const { data: apiData, loading, error } = useApi(() => getAllSuppliers(), []);
  const { data: inventoryData } = useApi(() => getInventoryForOrdering(), []);
  
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryForOrderingRow | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderReason, setOrderReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const suppliers: Supplier[] = (apiData || []).map((row) => ({
    supplier_id: row.supplier_id,
    name: row.supplier_name || row.supplier_id,
    category: row.category || "General",
    contact: `orders@${(row.supplier_name || "supplier").toLowerCase().replace(/\s+/g, "")}.com`,
    phone: "+1 (555) 000-0000",
    lead_time_days: Math.round((row.lead_time_hours || 48) / 24),
    reliability_score: row.reliability_score || 0,
    primary_products: row.primary_products ? String(row.primary_products).split(",").slice(0, 4) : [],
    status: "active",
    last_order_date: new Date().toISOString().split("T")[0],
  }));

  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const avgReliability = suppliers.length > 0 
    ? Math.round(suppliers.reduce((sum, s) => sum + s.reliability_score, 0) / suppliers.length)
    : 0;
  const avgLeadTime = suppliers.length > 0
    ? Math.round(suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length)
    : 0;

  // Get items available from a specific supplier
  const getSupplierItems = (supplierId: string) => {
    return (inventoryData || []).filter(item => item.supplier_id === supplierId);
  };

  const openOrderDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedItem(null);
    setOrderQuantity(1);
    setOrderReason("");
    setOrderDialogOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedSupplier || !selectedItem) return;
    
    setSubmitting(true);
    try {
      await createPendingPurchase({
        sku_id: selectedItem.sku_id,
        quantity: orderQuantity,
        supplier_id: selectedItem.supplier_id,
        reason: orderReason || `Order from ${selectedSupplier.name}`,
        urgency: "normal",
      });
      
      toast({
        title: "Order Placed",
        description: `Order for ${orderQuantity}x ${selectedItem.item_name} has been submitted for approval.`,
      });
      
      setOrderDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading suppliers...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load suppliers: {error}</p>
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
              <Truck className="w-6 h-6 text-primary" />
              Suppliers Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage vendor relationships and supply chain contacts
            </p>
          </div>
          <Button className="gap-2">
            <Truck className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Active Suppliers</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeSuppliers}</p>
            <p className="text-xs text-muted-foreground">verified vendors</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Reliability</span>
            </div>
            <p className="text-2xl font-bold text-status-low">{avgReliability}%</p>
            <p className="text-xs text-muted-foreground">performance score</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Lead Time</span>
            </div>
            <p className="text-2xl font-bold text-primary">{avgLeadTime} days</p>
            <p className="text-xs text-muted-foreground">delivery window</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search suppliers by name, category, or product..." className="pl-9" />
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.supplier_id}
              className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{supplier.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      supplier.reliability_score >= 95
                        ? "bg-status-low-bg text-status-low"
                        : supplier.reliability_score >= 90
                        ? "bg-status-medium-bg text-status-medium"
                        : "bg-status-high-bg text-status-high"
                    )}
                  >
                    {supplier.reliability_score}% reliable
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${supplier.contact}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.contact}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${supplier.phone}`} className="text-foreground">
                    {supplier.phone}
                  </a>
                </div>
              </div>

              {/* Lead Time */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Lead time: <span className="font-medium text-foreground">{supplier.lead_time_days} days</span>
                </span>
              </div>

              {/* Products */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Primary Products:</p>
                <div className="flex flex-wrap gap-2">
                  {supplier.primary_products.map((product) => (
                    <span
                      key={product}
                      className="px-2 py-1 bg-muted rounded text-xs text-foreground"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Last order: {new Date(supplier.last_order_date).toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm" onClick={() => openOrderDialog(supplier)}>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Place Order
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Place Order - {selectedSupplier?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Item Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Select Item</label>
                <Select
                  value={selectedItem?.sku_id || ""}
                  onValueChange={(value) => {
                    const item = getSupplierItems(selectedSupplier?.supplier_id || "").find(i => i.sku_id === value);
                    setSelectedItem(item || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getSupplierItems(selectedSupplier?.supplier_id || "").map((item) => (
                      <SelectItem key={item.sku_id} value={item.sku_id}>
                        {item.item_name || item.sku_id} - {formatCurrencyCompact(item.price_per_unit || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Item Details */}
              {selectedItem && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono text-foreground">{selectedItem.sku_id}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium text-foreground">{formatCurrencyCompact(selectedItem.price_per_unit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lead Time:</span>
                    <span className="text-foreground">{Math.round((selectedItem.lead_time_hours || 48) / 24)} days</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
                <Input
                  type="number"
                  min={selectedItem?.min_order_qty || 1}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                />
                {selectedItem?.min_order_qty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum order: {selectedItem.min_order_qty}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Reason (optional)</label>
                <Input
                  placeholder="e.g., Low stock replenishment"
                  value={orderReason}
                  onChange={(e) => setOrderReason(e.target.value)}
                />
              </div>

              {/* Total */}
              {selectedItem && (
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-medium text-foreground">Estimated Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrencyCompact((selectedItem.price_per_unit || 0) * orderQuantity)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handlePlaceOrder}
                  disabled={!selectedItem || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Order"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Suppliers;
