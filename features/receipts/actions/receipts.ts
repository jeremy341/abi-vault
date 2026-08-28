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
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MIME_EXTENSIONS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

function invalidReceipt(message = "Die Belegdaten sind ungültig.") {
  return actionFailure("INVALID_PAYLOAD", message);
}

export async function uploadReceipt(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const context = await requirePermission("uploadReceipts");
  const file = formData.get("file");
  const transactionValue = formData.get("transactionId");

  if (!(file instanceof File)) return invalidReceipt("Eine Belegdatei ist erforderlich.");
  if (file.size > 5 * 1024 * 1024) return invalidReceipt("Der Beleg darf höchstens 5 MB groß sein.");

  const parsed = receiptMetadataSchema.safeParse({
    transactionId: transactionValue ? String(transactionValue) : null,
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
  });
  if (!parsed.success) return invalidReceipt("Dateityp oder Größe des Belegs sind ungültig.");

  const supabase = await createSupabaseServerClient();
  if (parsed.data.transactionId) {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("id, status, period_id, accounting_periods(status)")
      .eq("id", parsed.data.transactionId)
      .eq("organization_id", context.organizationId)
      .maybeSingle();
    if (error || !transaction) return actionFailure("NOT_FOUND", "Die Transaktion wurde nicht gefunden.");
    const period = Array.isArray(transaction.accounting_periods)
      ? transaction.accounting_periods[0]
      : transaction.accounting_periods;
    if (transaction.status === "soft_deleted" || period?.status === "locked") {
      return actionFailure("PERIOD_LOCKED", "Belege können für eine gesperrte Transaktion nicht geändert werden.");
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
  if (uploadError) return actionFailure("DATABASE_ERROR", "Der Beleg konnte nicht hochgeladen werden.");

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
    return actionFailure("DATABASE_ERROR", "Die Belegdaten konnten nicht gespeichert werden.");
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
  const { data: reviewed, error } = await supabase
    .from("receipts")
    .update({
      review_status: parsed.data.status,
      reviewed_by: context.clerkUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.receiptId)
    .eq("organization_id", context.organizationId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error) return actionFailure("DATABASE_ERROR", "Die Belegprüfung konnte nicht gespeichert werden.");
  if (!reviewed) return actionFailure("NOT_FOUND", "Der Beleg ist nicht mehr verfügbar.");
  return actionSuccess(null);
}

export async function updateReceiptMetadata(
  input: ReceiptUpdateInput,
): Promise<ActionResult<null>> {
  const parsed = receiptUpdateSchema.safeParse(input);
  if (!parsed.success) return invalidReceipt("Die Belegdaten sind ungültig.");
  const context = await requirePermission("uploadReceipts");
  const supabase = await createSupabaseServerClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, uploaded_by, archived_at")
    .eq("id", parsed.data.receiptId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (receiptError) return actionFailure("DATABASE_ERROR", "Der Beleg konnte nicht geladen werden.");
  if (!receipt || receipt.archived_at) return actionFailure("NOT_FOUND", "Der Beleg ist nicht mehr verfügbar.");
  if (context.role !== "admin" && receipt.uploaded_by !== context.clerkUserId) {
    return actionFailure("FORBIDDEN", "Nur der Uploader oder ein Admin kann den Beleg bearbeiten.");
  }

  if (parsed.data.transactionId) {
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("id, status, period_id, accounting_periods(status)")
      .eq("id", parsed.data.transactionId)
      .eq("organization_id", context.organizationId)
      .maybeSingle();
    if (transactionError || !transaction) return actionFailure("NOT_FOUND", "Die Transaktion wurde nicht gefunden.");
    const period = Array.isArray(transaction.accounting_periods)
      ? transaction.accounting_periods[0]
      : transaction.accounting_periods;
    if (transaction.status === "soft_deleted" || period?.status === "locked") {
      return actionFailure("PERIOD_LOCKED", "Der Beleg kann für diese Transaktion nicht geändert werden.");
    }
  }

  const { data: updated, error } = await supabase
    .from("receipts")
    .update({
      file_name: parsed.data.fileName,
      transaction_id: parsed.data.transactionId,
    })
    .eq("id", parsed.data.receiptId)
    .eq("organization_id", context.organizationId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFailure("DATABASE_ERROR", "Der Beleg konnte nicht gespeichert werden.");
  if (!updated) return actionFailure("NOT_FOUND", "Der Beleg ist nicht mehr verfügbar.");
  return actionSuccess(null);
}

export async function archiveReceipt(
  input: ReceiptArchiveInput,
): Promise<ActionResult<null>> {
  const parsed = receiptArchiveSchema.safeParse(input);
  if (!parsed.success) return invalidReceipt("Ein Archivierungsgrund ist erforderlich.");
  const context = await requirePermission("archiveFinanceRecords");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_receipt", {
    p_organization_id: context.organizationId,
    p_receipt_id: parsed.data.receiptId,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.code === "42501") return actionFailure("FORBIDDEN", "Nur Admins können Belege archivieren.");
    if (error.code === "23503") return actionFailure("NOT_FOUND", "Der Beleg ist nicht mehr verfügbar.");
    return actionFailure("DATABASE_ERROR", "Der Beleg konnte nicht archiviert werden.");
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
    .maybeSingle();
  if (error || !receipt) return actionFailure("NOT_FOUND", "Der Beleg wurde nicht gefunden.");

  const { data: signed, error: signedError } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receipt.storage_path, 300);
  if (signedError || !signed?.signedUrl) {
    return actionFailure("DATABASE_ERROR", "Die Beleg-URL konnte nicht erstellt werden.");
  }

  return actionSuccess({ url: signed.signedUrl });
}
