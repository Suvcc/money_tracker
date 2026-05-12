import "server-only";

import { buildReceiptPreviewItem } from "@/lib/receipt-import/parse-receipt-text";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FinanceProfile,
  ReceiptParserStatus,
  TransactionCategoryOption,
  TransactionFilters,
  TransactionListItem,
  TransactionSearchParams,
  TransactionSort,
  TransactionTypeFilter,
} from "@/lib/types/finance";

export async function getTransactionFormData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [profile, categories, pendingReceiptRows] = await Promise.all([
    getProfile(supabase, userId),
    getTransactionCategories(supabase, userId),
    getPendingReceiptImports(supabase, userId),
  ]);

  return {
    profile,
    categories,
    pendingReceipts: pendingReceiptRows.map((receipt) =>
      buildReceiptPreviewItem(receipt, categories),
    ),
  };
}

export async function getTransactionsPageData(
  userId: string,
  searchParams: TransactionSearchParams,
) {
  const supabase = await createSupabaseServerClient();
  const filters = parseTransactionFilters(searchParams);

  const [profile, categories, transactions] = await Promise.all([
    getProfile(supabase, userId),
    getTransactionCategories(supabase, userId),
    getTransactionList(supabase, userId, filters),
  ]);

  return {
    profile,
    categories,
    filters,
    transactions,
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

async function getTransactionCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<TransactionCategoryOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }

  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
  }));
}

async function getTransactionList(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  filters: TransactionFilters,
): Promise<TransactionListItem[]> {
  let query = supabase
    .from("transactions")
    .select(
      "id, amount, type, merchant_name, note, transaction_date, source, categories(name)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.dateFrom) {
    query = query.gte("transaction_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("transaction_date", filters.dateTo);
  }

  const { data, error } = await query.order("transaction_date", {
    ascending: filters.sort === "oldest",
  });

  if (error) {
    throw new Error(`Unable to load transactions: ${error.message}`);
  }

  return (data ?? []).map((transaction) => {
    const category = Array.isArray(transaction.categories)
      ? transaction.categories[0]
      : transaction.categories;

    return {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      merchantName: transaction.merchant_name,
      note: transaction.note,
      transactionDate: transaction.transaction_date,
      categoryName: category?.name ?? null,
      sourceLabel: prettifySource(transaction.source),
    };
  });
}

function parseTransactionFilters(
  searchParams: TransactionSearchParams,
): TransactionFilters {
  const type = parseTypeFilter(searchParams.type);
  const categoryId = getFirstValue(searchParams.categoryId) ?? "all";
  const dateFrom = parseDateParam(searchParams.dateFrom);
  const dateTo = parseDateParam(searchParams.dateTo);
  const sort = parseSort(searchParams.sort);

  return {
    type,
    categoryId,
    dateFrom,
    dateTo,
    sort,
  };
}

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseTypeFilter(value: string | string[] | undefined): TransactionTypeFilter {
  const normalized = getFirstValue(value);

  if (normalized === "expense" || normalized === "income") {
    return normalized;
  }

  return "all";
}

function parseSort(value: string | string[] | undefined): TransactionSort {
  return getFirstValue(value) === "oldest" ? "oldest" : "newest";
}

function parseDateParam(value: string | string[] | undefined) {
  const normalized = getFirstValue(value);

  if (!normalized) {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
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

async function getPendingReceiptImports(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<ReceiptPreviewRow[]> {
  const { data, error } = await supabase
    .from("receipt_imports")
    .select(
      "id, raw_text, parsed_merchant_name, parsed_amount, parsed_currency, parsed_transaction_date, parsed_transaction_time, parsed_category_name, parser_status, parser_confidence, created_at",
    )
    .eq("user_id", userId)
    .in("parser_status", ["parsed", "failed"])
    .is("confirmed_transaction_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load pending receipt imports: ${error.message}`);
  }

  return (data ?? []) as ReceiptPreviewRow[];
}

type ReceiptPreviewRow = {
  id: string;
  raw_text: string;
  parsed_merchant_name: string | null;
  parsed_amount: number | null;
  parsed_currency: string | null;
  parsed_transaction_date: string | null;
  parsed_transaction_time: string | null;
  parsed_category_name: string | null;
  parser_status: ReceiptParserStatus;
  parser_confidence: number | null;
  created_at: string;
};
