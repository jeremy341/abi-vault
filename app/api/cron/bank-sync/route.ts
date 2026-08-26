import { NextRequest, NextResponse } from "next/server";
import { syncActiveBankConnections } from "@/lib/banking/sync";

export async function POST(request: NextRequest) {
  if (process.env.ABI_VAULT_ENABLE_BANK_RUNTIME !== "true") {
    return NextResponse.json({ error: "BANK_INTEGRATION_DISABLED" }, { status: 410 });
  }
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !actual || actual !== expected) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const results = await syncActiveBankConnections();
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: "SYNC_FAILED" }, { status: 502 });
  }
}
