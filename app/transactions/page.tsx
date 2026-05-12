import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { MissingConfigPanel } from "@/components/setup/missing-config-panel";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getRequiredUser } from "@/lib/supabase/server";
import { getTransactionsPageData } from "@/lib/transactions/get-transactions-page-data";
import type { TransactionSearchParams } from "@/lib/types/finance";

type TransactionsPageProps = {
  searchParams: Promise<TransactionSearchParams>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  if (!hasSupabaseEnv()) {
    return <MissingConfigPanel />;
  }

  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const data = await getTransactionsPageData(user.id, resolvedSearchParams);
  const created = getSingleSearchParam(resolvedSearchParams.created) === "1";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,97,238,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_45%,_#e8f0f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-6 sm:pb-32 lg:px-10 lg:pb-10">
        <AppHeader
          activeHref="/transactions"
          description="Review confirmed income and expense entries, then narrow the list with lean filters when you need to focus."
          title="Transactions"
        />

        {created ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-[0_12px_30px_rgba(16,185,129,0.08)]">
            Transaction created successfully.
          </div>
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionFilters
              categories={data.categories}
              filters={data.filters}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Transaction history</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsTable
              currency={data.profile.preferredCurrency}
              transactions={data.transactions}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
