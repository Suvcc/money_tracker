import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { EmptyStatePanel } from "@/components/dashboard/empty-state-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentTransactionsList } from "@/components/dashboard/recent-transactions-list";
import { RenewalsList } from "@/components/dashboard/renewals-list";
import { SpendingOverviewChart } from "@/components/dashboard/spending-overview-chart";
import { MissingConfigPanel } from "@/components/setup/missing-config-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getRequiredUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return <MissingConfigPanel />;
  }

  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData(user.id);

  const {
    summary,
    spendingTrend,
    categoryBreakdown,
    recentTransactions,
    upcomingRenewals,
    profile,
    period,
  } = dashboardData;

  const hasChartData = spendingTrend.some(
    (entry) => entry.expenseAmount > 0 || entry.incomeAmount > 0,
  );
  const hasCategoryData = categoryBreakdown.length > 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(67,97,238,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4f8_45%,_#e8f0f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-6 sm:pb-32 lg:px-10 lg:pb-10">
        <AppHeader
          activeHref="/dashboard"
          description={`This view blends confirmed cash movement with next subscription obligations for ${period.label} in ${profile.timezone}.`}
          title={`${period.label} at a glance${profile.fullName ? `, ${profile.fullName.trim().split(/\s+/)[0]}` : ""}.`}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Spent this month"
            value={formatCurrency(summary.expenseTotal, profile.preferredCurrency)}
            tone="expense"
            description="Confirmed expense transactions inside the current month."
          />
          <MetricCard
            label="Income this month"
            value={formatCurrency(summary.incomeTotal, profile.preferredCurrency)}
            tone="income"
            description="Confirmed income transactions inside the current month."
          />
          <MetricCard
            label="Net balance"
            value={formatCurrency(summary.netBalance, profile.preferredCurrency)}
            tone={summary.netBalance >= 0 ? "income" : "expense"}
            description="Income minus expenses for the current month."
          />
          <MetricCard
            label="Subscription load"
            value={formatCurrency(
              summary.monthlySubscriptionTotal,
              profile.preferredCurrency,
            )}
            tone="neutral"
            description="Normalized monthly cost of active subscriptions."
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Monthly cash flow</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData ? (
                <SpendingOverviewChart
                  currency={profile.preferredCurrency}
                  data={spendingTrend}
                />
              ) : (
                <EmptyStatePanel
                  title="No transaction trend yet"
                  description="Once expenses or income are added this month, the daily cash-flow chart will appear here."
                />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Expense categories</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCategoryData ? (
                <CategoryBreakdownChart
                  currency={profile.preferredCurrency}
                  data={categoryBreakdown}
                />
              ) : (
                <EmptyStatePanel
                  title="No category breakdown yet"
                  description="Add expense transactions with categories to see where the month is going."
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactionsList
                currency={profile.preferredCurrency}
                transactions={recentTransactions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upcoming renewals</CardTitle>
            </CardHeader>
            <CardContent>
              <RenewalsList
                currency={profile.preferredCurrency}
                renewals={upcomingRenewals}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
