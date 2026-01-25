import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ===================== DATA ===================== */

const forecastData = [
  { time: "Now", hour: 0, total: 45, trauma: 8, respiratory: 12, heat: 5, infectious: 20, baseline: 35 },
  { time: "4h", hour: 4, total: 52, trauma: 10, respiratory: 14, heat: 8, infectious: 20, baseline: 35 },
  { time: "8h", hour: 8, total: 68, trauma: 15, respiratory: 18, heat: 12, infectious: 23, baseline: 35 },
  { time: "12h", hour: 12, total: 85, trauma: 22, respiratory: 20, heat: 18, infectious: 25, baseline: 35 },
  { time: "16h", hour: 16, total: 92, trauma: 28, respiratory: 22, heat: 20, infectious: 22, baseline: 35 },
  { time: "20h", hour: 20, total: 78, trauma: 20, respiratory: 20, heat: 16, infectious: 22, baseline: 35 },
  { time: "24h", hour: 24, total: 65, trauma: 14, respiratory: 18, heat: 12, infectious: 21, baseline: 35 },
  { time: "28h", hour: 28, total: 58, trauma: 12, respiratory: 16, heat: 10, infectious: 20, baseline: 35 },
  { time: "32h", hour: 32, total: 52, trauma: 10, respiratory: 15, heat: 8, infectious: 19, baseline: 35 },
  { time: "36h", hour: 36, total: 48, trauma: 9, respiratory: 14, heat: 6, infectious: 19, baseline: 35 },
  { time: "40h", hour: 40, total: 44, trauma: 8, respiratory: 13, heat: 5, infectious: 18, baseline: 35 },
  { time: "44h", hour: 44, total: 42, trauma: 7, respiratory: 12, heat: 5, infectious: 18, baseline: 35 },
  { time: "48h", hour: 48, total: 40, trauma: 7, respiratory: 12, heat: 4, infectious: 17, baseline: 35 },
];

const surgeThreshold = 70;

type RangeOption = "24h" | "48h" | "72h";

const timeRanges: { label: RangeOption; hours: number }[] = [
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "72h", hours: 72 },
];

const categories = [
  { key: "trauma", label: "Trauma", color: "hsl(var(--chart-trauma))" },
  { key: "respiratory", label: "Respiratory", color: "hsl(var(--chart-respiratory))" },
  { key: "heat", label: "Heat-related", color: "hsl(var(--chart-heat))" },
  { key: "infectious", label: "Infectious", color: "hsl(var(--chart-infectious))" },
];

/* ===================== TOOLTIP ===================== */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  const total = payload.find((p: any) => p.dataKey === "total")?.value ?? 0;
  const baseline = 35;
  const percentIncrease = Math.round(((total - baseline) / baseline) * 100);

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 min-w-[180px]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            percentIncrease > 50
              ? "bg-status-high-bg text-status-high"
              : percentIncrease > 20
              ? "bg-status-medium-bg text-status-medium"
              : "bg-status-low-bg text-status-low"
          )}
        >
          +{percentIncrease}% vs normal
        </span>
      </div>

      <div className="space-y-1.5">
        {payload
          .filter((p: any) => !["total", "baseline"].includes(p.dataKey))
          .map((entry: any) => (
            <div key={entry.dataKey} className="flex justify-between text-sm">
              <span className="capitalize text-muted-foreground">{entry.dataKey}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ===================== COMPONENT ===================== */

export function SurgeForecast() {
  const [timeRange, setTimeRange] = useState<RangeOption>("48h");

  const rangeHours = timeRanges.find((r) => r.label === timeRange)!.hours;

  const filteredData = useMemo(
    () => forecastData.filter((d) => d.hour <= rangeHours),
    [rangeHours]
  );

  const peakData = useMemo(
    () => filteredData.reduce((max, curr) => (curr.total > max.total ? curr : max), filteredData[0]),
    [filteredData]
  );

  const peakIncrease = Math.round(((peakData.total - 35) / 35) * 100);

  return (
    <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ED Surge Forecast
          </h2>
          <p className="text-sm text-muted-foreground">
            Predicted patient volume over the next {timeRange}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-status-high-bg rounded-lg">
            <Clock className="w-4 h-4 text-status-high" />
            <span className="text-sm font-medium text-status-high">
              Peak: {peakData.time} (+{peakIncrease}%)
            </span>
          </div>

          <div className="flex bg-muted rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => setTimeRange(range.label)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition",
                  timeRange === range.label
                    ? "bg-card shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              {categories.map((cat) => (
                <linearGradient key={cat.key} id={`gradient-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cat.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={surgeThreshold}
              stroke="hsl(var(--status-high))"
              strokeDasharray="4 4"
            />

            {categories.map((cat) => (
              <Area
                key={cat.key}
                type="monotone"
                dataKey={cat.key}
                stackId="1"
                stroke={cat.color}
                fill={`url(#gradient-${cat.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
