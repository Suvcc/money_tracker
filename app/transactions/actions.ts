"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient, getRequiredUser } from "@/lib/supabase/server";

type DeleteTransactionsInput = {
  transactionIds: string[];
};

export type DeleteTransactionsResult = {
  deletedCount?: number;
  error?: string;
  success?: boolean;
};

export async function deleteTransactions(
  input: DeleteTransactionsInput,
): Promise<DeleteTransactionsResult> {
  const user = await getRequiredUser();

  if (!user) {
    redirect("/login");
  }

  const uniqueIds = Array.from(
    new Set(input.transactionIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueIds.length === 0) {
    return { error: "Choose at least one transaction to delete." };
  }

  const supabase = await createSupabaseServerClient();
  const deletedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      deleted_at: deletedAt,
    })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .in("id", uniqueIds)
    .select("id");

  if (error) {
    return { error: `Unable to delete transactions: ${error.message}` };
  }

  const deletedCount = data?.length ?? 0;

  if (deletedCount === 0) {
    return { error: "No matching transactions were available to delete." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/transactions/new");

  return {
    deletedCount,
    success: true,
  };
}
