import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/contexts/BudgetContext";
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import PendingPurchases from "./pages/PendingPurchases";
import Staffing from "./pages/Staffing";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ActiveAlerts from "./pages/ActiveAlerts";
import SurgeTimeline from "./pages/SurgeTimeline";
import Suppliers from "./pages/Suppliers";
import PastIncidents from "./pages/PastIncidents";
import Budget from "./pages/Budget";
import Patients from "./pages/Patients";
import EDHourlyFacts from "./pages/EDHourlyFacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BudgetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/alerts" element={<ActiveAlerts />} />
            <Route path="/surge-timeline" element={<SurgeTimeline />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/pending-purchases" element={<PendingPurchases />} />
            <Route path="/staffing" element={<Staffing />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/past-incidents" element={<PastIncidents />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/ed-hourly" element={<EDHourlyFacts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BudgetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
