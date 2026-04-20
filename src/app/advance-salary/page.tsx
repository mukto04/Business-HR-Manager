import { AdvanceSalaryClient } from "@/modules/advance-salary/advance-salary-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export default function AdvanceSalaryPage() {
  return (
    <ServiceGuard id="advances">
      <AdvanceSalaryClient />
    </ServiceGuard>
  );
}
