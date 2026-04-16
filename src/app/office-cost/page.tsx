import { OfficeCostClient } from "@/modules/office-cost/office-cost-client";

export const metadata = {
  title: "Office Cost - AppDevs HR",
  description: "Manage monthly office costs."
};

export default function OfficeCostPage() {
  return <OfficeCostClient />;
}
