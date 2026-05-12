export type FinanceProfile = {
  fullName: string | null;
  preferredCurrency: string;
  timezone: string;
};

export type TransactionType = "expense" | "income";
export type TransactionTypeFilter = TransactionType | "all";
export type TransactionSort = "newest" | "oldest";

export type DashboardSummary = {
  expenseTotal: number;
  incomeTotal: number;
  netBalance: number;
  monthlySubscriptionTotal: number;
};

export type SpendingTrendDatum = {
  date: string;
  dayLabel: string;
  expenseAmount: number;
  incomeAmount: number;
};

export type CategoryBreakdownDatum = {
  name: string;
  amount: number;
  color: string;
  shareOfTotal: number;
};

export type RecentTransactionItem = {
  id: string;
  amount: number;
  type: TransactionType;
  merchantName: string | null;
  note: string | null;
  transactionDate: string;
  categoryName: string | null;
  sourceLabel: string;
};

export type UpcomingRenewalItem = {
  id: string;
  amount: number;
  billingDate: string;
  status: "scheduled" | "due";
  subscriptionName: string;
};

export type DashboardData = {
  profile: FinanceProfile;
  period: {
    startDate: string;
    endDate: string;
    todayDate: string;
    label: string;
  };
  summary: DashboardSummary;
  spendingTrend: SpendingTrendDatum[];
  categoryBreakdown: CategoryBreakdownDatum[];
  recentTransactions: RecentTransactionItem[];
  upcomingRenewals: UpcomingRenewalItem[];
};

export type TransactionRow = {
  id: string;
  amount: number;
  type: TransactionType;
  merchant_name: string | null;
  note: string | null;
  transaction_date: string;
  category_id: string | null;
  source: string;
};

export type TransactionCategoryOption = {
  id: string;
  name: string;
  type: TransactionType;
};

export type TransactionListItem = {
  id: string;
  amount: number;
  type: TransactionType;
  merchantName: string | null;
  note: string | null;
  transactionDate: string;
  categoryName: string | null;
  sourceLabel: string;
};

export type TransactionFilters = {
  type: TransactionTypeFilter;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sort: TransactionSort;
};

export type TransactionSearchParams = Record<
  "type" | "categoryId" | "dateFrom" | "dateTo" | "sort" | "created",
  string | string[] | undefined
>;

export type TransactionFormState = {
  error?: string;
  fieldErrors?: {
    amount?: string;
    type?: string;
    categoryId?: string;
    transactionDate?: string;
  };
};

export type ReceiptParserStatus =
  | "parsed"
  | "failed"
  | "confirmed"
  | "discarded";

export type ReceiptMessageFamily =
  | "purchase_international_online"
  | "purchase_international_pos"
  | "purchase_pos"
  | "purchase_online"
  | "transfer_inbound"
  | "transfer_outbound"
  | "unknown";

export type ReceiptCategoryMatch = {
  id: string;
  name: string;
};

export type ReceiptPreviewItem = {
  id: string;
  rawText: string;
  type: TransactionType;
  merchantName: string;
  amount: number;
  currency: string;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  transactionDate: string;
  transactionTime: string | null;
  parserStatus: ReceiptParserStatus;
  parserConfidence: number;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  messageFamily: ReceiptMessageFamily;
  messageFamilyLabel: string;
  note?: string | null;
};

export type ReceiptBatchParseState = {
  error?: string;
  receipts: ReceiptPreviewItem[];
};

export type ReceiptEditInput = {
  receiptImportId: string;
  type: TransactionType;
  merchantName: string;
  amount: number;
  currency: string;
  transactionDate: string;
  transactionTime: string;
  categoryId: string;
  note: string;
  parserConfidence?: number;
};

export type ReceiptConfirmInput = ReceiptEditInput;

export type ReceiptUpdateResult = {
  error?: string;
  receipt?: ReceiptPreviewItem;
  success?: boolean;
};

export type ReceiptDiscardResult = {
  error?: string;
  success?: boolean;
};
