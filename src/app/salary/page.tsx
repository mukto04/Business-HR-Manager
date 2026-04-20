import { SalaryClient } from "@/modules/salary/salary-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export default function SalaryPage() {
  return (
    <ServiceGuard id="payroll">
      <SalaryClient />
    </ServiceGuard>
  );
}
