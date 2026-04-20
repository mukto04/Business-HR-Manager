import { MonthlySalaryClient } from "@/modules/monthly-salary/monthly-salary-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export default function MonthlySalaryPage() {
  return (
    <ServiceGuard id="payroll">
      <MonthlySalaryClient />
    </ServiceGuard>
  );
}
