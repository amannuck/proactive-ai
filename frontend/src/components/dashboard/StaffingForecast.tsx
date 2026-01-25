import { Users, TrendingUp, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {Link} from "react-router-dom"
interface StaffRole {
  id: string;
  role: string;
  current: number;
  needed: number;
  change: number;
  changeType: "increase" | "decrease" | "stable";
}

interface SurgeWindow {
  id: string;
  startTime: string;
  duration: string;
  severity: "moderate" | "high" | "critical";
  additionalStaff: number;
}

const staffingData: StaffRole[] = [
  { id: "1", role: "ER Physicians", current: 8, needed: 12, change: 50, changeType: "increase" },
  { id: "2", role: "Trauma Nurses", current: 15, needed: 22, change: 47, changeType: "increase" },
  { id: "3", role: "Respiratory Therapists", current: 4, needed: 7, change: 75, changeType: "increase" },
  { id: "4", role: "Support Staff", current: 12, needed: 16, change: 33, changeType: "increase" },
];

const surgeWindows: SurgeWindow[] = [
  { id: "1", startTime: "Today 6:00 PM", duration: "8 hours", severity: "high", additionalStaff: 15 },
  { id: "2", startTime: "Tomorrow 2:00 PM", duration: "12 hours", severity: "critical", additionalStaff: 22 },
  { id: "3", startTime: "Day 3 10:00 AM", duration: "6 hours", severity: "moderate", additionalStaff: 8 },
];

const severityConfig = {
  moderate: {
    label: "Moderate",
    className: "bg-status-medium-bg text-status-medium border-status-medium/30",
  },
  high: {
    label: "High",
    className: "bg-status-high-bg text-status-high border-status-high/30",
  },
  critical: {
    label: "Critical",
    className: "bg-status-critical-bg text-status-critical border-status-critical/30",
  },
};

export function StaffingForecast() {
  const totalCurrentStaff = staffingData.reduce((sum, s) => sum + s.current, 0);
  const totalNeededStaff = staffingData.reduce((sum, s) => sum + s.needed, 0);
  const totalAdditionalNeeded = totalNeededStaff - totalCurrentStaff;
  const aiConfidence = 89;

  return (
    <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Staffing Forecast
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Predicted staffing needs for anticipated surge
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg">
          <span className="text-sm font-medium text-accent-foreground">
            AI Confidence: {aiConfidence}%
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Staffing by Role */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Staffing by Role</h3>
            <div className="flex items-center gap-1.5 text-status-high">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+{totalAdditionalNeeded} needed</span>
            </div>
          </div>

          <div className="space-y-4">
            {staffingData.map((staff) => {
              const percentNeeded = (staff.current / staff.needed) * 100;
              const shortage = staff.needed - staff.current;

              return (
                <div key={staff.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{staff.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {staff.current} / {staff.needed}
                      </span>
                      {shortage > 0 && (
                        <span className="text-xs font-medium text-status-high">
                          +{shortage} needed
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={percentNeeded} className="h-2" />
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Total Additional Staff Needed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on predicted patient volume
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">+{totalAdditionalNeeded}</p>
                <p className="text-xs text-muted-foreground">personnel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Surge Timeline */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm">Surge Timeline</h3>
            <Link to="/surge-timeline" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              View full schedule
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {surgeWindows.map((window) => {
              const severity = severityConfig[window.severity];

              return (
                <div
                  key={window.id}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    severity.className
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium text-sm">{window.startTime}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {severity.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-80">Duration: {window.duration}</span>
                    <span className="font-semibold">+{window.additionalStaff} staff</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action callout */}
          <div className="mt-4 p-3 rounded-lg bg-status-medium-bg border border-status-medium/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-medium shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-status-medium">Call-in Recommended</p>
              <p className="text-xs text-status-medium/80 mt-0.5">
                Consider activating on-call staff for tomorrow's critical surge window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
