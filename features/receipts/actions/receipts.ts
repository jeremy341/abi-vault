"use server";

import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/auth/permissions-server";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";
import {
  receiptMetadataSchema,
  receiptReviewSchema,
  type ReceiptReviewInput,
} from "@/features/receipts/schemas/receipts";
import {
  receiptArchiveSchema,
  receiptUpdateSchema,
  type ReceiptArchiveInput,
  type ReceiptUpdateInput,
} from "@/features/receipts/schemas/mutations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  if (file.size > 5 * 1024 * 1024) return invalidReceipt("The receipt must be no larger than 5 MB.");

  const parsed = receiptMetadataSchema.safeParse({
    transactionId: transactionValue ? String(transactionValue) : null,
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
  });
  if (!parsed.success) return invalidReceipt("The file type or receipt size is invalid.");

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

  const { error: metadataError } = await supabase.rpc("create_receipt_metadata", {
    p_organization_id: context.organizationId,
    p_receipt_id: receiptId,
    p_transaction_id: parsed.data.transactionId,
    p_storage_path: storagePath,
    p_file_name: parsed.data.fileName,
    p_mime_type: parsed.data.mimeType,
    p_file_size_bytes: parsed.data.fileSizeBytes,
  });

  if (metadataError) {
    await createSupabaseAdminClient().storage.from("receipts").remove([storagePath]);
    return actionFailure("DATABASE_ERROR", "The receipt data could not be saved.");
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
  const { error } = await supabase.rpc("review_receipt", {
    p_organization_id: context.organizationId,
    p_receipt_id: parsed.data.receiptId,
    p_status: parsed.data.status,
  });

  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "You are not allowed to review this receipt.");
    if (error.code === "23503") return actionFailure("NOT_FOUND", "The receipt is no longer available.");
    return actionFailure("DATABASE_ERROR", "The receipt review could not be saved.");
  }
  return actionSuccess(null);
}

export async function updateReceiptMetadata(
  input: ReceiptUpdateInput,
): Promise<ActionResult<null>> {
  const parsed = receiptUpdateSchema.safeParse(input);
  if (!parsed.success) return invalidReceipt("The receipt data is invalid.");
  const context = await requirePermission("uploadReceipts");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_receipt_metadata", {
    p_organization_id: context.organizationId,
    p_receipt_id: parsed.data.receiptId,
    p_file_name: parsed.data.fileName,
    p_transaction_id: parsed.data.transactionId,
  });
  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "Only the uploader or an admin can edit the receipt.");
    if (error.code === "23503") return actionFailure("NOT_FOUND", "The receipt is no longer available.");
    if (error.code === "55000") return actionFailure("PERIOD_LOCKED", "The receipt cannot be changed for this transaction.");
    return actionFailure("DATABASE_ERROR", "The receipt could not be saved.");
  }
  return actionSuccess(null);
}

export async function archiveReceipt(
  input: ReceiptArchiveInput,
): Promise<ActionResult<null>> {
  const parsed = receiptArchiveSchema.safeParse(input);
  if (!parsed.success) return invalidReceipt("An archive reason is required.");
  const context = await requirePermission("archiveFinanceRecords");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_receipt", {
    p_organization_id: context.organizationId,
    p_receipt_id: parsed.data.receiptId,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "Only admins can archive receipts.");
    if (error.code === "23503") return actionFailure("NOT_FOUND", "The receipt is no longer available.");
    return actionFailure("DATABASE_ERROR", "The receipt could not be archived.");
  }
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
    .is("archived_at", null)
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
