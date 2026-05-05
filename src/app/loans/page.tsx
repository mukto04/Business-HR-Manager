import { LoansClient } from "@/modules/loans/loans-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export default function LoansPage() {
  return (
    <ServiceGuard id="finance">
      <LoansClient />
    </ServiceGuard>
  );
}
