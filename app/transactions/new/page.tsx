import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { MissingConfigPanel } from "@/components/setup/missing-config-panel";
import { TransactionEntryTabs } from "@/components/transactions/transaction-entry-tabs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getRequiredUser } from "@/lib/supabase/server";
import { getTransactionFormData } from "@/lib/transactions/get-transactions-page-data";

export default async function NewTransactionPage() {
  if (!hasSupabaseEnv()) {
    return <MissingConfigPanel />;
  }

  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const { categories, profile, pendingReceipts } = await getTransactionFormData(
    user.id,
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,97,238,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_45%,_#e8f0f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-6 sm:pb-32 lg:px-10 lg:pb-10">
        <AppHeader
          activeHref="/transactions/new"
          description="Add a transaction manually or paste multiple Arabic SMS receipts, review the parser output, and confirm only the entries that should affect your balance."
          title="Add a transaction"
        />

        <TransactionEntryTabs
          categories={categories}
          pendingReceipts={pendingReceipts}
          profile={profile}
        />
      </div>
    </main>
  );
}
