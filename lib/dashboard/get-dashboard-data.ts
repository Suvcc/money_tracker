import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CategoryBreakdownDatum,
  DashboardData,
  FinanceProfile,
  SpendingTrendDatum,
  TransactionRow,
  UpcomingRenewalItem,
} from "@/lib/types/finance";

const RECENT_TRANSACTIONS_LIMIT = 8;
const UPCOMING_RENEWALS_LIMIT = 5;

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  const profile = await getProfile(supabase, userId);
  const period = getCurrentMonthWindow(profile.timezone);

  const [
    transactions,
    recentTransactions,
    activeSubscriptions,
    upcomingRenewals,
    categories,
  ] = await Promise.all([
    getMonthTransactions(supabase, userId, period.startDate, period.endDate),
    getRecentTransactions(supabase, userId),
    getActiveSubscriptions(supabase, userId),
    getUpcomingRenewals(supabase, userId, period.todayDate),
    getCategories(supabase, userId),
  ]);

  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const spendingTrend = buildSpendingTrend(period.startDate, period.endDate, transactions);
  const categoryBreakdown = buildCategoryBreakdown(transactions, categoryNameById);

  const expenseTotal = sumTransactions(transactions, "expense");
  const incomeTotal = sumTransactions(transactions, "income");
  const monthlySubscriptionTotal = activeSubscriptions.reduce((total, subscription) => {
    return total + normalizeMonthlyAmount(subscription.amount, subscription.billing_cycle, subscription.interval_count);
  }, 0);

  return {
    profile,
    period: {
      startDate: period.startDate,
      endDate: period.endDate,
      todayDate: period.todayDate,
      label: period.label,
    },
    summary: {
      expenseTotal,
      incomeTotal,
      netBalance: incomeTotal - expenseTotal,
      monthlySubscriptionTotal,
    },
    spendingTrend,
    categoryBreakdown,
    recentTransactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      merchantName: transaction.merchant_name,
      note: transaction.note,
      transactionDate: transaction.transaction_date,
      categoryName: transaction.category_id
        ? categoryNameById.get(transaction.category_id) ?? null
        : null,
      sourceLabel: prettifySource(transaction.source),
    })),
    upcomingRenewals,
  };
}

async function getProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<FinanceProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, preferred_currency, timezone")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  return {
    fullName: data.full_name,
    preferredCurrency: data.preferred_currency ?? "SAR",
    timezone: data.timezone ?? "Asia/Riyadh",
  };
}

async function getMonthTransactions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, merchant_name, note, transaction_date, category_id, source",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: true });

  if (error) {
    throw new Error(`Unable to load month transactions: ${error.message}`);
  }

  return (data ?? []) as TransactionRow[];
}

async function getRecentTransactions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, amount, type, merchant_name, note, transaction_date, category_id, source",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .limit(RECENT_TRANSACTIONS_LIMIT);

  if (error) {
    throw new Error(`Unable to load recent transactions: ${error.message}`);
  }

  return (data ?? []) as TransactionRow[];
}

async function getCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }

  return data ?? [];
}

async function getActiveSubscriptions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("amount, billing_cycle, interval_count")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Unable to load subscriptions: ${error.message}`);
  }

  return data ?? [];
}

async function getUpcomingRenewals(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  todayDate: string,
): Promise<UpcomingRenewalItem[]> {
  const { data, error } = await supabase
    .from("subscription_billings")
    .select(
      "id, amount, billing_date, status, subscriptions(name, deleted_at, status)",
    )
    .eq("user_id", userId)
    .in("status", ["scheduled", "due"])
    .gte("billing_date", todayDate)
    .order("billing_date", { ascending: true })
    .limit(UPCOMING_RENEWALS_LIMIT);

  if (error) {
    throw new Error(`Unable to load upcoming renewals: ${error.message}`);
  }

  return (data ?? [])
    .map((billing) => {
      const subscription = Array.isArray(billing.subscriptions)
        ? billing.subscriptions[0]
        : billing.subscriptions;

      return {
        billing,
        subscription,
      };
    })
    .filter(({ subscription }) => subscription && !subscription.deleted_at)
    .map(({ billing, subscription }) => ({
      id: billing.id,
      amount: billing.amount,
      billingDate: billing.billing_date,
      status: billing.status,
      subscriptionName: subscription?.name ?? "Subscription",
    }));
}

function sumTransactions(transactions: TransactionRow[], type: "expense" | "income") {
  return transactions.reduce((total, transaction) => {
    return transaction.type === type ? total + transaction.amount : total;
  }, 0);
}

function buildSpendingTrend(
  startDate: string,
  endDate: string,
  transactions: TransactionRow[],
): SpendingTrendDatum[] {
  const totalsByDate = new Map<
    string,
    { expenseAmount: number; incomeAmount: number }
  >();

  for (const transaction of transactions) {
    const current = totalsByDate.get(transaction.transaction_date) ?? {
      expenseAmount: 0,
      incomeAmount: 0,
    };

    if (transaction.type === "expense") {
      current.expenseAmount += transaction.amount;
    } else {
      current.incomeAmount += transaction.amount;
    }

    totalsByDate.set(transaction.transaction_date, current);
  }

  const result: SpendingTrendDatum[] = [];

  for (const date of enumerateDateRange(startDate, endDate)) {
    const totals = totalsByDate.get(date) ?? { expenseAmount: 0, incomeAmount: 0 };
    result.push({
      date,
      dayLabel: date.slice(-2),
      expenseAmount: roundCurrency(totals.expenseAmount),
      incomeAmount: roundCurrency(totals.incomeAmount),
    });
  }

  return result;
}

function buildCategoryBreakdown(
  transactions: TransactionRow[],
  categoryNameById: Map<string, string>,
): CategoryBreakdownDatum[] {
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const totalExpenses = sumTransactions(expenseTransactions, "expense");

  if (totalExpenses === 0) {
    return [];
  }

  const totalsByCategory = new Map<string, number>();

  for (const transaction of expenseTransactions) {
    const categoryName = transaction.category_id
      ? categoryNameById.get(transaction.category_id) ?? "Uncategorized"
      : "Uncategorized";

    totalsByCategory.set(
      categoryName,
      (totalsByCategory.get(categoryName) ?? 0) + transaction.amount,
    );
  }

  const palette = ["#2563eb", "#0f766e", "#f97316", "#8b5cf6", "#dc2626", "#0891b2"];

  return Array.from(totalsByCategory.entries())
    .map(([name, amount], index) => ({
      name,
      amount: roundCurrency(amount),
      color: palette[index % palette.length],
      shareOfTotal: Math.round((amount / totalExpenses) * 100),
    }))
    .sort((left, right) => right.amount - left.amount);
}

function normalizeMonthlyAmount(
  amount: number,
  billingCycle: string,
  intervalCount: number,
) {
  const baseInterval = intervalCount || 1;

  switch (billingCycle) {
    case "weekly":
      return roundCurrency(amount * (52 / 12 / baseInterval));
    case "monthly":
      return roundCurrency(amount / baseInterval);
    case "quarterly":
      return roundCurrency(amount / (3 * baseInterval));
    case "yearly":
      return roundCurrency(amount / (12 * baseInterval));
    default:
      return 0;
  }
}

function prettifySource(source: string) {
  switch (source) {
    case "receipt_text":
      return "receipt text";
    case "receipt_image":
      return "receipt image";
    default:
      return source.replaceAll("_", " ");
  }
}

function getCurrentMonthWindow(timezone: string) {
  const parts = getDatePartsInTimezone(new Date(), timezone);
  const startDate = `${parts.year}-${parts.month}-01`;
  const lastDay = new Date(Number(parts.year), Number(parts.month), 0).getDate();
  const endDate = `${parts.year}-${parts.month}-${String(lastDay).padStart(2, "0")}`;

  return {
    startDate,
    endDate,
    todayDate: `${parts.year}-${parts.month}-${parts.day}`,
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(new Date()),
  };
}

function getDatePartsInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: getPart(parts, "year"),
    month: getPart(parts, "month"),
    day: getPart(parts, "day"),
  };
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function enumerateDateRange(startDate: string, endDate: string) {
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const dates: string[] = [];

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
