"use server";

import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/auth/permissions-server";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  receiptMetadataSchema,
  receiptReviewSchema,
  type ReceiptReviewInput,
} from "@/features/receipts/schemas/receipts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIME_EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

function invalidReceipt(message = "The receipt data is invalid.") {
  return actionFailure("INVALID_PAYLOAD", message);
}

export async function uploadReceipt(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const context = await requirePermission("uploadReceipts");
  const file = formData.get("file");
  const transactionValue = formData.get("transactionId");

  if (!(file instanceof File)) return invalidReceipt("A receipt file is required.");
  if (file.size > 5 * 1024 * 1024) return invalidReceipt("The receipt must not exceed 5 MB.");

  const parsed = receiptMetadataSchema.safeParse({
    transactionId: transactionValue ? String(transactionValue) : null,
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
  });
  if (!parsed.success) return invalidReceipt("The receipt file type or size is invalid.");

  const supabase = await createSupabaseServerClient();
  if (parsed.data.transactionId) {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("id, status, period_id, accounting_periods(status)")
      .eq("id", parsed.data.transactionId)
      .eq("organization_id", context.organizationId)
      .maybeSingle();
    if (error || !transaction) return actionFailure("NOT_FOUND", "The transaction was not found.");
    const period = Array.isArray(transaction.accounting_periods)
      ? transaction.accounting_periods[0]
      : transaction.accounting_periods;
    if (transaction.status === "soft_deleted" || period?.status === "locked") {
      return actionFailure("PERIOD_LOCKED", "Receipts cannot be changed for a locked transaction.");
    }
  }

  const receiptId = randomUUID();
  const extension = MIME_EXTENSIONS[parsed.data.mimeType];
  const storagePath = `${context.organizationId}/${parsed.data.transactionId ?? "unassigned"}/${receiptId}.${extension}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, bytes, {
      contentType: parsed.data.mimeType,
      upsert: false,
    });
  if (uploadError) return actionFailure("DATABASE_ERROR", "The receipt could not be uploaded.");

  const { error: metadataError } = await supabase.from("receipts").insert({
    id: receiptId,
    organization_id: context.organizationId,
    transaction_id: parsed.data.transactionId,
    storage_path: storagePath,
    file_name: parsed.data.fileName,
    mime_type: parsed.data.mimeType,
    file_size_bytes: parsed.data.fileSizeBytes,
    uploaded_by: context.clerkUserId,
  });

  if (metadataError) {
    await supabase.storage.from("receipts").remove([storagePath]);
    return actionFailure("DATABASE_ERROR", "The receipt metadata could not be saved.");
  }

  return actionSuccess({ id: receiptId });
}

export async function reviewReceipt(
  input: ReceiptReviewInput,
): Promise<ActionResult<null>> {
  const context = await requirePermission("reviewReceipts");
  const parsed = receiptReviewSchema.safeParse(input);
  if (!parsed.success) return invalidReceipt();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("receipts")
    .update({
      review_status: parsed.data.status,
      reviewed_by: context.clerkUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.receiptId)
    .eq("organization_id", context.organizationId);

  if (error) return actionFailure("DATABASE_ERROR", "The receipt review could not be saved.");
  return actionSuccess(null);
}

export async function createReceiptDownloadUrl(
  receiptId: string,
): Promise<ActionResult<{ url: string }>> {
  const context = await requirePermission("viewReceipts");
  const id = receiptId.trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return invalidReceipt();

  const supabase = await createSupabaseServerClient();
  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("storage_path")
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (error || !receipt) return actionFailure("NOT_FOUND", "The receipt was not found.");

  const { data: signed, error: signedError } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receipt.storage_path, 300);
  if (signedError || !signed?.signedUrl) {
    return actionFailure("DATABASE_ERROR", "The receipt URL could not be created.");
  }

  return actionSuccess({ url: signed.signedUrl });
}
