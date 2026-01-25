import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Search, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getPatients, PatientRow, PaginatedResult } from "@/lib/api";

const triageLevelConfig: Record<number, { label: string; className: string }> = {
  1: { label: "Resuscitation", className: "bg-status-critical-bg text-status-critical" },
  2: { label: "Emergent", className: "bg-status-high-bg text-status-high" },
  3: { label: "Urgent", className: "bg-status-medium-bg text-status-medium" },
  4: { label: "Less Urgent", className: "bg-status-low-bg text-status-low" },
  5: { label: "Non-Urgent", className: "bg-muted text-muted-foreground" },
};

const Patients = () => {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const limit = 20;

  const { data, loading, error, refetch } = useApi<PaginatedResult<PatientRow>>(
    () => getPatients(page, limit, dateFrom || undefined, dateTo || undefined),
    [page, dateFrom, dateTo]
  );

  const handleDateFilter = () => {
    setPage(1);
    refetch();
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading patients...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="w-8 h-8 text-status-critical mb-2" />
          <p className="text-status-critical">Failed to load patients: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const patients = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Patient Data
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View patient encounters and clinical data
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{total}</span> patients
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
              Filter
            </Button>
            {(dateFrom || dateTo) && (
              <Button variant="outline" onClick={clearDateFilter}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">OHIP</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Admission</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Age/Sex</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Triage</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Arrival</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No patients found
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => {
                    const triage = triageLevelConfig[patient.triage_level || 5] || triageLevelConfig[5];
                    return (
                      <tr key={patient.encounter_id} className="border-b border-border hover:bg-muted/20">
                        <td className="p-4 text-sm font-medium text-foreground">
                          #{patient.encounter_id}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground font-mono">
                          {patient.ohip_number || "N/A"}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {patient.ts_admit ? new Date(patient.ts_admit).toLocaleString() : "N/A"}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {patient.age || "?"} / {patient.sex || "?"}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {patient.clinical_category || "Unknown"}
                        </td>
                        <td className="p-4">
                          <span className={cn("px-2 py-1 rounded text-xs font-medium", triage.className)}>
                            {triage.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {patient.arrival_mode || "Walk-in"}
                        </td>
                        <td className="p-4">
                          {patient.critical_condition ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-status-critical-bg text-status-critical">
                              Critical
                            </span>
                          ) : patient.ts_discharge ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-status-low-bg text-status-low">
                              Discharged
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-status-medium-bg text-status-medium">
                              In Treatment
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
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

export default Patients;
