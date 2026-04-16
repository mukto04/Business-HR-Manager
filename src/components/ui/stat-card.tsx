import { LucideIcon } from "lucide-react";
import { Card } from "./card";

export function StatCard({
  title,
  value,
  icon: Icon,
  helper
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  helper?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
