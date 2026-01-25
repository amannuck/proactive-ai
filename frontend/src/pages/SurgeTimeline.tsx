import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, TrendingUp, AlertTriangle, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import surgeTimelineData from "@/data/surgeTimeline.json";

interface TimeSlot {
  time: string;
  date: string;
  expectedVolume: number;
  baselineVolume: number;
  surgeLevel: "normal" | "elevated" | "high" | "critical";
  primaryCauses: string[];
  staffingStatus: "adequate" | "shortage" | "critical";
  confidence: number;
}

const timelineData: TimeSlot[] = surgeTimelineData as TimeSlot[];

const surgeLevelConfig = {
  normal: { label: "Normal", className: "bg-status-low-bg text-status-low border-status-low/30", barColor: "bg-status-low" },
  elevated: { label: "Elevated", className: "bg-status-medium-bg text-status-medium border-status-medium/30", barColor: "bg-status-medium" },
  high: { label: "High", className: "bg-status-high-bg text-status-high border-status-high/30", barColor: "bg-status-high" },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical border-status-critical/30", barColor: "bg-status-critical" },
};

const staffingConfig = {
  adequate: { label: "Adequate", className: "text-status-low" },
  shortage: { label: "Shortage", className: "text-status-high" },
  critical: { label: "Critical Gap", className: "text-status-critical" },
};

const SurgeTimeline = () => {
  const criticalSlots = timelineData.filter((s) => s.surgeLevel === "critical").length;
  const maxVolume = Math.max(...timelineData.map((s) => s.expectedVolume));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Surge Timeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Full 48-hour ED volume forecast with staffing alignment
            </p>
          </div>
          <div className="flex items-center gap-3">
            {criticalSlots > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-status-critical-bg rounded-lg border border-status-critical/20">
                <AlertTriangle className="w-4 h-4 text-status-critical" />
                <span className="text-sm font-medium text-status-critical">
                  {criticalSlots} Critical Period{criticalSlots > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              View Calendar
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Peak Volume</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{maxVolume}</p>
            <p className="text-xs text-muted-foreground">patients/hour</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Critical Windows</span>
            </div>
            <p className="text-2xl font-bold text-status-critical">{criticalSlots}</p>
            <p className="text-xs text-muted-foreground">time slots</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Staff Shortages</span>
            </div>
            <p className="text-2xl font-bold text-status-high">
              {timelineData.filter((s) => s.staffingStatus !== "adequate").length}
            </p>
            <p className="text-xs text-muted-foreground">periods affected</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {Math.round(timelineData.reduce((sum, s) => sum + s.confidence, 0) / timelineData.length)}%
            </p>
            <p className="text-xs text-muted-foreground">prediction accuracy</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">48-Hour Forecast</h2>
          </div>
          <div className="divide-y divide-border">
            {timelineData.map((slot, index) => {
              const surge = surgeLevelConfig[slot.surgeLevel];
              const staffing = staffingConfig[slot.staffingStatus];
              const volumePercent = (slot.expectedVolume / maxVolume) * 100;
              const increasePercent = Math.round(((slot.expectedVolume - slot.baselineVolume) / slot.baselineVolume) * 100);

              return (
                <div key={index} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Time & Date */}
                    <div className="flex items-center gap-3 lg:w-48">
                      <div className={cn("w-3 h-3 rounded-full", surge.barColor)} />
                      <div>
                        <p className="font-medium text-foreground">{slot.time}</p>
                        <p className="text-xs text-muted-foreground">{slot.date}</p>
                      </div>
                    </div>

                    {/* Volume Bar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {slot.expectedVolume} patients
                        </span>
                        <span className={cn("text-xs font-medium", increasePercent > 50 ? "text-status-high" : "text-muted-foreground")}>
                          +{increasePercent}% vs baseline
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", surge.barColor)}
                          style={{ width: `${volumePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Surge Level */}
                    <div className="lg:w-28">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", surge.className)}>
                        {surge.label}
                      </span>
                    </div>

                    {/* Staffing Status */}
                    <div className="lg:w-28 flex items-center gap-2">
                      <Users className={cn("w-4 h-4", staffing.className)} />
                      <span className={cn("text-sm font-medium", staffing.className)}>
                        {staffing.label}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div className="lg:w-20 text-right">
                      <p className="text-sm font-medium text-foreground">{slot.confidence}%</p>
                      <p className="text-xs text-muted-foreground">confidence</p>
                    </div>
                  </div>

                  {/* Causes */}
                  <div className="mt-3 flex flex-wrap gap-2 lg:ml-[60px]">
                    {slot.primaryCauses.map((cause) => (
                      <span key={cause} className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                        {cause}
                      </span>
                    ))}
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

export default SurgeTimeline;
