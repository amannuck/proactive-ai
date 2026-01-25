import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AlertTriangle, CloudRain, Sun, Users, Wind, Snowflake, Activity, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import alertsData from "@/data/alerts.json";

interface Alert {
  id: string;
  title: string;
  description: string;
  icon: string;
  risk: "low" | "medium" | "high" | "critical";
  confidence: number;
  timestamp: string;
  expectedImpact: string;
  affectedDepartments: string[];
  predictedCases: number;
  status: "active" | "monitoring" | "resolved";
}

const iconMap: Record<string, React.ElementType> = {
  Sun,
  Snowflake,
  Activity,
  CloudRain,
  Users,
  Wind,
};

const alerts: Alert[] = alertsData as Alert[];

const riskConfig = {
  low: { label: "Low Risk", className: "bg-status-low-bg text-status-low border-status-low/30" },
  medium: { label: "Medium Risk", className: "bg-status-medium-bg text-status-medium border-status-medium/30" },
  high: { label: "High Risk", className: "bg-status-high-bg text-status-high border-status-high/30" },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical border-status-critical/30" },
};

const statusConfig = {
  active: { label: "Active", className: "bg-status-high-bg text-status-high" },
  monitoring: { label: "Monitoring", className: "bg-status-medium-bg text-status-medium" },
  resolved: { label: "Resolved", className: "bg-muted text-muted-foreground" },
};

const ActiveAlerts = () => {
  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.risk === "critical" && a.status === "active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-status-high" />
              Active Alerts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-detected events with predicted ED impact
            </p>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-status-critical-bg rounded-lg border border-status-critical/20">
                <AlertTriangle className="w-4 h-4 text-status-critical" />
                <span className="text-sm font-medium text-status-critical">
                  {criticalCount} Critical Alert{criticalCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium text-primary">
                {activeCount} Active
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search alerts..." className="pl-9" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            All Status
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            All Risk Levels
          </Button>
        </div>

        {/* Alerts Grid */}
        <div className="grid gap-4">
          {alerts.map((alert) => {
            const risk = riskConfig[alert.risk];
            const status = statusConfig[alert.status];
            const AlertIcon = iconMap[alert.icon];

            return (
              <div
                key={alert.id}
                className={cn(
                  "bg-card rounded-xl border-2 p-5 transition-all hover:shadow-md",
                  alert.status === "resolved" ? "opacity-60 border-border" : risk.className.replace("bg-", "border-").split(" ")[0]
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Icon & Main Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn("p-3 rounded-xl", risk.className.split(" ")[0])}>
                      <AlertIcon className={cn("w-6 h-6", risk.className.split(" ")[1])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.className)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {alert.affectedDepartments.map((dept) => (
                          <span key={dept} className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6">
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", risk.className)}>
                        {risk.label}
                      </span>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                      <p className="text-lg font-bold text-foreground">{alert.confidence}%</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Predicted Cases</p>
                      <p className="text-lg font-bold text-foreground">{alert.predictedCases}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Expected Impact</p>
                      <p className="text-sm font-semibold text-status-high">{alert.expectedImpact}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Timing</p>
                      <p className="text-sm font-medium text-foreground">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActiveAlerts;
