import { useState } from "react";
import {
  ShoppingCart,
  Check,
  Clock,
  ChevronRight,
  Package,
  Truck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Link} from "react-router-dom";

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reason: string;
  status: "auto-ordered" | "pending" | "approved" | "rejected";
  estimatedCost: number;
  priority: "normal" | "urgent";
}

interface Supplier {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  reliabilityScore: number;
  inStock: boolean;
  pros: string[];
  cons: string[];
}

const mockPurchases: PurchaseItem[] = [
  {
    id: "1",
    name: "IV Fluid Bags (Lactated Ringer's)",
    quantity: 500,
    unit: "units",
    reason: "Anticipated dehydration cases from heatwave",
    status: "auto-ordered",
    estimatedCost: 2500,
    priority: "urgent",
  },
  {
    id: "2",
    name: "Trauma Kits (Advanced)",
    quantity: 25,
    unit: "kits",
    reason: "Predicted MVA surge from snowstorm",
    status: "pending",
    estimatedCost: 8750,
    priority: "urgent",
  },
  {
    id: "3",
    name: "N95 Respirator Masks",
    quantity: 2000,
    unit: "units",
    reason: "Flu outbreak protection for staff",
    status: "pending",
    estimatedCost: 1200,
    priority: "normal",
  },
  {
    id: "4",
    name: "Portable Cooling Blankets",
    quantity: 15,
    unit: "units",
    reason: "Heat stroke treatment capacity",
    status: "approved",
    estimatedCost: 4500,
    priority: "normal",
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "MedSupply Direct",
    price: 8200,
    deliveryTime: "24 hours",
    reliabilityScore: 98,
    inStock: true,
    pros: ["Fastest delivery", "Premium quality", "Bulk discount available"],
    cons: ["Higher price point"],
  },
  {
    id: "2",
    name: "Healthcare Essentials",
    price: 7500,
    deliveryTime: "48 hours",
    reliabilityScore: 94,
    inStock: true,
    pros: ["Best price", "Good quality", "Flexible payment terms"],
    cons: ["Slower delivery", "Limited bulk availability"],
  },
  {
    id: "3",
    name: "Regional Medical Supply",
    price: 8500,
    deliveryTime: "36 hours",
    reliabilityScore: 96,
    inStock: false,
    pros: ["Local supplier", "Priority support"],
    cons: ["Currently out of stock", "Premium pricing"],
  },
];

const statusConfig = {
  "auto-ordered": {
    icon: Check,
    label: "Auto-Ordered",
    className: "bg-status-low-bg text-status-low",
  },
  pending: {
    icon: Clock,
    label: "Pending Approval",
    className: "bg-status-medium-bg text-status-medium",
  },
  approved: {
    icon: Check,
    label: "Approved",
    className: "bg-primary/10 text-primary",
  },
  rejected: {
    icon: AlertCircle,
    label: "Rejected",
    className: "bg-status-high-bg text-status-high",
  },
};

export function RecommendedPurchases() {
  const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleItemClick = (item: PurchaseItem) => {
    if (item.status === "pending") {
      setSelectedItem(item);
      setIsDialogOpen(true);
    }
  };

  const pendingCount = mockPurchases.filter((p) => p.status === "pending").length;
  const totalPendingCost = mockPurchases
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.estimatedCost, 0);

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Recommended Purchases
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-suggested supplies based on predicted events
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-status-medium-bg rounded-lg border border-status-medium/20">
              <span className="text-sm font-medium text-status-medium">
                {pendingCount} pending · ${totalPendingCost.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Purchase List */}
        <div className="divide-y divide-border">
          {mockPurchases.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex items-center gap-4 p-4 transition-colors",
                  item.status === "pending" && "cursor-pointer hover:bg-muted/50"
                )}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {item.name}
                    </h3>
                    {item.priority === "urgent" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-status-high-bg text-status-high rounded">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.reason}
                  </p>
                </div>

                {/* Quantity & Cost */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.quantity} {item.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~${item.estimatedCost.toLocaleString()}
                  </p>
                </div>

                {/* Status */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                    status.className
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>

                {item.status === "pending" && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
  <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
    <Link to="/purchases" className="flex items-center">
      View purchase history
      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
    </Link>
  </Button>

  <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
    <Link to="/pending-purchases" className="flex items-center">
      Review all pending
      <ChevronRight className="w-4 h-4 ml-1" />
    </Link>
  </Button>
</div>
      </section>

      {/* Supplier Comparison Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              Compare suppliers and approve purchase for {selectedItem?.quantity}{" "}
              {selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {mockSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  supplier.inStock
                    ? "border-border hover:border-primary/50 cursor-pointer"
                    : "border-border/50 opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{supplier.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Truck className="w-3.5 h-3.5" />
                        {supplier.deliveryTime}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {supplier.reliabilityScore}% reliability
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${supplier.price.toLocaleString()}
                    </p>
                    {!supplier.inStock && (
                      <span className="text-xs text-status-high font-medium">Out of stock</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 text-xs">
                  <div className="flex-1">
                    <span className="font-medium text-status-low">Pros:</span>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {supplier.pros.map((pro, i) => (
                        <li key={i}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-status-high">Cons:</span>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {supplier.cons.map((con, i) => (
                        <li key={i}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {supplier.inStock && (
                  <Button className="w-full mt-4" size="sm">
                    Approve Purchase from {supplier.name}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
