"use server";

import { actionFailure, type ActionResult } from "@/lib/api/result";

export async function createTransfer(): Promise<ActionResult<null>> {
  return actionFailure("TRANSFERS_DISABLED", "Transfers are not supported in this flow.");
}
