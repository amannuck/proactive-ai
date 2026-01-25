import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Calendar, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getStaffDay, StaffShiftRow } from "@/lib/api";

interface ShiftBlock {
  role: string;
  current: number;
  needed: number;
  onCall: number;
}

interface TimeSlot {
  time: string;
  date: string;
  severity: "normal" | "moderate" | "high" | "critical";
  shifts: ShiftBlock[];
}

function mapStaffDataToTimeSlots(data: StaffShiftRow[]): TimeSlot[] {
  const shiftTimeMap: Record<string, StaffShiftRow[]> = {};
  
  data.forEach((row) => {
    const key = row.shift_time || "Day";
    if (!shiftTimeMap[key]) shiftTimeMap[key] = [];
    shiftTimeMap[key].push(row);
  });

  return Object.entries(shiftTimeMap).map(([shiftTime, rows]) => {
    const shifts: ShiftBlock[] = rows.map((row) => ({
      role: row.role,
      current: row.actual_available || 0,
      needed: row.scheduled_count || 0,
      onCall: row.on_call_available || 0,
    }));

    const totalShortage = rows.reduce((sum, r) => sum + (r.shortage || 0), 0);
    let severity: TimeSlot["severity"] = "normal";
    if (totalShortage > 10) severity = "critical";
    else if (totalShortage > 5) severity = "high";
    else if (totalShortage > 0) severity = "moderate";

    return {
      time: shiftTime,
      date: rows[0]?.date || "Today",
      severity,
      shifts,
    };
  });
}

const severityConfig = {
  normal: { label: "Normal", className: "bg-status-low-bg text-status-low border-status-low/30" },
  moderate: { label: "Moderate", className: "bg-status-medium-bg text-status-medium border-status-medium/30" },
  high: { label: "High Demand", className: "bg-status-high-bg text-status-high border-status-high/30" },
  critical: { label: "Critical", className: "bg-status-critical-bg text-status-critical border-status-critical/30" },
};

const Staffing = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: apiData, loading, error } = useApi(() => getStaffDay(selectedDate), [selectedDate]);

  const scheduleData: TimeSlot[] = apiData ? mapStaffDataToTimeSlots(apiData) : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading staffing data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load staffing: {error}</p>
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
              <Users className="w-6 h-6 text-primary" />
              Staffing Schedule
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage shifts and on-call staff based on predicted demand
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
            <Button className="gap-2">
              Activate On-Call Staff
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="space-y-4">
          {scheduleData.map((slot, index) => {
            const severity = severityConfig[slot.severity];
            const totalNeeded = slot.shifts.reduce((sum, s) => sum + s.needed, 0);
            const totalCurrent = slot.shifts.reduce((sum, s) => sum + s.current, 0);
            const gap = totalNeeded - totalCurrent;

            return (
              <div
                key={index}
                className={cn(
                  "bg-card rounded-xl border-2 overflow-hidden transition-all",
                  severity.className.replace("bg-", "border-").split(" ")[0],
                  "border-opacity-50"
                )}
              >
                {/* Slot Header */}
                <div className={cn("p-4 border-b border-border", severity.className.split(" ")[0])}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold text-foreground">{slot.time}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{slot.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", severity.className)}>
                        {severity.label}
                      </span>
                      {gap > 0 && (
                        <span className="flex items-center gap-1 text-sm font-medium text-status-high">
                          <AlertTriangle className="w-4 h-4" />
                          {gap} staff gap
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shift Grid */}
                <div className="p-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {slot.shifts.map((shift, shiftIndex) => {
                      const isFilled = shift.current >= shift.needed;
                      const shortage = shift.needed - shift.current;

                      return (
                        <div
                          key={shiftIndex}
                          className={cn(
                            "p-3 rounded-lg border",
                            isFilled ? "bg-status-low-bg/30 border-status-low/30" : "bg-muted/30 border-border"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">{shift.role}</span>
                            {isFilled ? (
                              <CheckCircle2 className="w-4 h-4 text-status-low" />
                            ) : (
                              <span className="text-xs font-medium text-status-high">+{shortage}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {shift.current} / {shift.needed} scheduled
                            </span>
                            <span className="text-xs text-primary font-medium">
                              {shift.onCall} on-call
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

export default Staffing;
