import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart3, TrendingUp, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import analyticsData from "@/data/analytics.json";

const { weeklyData, categoryData, accuracyData } = analyticsData;

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Analytics & History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historical data and AI prediction accuracy metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Total Patients (Week)</p>
            <p className="text-3xl font-bold text-foreground mt-1">1,234</p>
            <div className="flex items-center gap-1 mt-2 text-status-low text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+12% vs last week</span>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Avg Wait Time</p>
            <p className="text-3xl font-bold text-foreground mt-1">24 min</p>
            <div className="flex items-center gap-1 mt-2 text-status-low text-sm">
              <TrendingUp className="w-4 h-4 rotate-180" />
              <span>-8% improvement</span>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
            <p className="text-3xl font-bold text-primary mt-1">94%</p>
            <div className="flex items-center gap-1 mt-2 text-status-low text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+2% this month</span>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Surge Events Predicted</p>
            <p className="text-3xl font-bold text-foreground mt-1">7</p>
            <p className="text-sm text-muted-foreground mt-2">5 correctly handled</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Volume Chart */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Weekly Patient Volume</h3>
              <p className="text-sm text-muted-foreground">Actual vs Predicted</p>
            </div>
            <div className="p-5">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="patients" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradientActual)" name="Actual" />
                    <Area type="monotone" dataKey="predicted" stroke="hsl(var(--chart-baseline))" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Predicted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Case Categories</h3>
              <p className="text-sm text-muted-foreground">Distribution by type</p>
            </div>
            <div className="p-5">
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-muted-foreground">{cat.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Trend */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">AI Prediction Accuracy Trend</h3>
            <p className="text-sm text-muted-foreground">6-month rolling accuracy</p>
          </div>
          <div className="p-5">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
