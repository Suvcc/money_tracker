"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient, getRequiredUser } from "@/lib/supabase/server";
import type { TransactionFormState, TransactionType } from "@/lib/types/finance";

export async function createTransaction(
  _previousState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const rawAmount = formData.get("amount");
  const rawType = formData.get("type");
  const rawCategoryId = formData.get("categoryId");
  const rawTransactionDate = formData.get("transactionDate");
  const rawMerchantName = formData.get("merchantName");
  const rawNote = formData.get("note");

  const fieldErrors: TransactionFormState["fieldErrors"] = {};

  const amount = parseAmount(rawAmount);
  if (amount === null || amount <= 0) {
    fieldErrors.amount = "Enter a valid amount greater than zero.";
  }

  const type = parseTransactionType(rawType);
  if (!type) {
    fieldErrors.type = "Choose whether this is an expense or income.";
  }

  const categoryId =
    typeof rawCategoryId === "string" && rawCategoryId.trim().length > 0
      ? rawCategoryId.trim()
      : null;
  if (!categoryId) {
    fieldErrors.categoryId = "Choose a category.";
  }

  const transactionDate = parseDateInput(rawTransactionDate);
  if (!transactionDate) {
    fieldErrors.transactionDate = "Enter a valid transaction date.";
  }

  const merchantName =
    typeof rawMerchantName === "string" && rawMerchantName.trim().length > 0
      ? rawMerchantName.trim()
      : null;
  const note =
    typeof rawNote === "string" && rawNote.trim().length > 0
      ? rawNote.trim()
      : null;

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: profile, error: profileError }, { data: category, error: categoryError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("id", user.id)
        .single(),
      supabase
        .from("categories")
        .select("id, type")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .eq("id", categoryId!)
        .single(),
    ]);

  if (profileError) {
    return { error: `Unable to load profile: ${profileError.message}` };
  }

  if (categoryError || !category) {
    return {
      error: "The selected category is not available for this account.",
      fieldErrors: {
        categoryId: "Choose a valid category.",
      },
    };
  }

  if (category.type !== type) {
    return {
      error: "The selected category does not match the transaction type.",
      fieldErrors: {
        categoryId: "Choose a category that matches the selected type.",
      },
    };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: category.id,
    type,
    source: "manual",
    amount,
    currency: profile.preferred_currency ?? "SAR",
    merchant_name: merchantName,
    note,
    transaction_date: transactionDate,
    is_recurring: false,
  });

  if (error) {
    return { error: `Unable to create transaction: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  redirect("/transactions?created=1");
}

function parseAmount(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = Number(value);

  return Number.isFinite(normalized) ? Math.round(normalized * 100) / 100 : null;
}

function parseTransactionType(value: FormDataEntryValue | null): TransactionType | null {
  if (value === "expense" || value === "income") {
    return value;
  }

  return null;
}

function parseDateInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
}
