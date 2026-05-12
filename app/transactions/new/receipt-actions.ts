"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildReceiptPreviewItem,
  convertReceiptAmountToSar,
  parseReceiptBatchText,
  parseReceiptDateTime,
} from "@/lib/receipt-import/parse-receipt-text";
import {
  createSupabaseServerClient,
  getRequiredUser,
} from "@/lib/supabase/server";
import type {
  ReceiptBatchParseState,
  ReceiptConfirmInput,
  ReceiptDiscardResult,
  ReceiptEditInput,
  ReceiptUpdateResult,
  TransactionCategoryOption,
  TransactionType,
} from "@/lib/types/finance";

const initialParseState: ReceiptBatchParseState = {
  receipts: [],
};

export async function parseReceiptBatch(
  _previousState: ReceiptBatchParseState,
  formData: FormData,
): Promise<ReceiptBatchParseState> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const rawInput = formData.get("receiptText");

  if (typeof rawInput !== "string" || rawInput.trim().length === 0) {
    return {
      ...initialParseState,
      error: "Paste one or more receipt messages before parsing.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const categories = await getUserCategories(user.id);
  const parsedReceipts = parseReceiptBatchText(rawInput, categories);

  if (parsedReceipts.length === 0) {
    return {
      ...initialParseState,
      error: "No receipt messages were detected in the pasted text.",
    };
  }

  const rowsToInsert = parsedReceipts.map((receipt) => {
    const converted = convertReceiptAmountToSar(receipt.amount, receipt.currency);

    return {
      user_id: user.id,
      input_type: "text" as const,
      raw_text: receipt.rawText,
      parsed_merchant_name: receipt.merchantName,
      parsed_amount: converted.amount,
      parsed_currency: converted.currency,
      parsed_transaction_date: receipt.transactionDate || null,
      parsed_transaction_time: receipt.transactionTime || null,
      parsed_payment_method: receipt.paymentMethod,
      parsed_category_name: receipt.suggestedCategoryName,
      parser_status: receipt.parserStatus,
      parser_confidence: receipt.parserConfidence,
      parser_version: "v1-rule-based-ar",
    };
  });

  const { data, error } = await supabase
    .from("receipt_imports")
    .insert(rowsToInsert)
    .select(
      "id, raw_text, parsed_merchant_name, parsed_amount, parsed_currency, parsed_transaction_date, parsed_transaction_time, parsed_category_name, parser_status, parser_confidence",
    );

  if (error) {
    return {
      ...initialParseState,
      error: `Unable to store parsed receipts: ${error.message}`,
    };
  }

  revalidatePath("/transactions/new");

  return {
    receipts: (data ?? []).map((receipt) =>
      buildReceiptPreviewItem(receipt, categories),
    ),
  };
}

export async function updateParsedReceipt(
  input: ReceiptEditInput,
): Promise<ReceiptUpdateResult> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const categories = await getUserCategories(user.id);
  const validation = validateEditableReceipt(input, categories);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const { data, error } = await supabase
    .from("receipt_imports")
    .update({
      parsed_merchant_name: validation.merchantName,
      parsed_amount: validation.amount,
      parsed_currency: validation.currency,
      parsed_transaction_date: validation.transactionDate,
      parsed_transaction_time: validation.transactionTime,
      parsed_category_name: validation.category.name,
      parser_status: "parsed",
      parser_confidence: input.parserConfidence ?? 90,
    })
    .eq("id", input.receiptImportId)
    .eq("user_id", user.id)
    .is("confirmed_transaction_id", null)
    .select(
      "id, raw_text, parsed_merchant_name, parsed_amount, parsed_currency, parsed_transaction_date, parsed_transaction_time, parsed_category_name, parser_status, parser_confidence",
    )
    .single();

  if (error || !data) {
    return {
      error: `Unable to save receipt changes: ${error?.message ?? "Receipt not found."}`,
    };
  }

  revalidatePath("/transactions/new");

  return {
    success: true,
    receipt: buildReceiptPreviewItem(data, categories, validation.type),
  };
}

export async function confirmParsedReceipt(
  input: ReceiptConfirmInput,
): Promise<ReceiptUpdateResult> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const categories = await getUserCategories(user.id);
  const validation = validateEditableReceipt(input, categories);

  if ("error" in validation) {
    return { error: validation.error };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: validation.category.id,
    type: validation.type,
    source: "receipt_text",
    amount: validation.amount,
    currency: validation.currency,
    merchant_name: validation.merchantName,
    note: validation.note,
    transaction_date: validation.transactionDate,
    transaction_time: validation.transactionTime,
    receipt_import_id: input.receiptImportId,
    is_recurring: false,
  });

  if (error) {
    return { error: `Unable to confirm receipt: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");

  return { success: true };
}

export async function discardParsedReceipt(
  receiptImportId: string,
): Promise<ReceiptDiscardResult> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("receipt_imports")
    .update({
      parser_status: "discarded",
    })
    .eq("id", receiptImportId)
    .eq("user_id", user.id)
    .is("confirmed_transaction_id", null);

  if (error) {
    return { error: `Unable to discard receipt: ${error.message}` };
  }

  revalidatePath("/transactions/new");

  return { success: true };
}

async function getUserCategories(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }

  return (data ?? []) as TransactionCategoryOption[];
}

function validateEditableReceipt(
  input: ReceiptEditInput,
  categories: TransactionCategoryOption[],
):
  | {
      amount: number;
      category: TransactionCategoryOption;
      currency: string;
      error?: undefined;
      merchantName: string;
      note: string | null;
      transactionDate: string;
      transactionTime: string | null;
      type: TransactionType;
    }
  | {
      error: string;
    } {
  if (!input.receiptImportId) {
    return { error: "Missing receipt import id." };
  }

  const merchantName = input.merchantName.trim();
  if (!merchantName) {
    return { error: "Merchant or sender name is required." };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: "Currency must be a 3-letter code such as SAR or USD." };
  }

  const converted = convertReceiptAmountToSar(amount, currency);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate.trim())) {
    return { error: "Transaction date must use the YYYY-MM-DD format." };
  }

  const transactionTime = normalizeTransactionTime(input.transactionTime);
  if (transactionTime === "__invalid__") {
    return { error: "Transaction time must use the HH:MM format." };
  }

  const parsedDateTime = parseReceiptDateTime(
    `${input.transactionDate.slice(8, 10)}/${input.transactionDate.slice(5, 7)}/${input.transactionDate.slice(2, 4)} ${transactionTime || "00:00"}`,
  );

  if (!parsedDateTime) {
    return { error: "The receipt date or time could not be validated." };
  }

  const category = categories.find((item) => item.id === input.categoryId);
  if (!category) {
    return { error: "Choose a valid category for this account." };
  }

  if (category.type !== input.type) {
    return { error: "The selected category does not match the receipt type." };
  }

  return {
    amount: converted.amount,
    category,
    currency: converted.currency,
    merchantName,
    note: input.note.trim() || null,
    transactionDate: input.transactionDate.trim(),
    transactionTime: transactionTime || null,
    type: input.type,
  };
}

function normalizeTransactionTime(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const hhmmMatch = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!hhmmMatch) {
    return "__invalid__";
  }

  return `${hhmmMatch[1]}:${hhmmMatch[2]}`;
}
