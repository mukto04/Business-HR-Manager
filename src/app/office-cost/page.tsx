import { OfficeCostClient } from "@/modules/office-cost/office-cost-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export const metadata = {
  title: "Office Cost - AppDevs HR",
  description: "Manage monthly office costs."
};

export default function OfficeCostPage() {
  return (
    <ServiceGuard id="costs">
      <OfficeCostClient />
    </ServiceGuard>
  );
}
