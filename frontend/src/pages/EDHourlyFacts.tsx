import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { getEDHourlyPaginated, EDHourlyRow, PaginatedResult } from "@/lib/api";

const EDHourlyFacts = () => {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("2020-01-01");
  const [dateTo, setDateTo] = useState("2020-12-31");
  const limit = 50;

  const { data, loading, error, refetch } = useApi<PaginatedResult<EDHourlyRow>>(
    () => getEDHourlyPaginated(dateFrom, dateTo, page, limit),
    [page, dateFrom, dateTo]
  );

  const handleDateFilter = () => {
    setPage(1);
    refetch();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading ED hourly data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load ED data: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const records = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              ED Hourly Facts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Emergency Department hourly metrics and statistics
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{total}</span> records
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleDateFilter} className="gap-2">
              <Calendar className="w-4 h-4" />
              Apply Filter
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Hour</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Arrivals</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Departures</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Ambulance</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Waiting</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">In Treatment</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Boarding</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">MDs</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Nurses</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Bed %</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Wait (min)</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-muted-foreground">
                      No records found for the selected date range
                    </td>
                  </tr>
                ) : (
                  records.map((row, idx) => (
                    <tr key={`${row.ts}-${idx}`} className="border-b border-border hover:bg-muted/20">
                      <td className="p-3 text-sm font-medium text-foreground">{row.date}</td>
                      <td className="p-3 text-sm text-foreground">{row.hour}:00</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.arrivals_last_hour ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.departures_last_hour ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.ambulance_arrivals ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.waiting_patients ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.patients_in_treatment ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.admitted_patients_boarding ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.md_count ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">{row.nurse_count ?? "-"}</td>
                      <td className="p-3 text-sm text-right text-foreground">
                        {row.bed_occupancy_pct != null ? `${row.bed_occupancy_pct.toFixed(1)}%` : "-"}
                      </td>
                      <td className="p-3 text-sm text-right text-foreground">{row.longest_wait_time_min ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} total records)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EDHourlyFacts;
