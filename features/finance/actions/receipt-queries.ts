"use server";

import { isDemoData } from "@/lib/demo/mode";
import { demoData } from "@/lib/demo/sample-data";

import { requireClerkContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { querySuccess, queryFailure } from "@/lib/finance/query-result";
import { signedMinorAmount } from "@/lib/finance/money";
import { fetchAllRows, fetchRowsInBatches } from "@/lib/supabase/fetch-all-rows";
import type { ReceiptFileType } from "@/features/receipts/view-model";

export async function listReceiptsForCurrentOrganization() {
  if (isDemoData()) return demoData.receipts;
  const context = await requireClerkContext();
  const supabase = await createSupabaseServerClient();

  const { data: membership, error: membershipError } = await supabase
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", context.organizationId)
    .eq("clerk_user_id", context.clerkUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) return queryFailure("DATABASE_ERROR");

  if (!membership) return queryFailure("FORBIDDEN");

  const { data: receipts, error } = await fetchAllRows((from, to) =>
    supabase
      .from("receipts")
      .select("id, file_name, mime_type, file_size_bytes, transaction_id, review_status, created_at, uploaded_by, reviewed_by, reviewed_at")
      .eq("organization_id", context.organizationId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
  );

  if (error) return queryFailure("DATABASE_ERROR");

  const transactionIds = [...new Set(
    (receipts ?? [])
      .map((receipt) => receipt.transaction_id)
      .filter((id): id is string => Boolean(id)),
  )];

  const profileIds = [...new Set(
    (receipts ?? [])
      .flatMap((receipt) => [receipt.uploaded_by, receipt.reviewed_by])
      .filter((id): id is string => Boolean(id)),
  )];

  const [transactionResult, profileResult] = await Promise.all([
    fetchRowsInBatches(
      transactionIds,
      (batch) =>
        fetchAllRows((from, to) =>
          supabase
            .from("transactions")
          .select("id, title, type, booked_at, amount_minor::text")
            .in("id", batch)
            .order("id")
            .range(from, to),
        ),
    ),
    fetchRowsInBatches(
      profileIds,
      (batch) =>
        fetchAllRows((from, to) =>
        supabase
          .from("profiles")
          .select("clerk_user_id, display_name, email")
          .in("clerk_user_id", batch)
          .order("clerk_user_id")
          .range(from, to),
        ),
    ),
  ]);

  if (transactionResult.error || profileResult.error) return queryFailure("DATABASE_ERROR");
  const transactionMap = new Map((transactionResult.data ?? []).map((transaction) => [transaction.id, transaction]));
  const receiptProfileMap = new Map((profileResult.data ?? []).map((profile) => [profile.clerk_user_id, profile.display_name || profile.email || "Unbekannt"]));

  return querySuccess({
    items: (receipts ?? []).map((receipt) => {
      const transaction = receipt.transaction_id ? transactionMap.get(receipt.transaction_id) : undefined;

      const type: ReceiptFileType =
        receipt.mime_type === "application/pdf"
          ? "PDF"
          : receipt.mime_type === "image/png"
            ? "PNG"
            : "JPG";

      return {
        id: receipt.id,
        file: receipt.file_name,
        type,
        sizeBytes: receipt.file_size_bytes,
        transaction: transaction?.title ?? "Unassigned",
        transactionId: receipt.transaction_id,
        assigned: Boolean(receipt.transaction_id),
        date: transaction?.booked_at ?? receipt.created_at,
        amountMinor: transaction ? signedMinorAmount(transaction.amount_minor, transaction.type) : "0",
        status: receipt.review_status,
        uploadedByName: receiptProfileMap.get(receipt.uploaded_by) ?? "Unbekannt",
        uploadedAt: receipt.created_at,
        reviewedByName: receipt.reviewed_by ? receiptProfileMap.get(receipt.reviewed_by) ?? "Unbekannt" : null,
        reviewedAt: receipt.reviewed_at,
        canEdit: membership.role === "admin" || receipt.uploaded_by === context.clerkUserId,
        canDelete: membership.role === "admin",
      };
    }),
  });
}
