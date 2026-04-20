import { LoansClient } from "@/modules/loans/loans-client";
import { ServiceGuard } from "@/components/shared/service-guard";

export default function LoansPage() {
  return (
    <ServiceGuard id="loans">
      <LoansClient />
    </ServiceGuard>
  );
}
