import type { listReceiptsForCurrentOrganization } from "@/features/finance/actions/queries";

export type ReceiptQueryData = Extract<Awaited<ReturnType<typeof listReceiptsForCurrentOrganization>>, { ok: true }>;
