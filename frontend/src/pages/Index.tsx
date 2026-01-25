import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { SurgeForecast } from "@/components/dashboard/SurgeForecast";
import { RecommendedPurchases } from "@/components/dashboard/RecommendedPurchases";
import { StaffingForecast } from "@/components/dashboard/StaffingForecast";
import { InventorySnapshot } from "@/components/dashboard/InventorySnapshot";

const Index = () => {
  return (
    <DashboardLayout>
      <DashboardHeader />
      
      <div className="space-y-6">
        {/* Alert Banner - Top Priority */}
        <AlertBanner />

        {/* Surge Forecast Chart */}
        <SurgeForecast />

        {/* Two-column layout for Purchases and Inventory */}
        <div className="grid lg:grid-cols-2 gap-6">
          <RecommendedPurchases />
          <InventorySnapshot />
        </div>

        {/* Staffing Forecast - Full Width */}
        <StaffingForecast />
      </div>
    </DashboardLayout>
  );
};

export default Index;
