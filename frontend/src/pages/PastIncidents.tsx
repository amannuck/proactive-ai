import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { History, AlertTriangle, TrendingUp, Calendar, Package, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getEvents, EventRow } from "@/lib/api";

interface PastIncident {
  event_id: string;
  event_type: string;
  severity_index: number;
  date: string;
  patient_volume_spike: number;
  top_clinical_categories: string[];
  critical_supplies_depleted: string[];
}

function mapEventToIncident(row: EventRow): PastIncident {
  return {
    event_id: row.event_id,
    event_type: row.event_type,
    severity_index: row.severity_index || 5,
    date: row.date,
    patient_volume_spike: row.patient_volume_spike || 0,
    top_clinical_categories: row.top_clinical_categories 
      ? String(row.top_clinical_categories).split(",").map(s => s.trim())
      : [],
    critical_supplies_depleted: row.critical_supplies_depleted
      ? String(row.critical_supplies_depleted).split(",").map(s => s.trim())
      : [],
  };
}

const severityConfig = {
  low: { label: "Low", className: "bg-status-low-bg text-status-low border-status-low/30", range: [1, 3] },
  medium: { label: "Medium", className: "bg-status-medium-bg text-status-medium border-status-medium/30", range: [4, 6] },
  high: { label: "High", className: "bg-status-high-bg text-status-high border-status-high/30", range: [7, 8] },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical border-status-critical/30", range: [9, 10] },
};

const getSeverityLevel = (index: number): keyof typeof severityConfig => {
  if (index <= 3) return "low";
  if (index <= 6) return "medium";
  if (index <= 8) return "high";
  return "critical";
};

const PastIncidents = () => {
  const { data: apiData, loading, error } = useApi(
    () => getEvents("2020-01-01", "2026-12-31"),
    []
  );

  const incidents: PastIncident[] = (apiData || []).map(mapEventToIncident);
  const sortedIncidents = [...incidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const avgSeverity = incidents.length > 0
    ? Math.round(incidents.reduce((sum, i) => sum + i.severity_index, 0) / incidents.length)
    : 0;
  const avgSpike = incidents.length > 0
    ? Math.round(incidents.reduce((sum, i) => sum + i.patient_volume_spike, 0) / incidents.length)
    : 0;
  const criticalEvents = incidents.filter((i) => i.severity_index >= 9).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading incidents...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load incidents: {error}</p>
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
              <History className="w-6 h-6 text-primary" />
              Past Incidents & Surge History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historical surge events and supply depletion patterns
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <History className="w-4 h-4" />
              <span className="text-xs font-medium">Total Events</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{incidents.length}</p>
            <p className="text-xs text-muted-foreground">recorded incidents</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Critical Events</span>
            </div>
            <p className="text-2xl font-bold text-status-critical">{criticalEvents}</p>
            <p className="text-xs text-muted-foreground">severity 9-10</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Volume Spike</span>
            </div>
            <p className="text-2xl font-bold text-status-high">+{avgSpike}%</p>
            <p className="text-xs text-muted-foreground">above baseline</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Severity</span>
            </div>
            <p className="text-2xl font-bold text-primary">{avgSeverity}/10</p>
            <p className="text-xs text-muted-foreground">severity index</p>
          </div>
        </div>

        {/* Incidents Timeline */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Historical Events</h2>
          </div>
          <div className="divide-y divide-border">
            {sortedIncidents.map((incident) => {
              const severityLevel = getSeverityLevel(incident.severity_index);
              const severity = severityConfig[severityLevel];

              return (
                <div key={incident.event_id} className="p-5 hover:bg-muted/30 transition-colors">
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", severity.className.includes("critical") ? "bg-status-critical" : severity.className.includes("high") ? "bg-status-high" : severity.className.includes("medium") ? "bg-status-medium" : "bg-status-low")} />
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{incident.event_type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(incident.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border", severity.className)}>
                        Severity {incident.severity_index}/10
                      </span>
                      <span className="px-3 py-1.5 bg-status-high-bg text-status-high rounded-full text-xs font-semibold">
                        +{incident.patient_volume_spike}% Volume
                      </span>
                    </div>
                  </div>

                  {/* Clinical Categories */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Top Clinical Categories:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {incident.top_clinical_categories.map((category) => (
                        <span
                          key={category}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Critical Supplies Depleted */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-status-critical" />
                      <span className="text-xs font-medium text-muted-foreground">Critical Supplies Depleted:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {incident.critical_supplies_depleted.map((supply) => (
                        <span
                          key={supply}
                          className="px-3 py-1 bg-status-critical-bg text-status-critical rounded-lg text-sm font-medium border border-status-critical/20"
                        >
                          {supply}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PastIncidents;
