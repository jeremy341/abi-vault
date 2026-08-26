import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/api/banking/gocardless/callback/route";

describe("GoCardless callback", () => {
  it("rejects callbacks without a single-use state and requisition reference", async () => {
    const response = await GET(new NextRequest("http://localhost:3000/api/banking/gocardless/callback"));
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({ error: "BANK_INTEGRATION_DISABLED" });
  });
});
