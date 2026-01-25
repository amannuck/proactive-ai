import { AlertTriangle, Thermometer, CloudSnow, Zap, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Alert {
  id: string;
  event: string;
  prediction: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  icon: "weather" | "sports" | "outbreak" | "infrastructure";
  confidence: number;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    event: "FIFA World Cup Final + Heatwave Advisory",
    prediction: "Increased risk of heat stroke, dehydration, and alcohol-related incidents",
    riskLevel: "high",
    icon: "sports",
    confidence: 87,
  },
  {
    id: "2",
    event: "Severe Snowstorm Warning – 12-18 inches expected",
    prediction: "Increased trauma cases, motor vehicle injuries, and hypothermia",
    riskLevel: "critical",
    icon: "weather",
    confidence: 92,
  },
  {
    id: "3",
    event: "Regional Flu Outbreak – Cases up 40%",
    prediction: "Respiratory surge expected in 48-72 hours",
    riskLevel: "medium",
    icon: "outbreak",
    confidence: 78,
  },
];

const riskConfig = {
  low: {
    bgClass: "bg-status-low-bg",
    textClass: "text-status-low",
    borderClass: "border-status-low/30",
    label: "Low Risk",
  },
  medium: {
    bgClass: "bg-status-medium-bg",
    textClass: "text-status-medium",
    borderClass: "border-status-medium/30",
    label: "Medium Risk",
  },
  high: {
    bgClass: "bg-status-high-bg",
    textClass: "text-status-high",
    borderClass: "border-status-high/30",
    label: "High Risk",
  },
  critical: {
    bgClass: "bg-status-critical-bg",
    textClass: "text-status-critical",
    borderClass: "border-status-critical/30",
    label: "Critical",
  },
};

const iconComponents = {
  weather: CloudSnow,
  sports: Zap,
  outbreak: AlertTriangle,
  infrastructure: Info,
};

export function AlertBanner() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Active Alerts & Predictions</h2>
          <p className="text-sm text-muted-foreground">AI-detected events with predicted ED impact</p>
        </div>
        
        <Link to="/alerts" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all alerts
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {mockAlerts.map((alert, index) => {
          const config = riskConfig[alert.riskLevel];
          const IconComponent = iconComponents[alert.icon];
          
          return (
            <div
              key={alert.id}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 card-hover cursor-pointer",
                config.bgClass,
                config.borderClass,
                alert.riskLevel === "critical" && "animate-pulse-soft"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Risk Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                  config.bgClass,
                  config.textClass
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    alert.riskLevel === "critical" ? "bg-status-critical animate-ping" : config.textClass.replace("text-", "bg-")
                  )} 
                  style={{ backgroundColor: alert.riskLevel === "critical" ? undefined : "currentColor" }}
                  />
                  {config.label}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {alert.confidence}% confidence
                </span>
              </div>

              {/* Icon and Event */}
              <div className="flex gap-3">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                  config.textClass,
                  "bg-background/80"
                )}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                    {alert.event}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alert.prediction}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
