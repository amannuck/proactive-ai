import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DollarSign, TrendingDown, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBudget } from "@/contexts/BudgetContext";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrencyCompact } from "@/lib/format";


const Budget = () => {
  const {
    annualBudget,
    setAnnualBudget,
    historicalSpending,
    currentYearSpending,
    currentMonth,
    remainingBudget,
  } = useBudget();

  const [budgetInput, setBudgetInput] = useState<string>(annualBudget.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleBudgetUpdate = () => {
    const newBudget = parseFloat(budgetInput.replace(/,/g, ""));
    if (!isNaN(newBudget) && newBudget > 0) {
      setAnnualBudget(newBudget);
      setIsEditing(false);
    }
  };


  const chartData = historicalSpending.map((hist, index) => ({
    month: hist.month,
    historical: hist.remaining,
    current: index <= currentMonth ? currentYearSpending[index].remaining : null,
  }));

  const totalSpentThisYear = annualBudget - remainingBudget;
  const historicalSpentAtCurrentMonth = annualBudget - historicalSpending[currentMonth].remaining;
  const variance = totalSpentThisYear - historicalSpentAtCurrentMonth;
  const variancePercentage = ((variance / historicalSpentAtCurrentMonth) * 100).toFixed(1);

  const isOverBudget = variance > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Budget Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track annual budget usage and compare against historical spending patterns
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Budget Input Card */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Annual Budget
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="text"
                      value={budgetInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setBudgetInput(value);
                      }}
                      className="pl-7 text-lg font-bold"
                      placeholder="Enter annual budget"
                    />
                  </div>
                  <Button onClick={handleBudgetUpdate} size="sm">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBudgetInput(annualBudget.toString());
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrencyCompact(annualBudget)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-primary hover:text-primary"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Remaining Budget</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrencyCompact(remainingBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((remainingBudget / annualBudget) * 100).toFixed(1)}% of annual
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Spent This Year</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrencyCompact(totalSpentThisYear)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Through {chartData[currentMonth].month}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Historical Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrencyCompact(historicalSpentAtCurrentMonth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Same period last year</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {isOverBudget ? (
                <AlertCircle className="w-4 h-4 text-status-high" />
              ) : (
                <TrendingUp className="w-4 h-4 text-status-low" />
              )}
              <span className="text-xs font-medium">Variance</span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                isOverBudget ? "text-status-high" : "text-status-low"
              )}
            >
              {isOverBudget ? "+" : ""}
              {formatCurrencyCompact(Math.abs(variance))}
            </p>
            <p className={cn("text-xs mt-1", isOverBudget ? "text-status-high" : "text-status-low")}>
              {isOverBudget ? "+" : ""}
              {variancePercentage}% vs historical
            </p>
          </div>
        </div>

        {/* Budget Comparison Chart */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Budget Usage Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Historical spending pattern vs current year actual spending
            </p>
          </div>
          <div className="p-5">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-baseline))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--chart-baseline))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrencyCompact(value)}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="hsl(var(--chart-baseline))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Historical Projected Budget"
                    fill="url(#historicalGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, index, key } = props;
                      if (index === currentMonth) {
                        return (
                          <circle
                            key={key || `dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="hsl(var(--primary))"
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                    name="Current Year Actual Spending"
                    connectNulls={false}
                    fill="url(#currentGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Budget Insights</h3>
          <div className="space-y-3">
            {isOverBudget ? (
              <div className="flex items-start gap-3 p-3 bg-status-high-bg rounded-lg border border-status-high/20">
                <AlertCircle className="w-5 h-5 text-status-high mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-status-high">Over Historical Budget</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current spending is {formatCurrencyCompact(Math.abs(variance))} ({variancePercentage}%) higher
                    than historical average. Consider reviewing recent purchases and identifying
                    cost-saving opportunities.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-status-low-bg rounded-lg border border-status-low/20">
                <TrendingUp className="w-5 h-5 text-status-low mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-status-low">Under Historical Budget</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current spending is {formatCurrencyCompact(Math.abs(variance))} ({Math.abs(parseFloat(variancePercentage))}%) lower
                    than historical average. Good cost management! Funds may be available for
                    strategic investments.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Projected Year-End Budget</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on current spending trends, estimated remaining budget at year-end:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrencyCompact(
                      remainingBudget -
                        (totalSpentThisYear / (currentMonth + 1)) * (12 - currentMonth - 1)
                    )}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Budget;
