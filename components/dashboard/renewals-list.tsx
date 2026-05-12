import { EmptyStatePanel } from "@/components/dashboard/empty-state-panel";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import type { UpcomingRenewalItem } from "@/lib/types/finance";

type RenewalsListProps = {
  currency: string;
  renewals: UpcomingRenewalItem[];
};

export function RenewalsList({ currency, renewals }: RenewalsListProps) {
  if (renewals.length === 0) {
    return (
      <EmptyStatePanel
        title="No renewals queued"
        description="Active subscriptions with scheduled or due billings will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {renewals.map((renewal) => (
        <article
          key={renewal.id}
          className="rounded-[1.35rem] border border-slate-200/75 bg-white/80 px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {renewal.subscriptionName}
                </h3>
                <Badge variant={renewal.status === "due" ? "expense" : "outline"}>
                  {renewal.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                Renews {formatShortDate(renewal.billingDate)}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(renewal.amount, currency)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
