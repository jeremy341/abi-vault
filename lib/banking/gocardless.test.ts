import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGoCardlessToken, listGoCardlessInstitutions } from "@/lib/banking/gocardless";

describe("GoCardless Bank Account Data client", () => {
  beforeEach(() => {
    process.env.GOCARDLESS_BANK_DATA_BASE_URL = "https://bankaccountdata.test";
    process.env.GOCARDLESS_BANK_DATA_SECRET_ID = "secret-id";
    process.env.GOCARDLESS_BANK_DATA_SECRET_KEY = "secret-key";
    vi.restoreAllMocks();
  });

  it("creates a provider token with server-side credentials", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ access: "access", refresh: "refresh", access_expires: 86400 }), { status: 200 }));
    await expect(createGoCardlessToken()).resolves.toMatchObject({ access: "access", refresh: "refresh" });
    expect(fetchMock).toHaveBeenCalledWith("https://bankaccountdata.test/api/v2/token/new/", expect.objectContaining({ method: "POST" }));
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("secret-id");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("secret-key");
  });

  it("requests only the configured country when listing institutions", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await listGoCardlessInstitutions("access-token", "DE");
    expect(fetchMock).toHaveBeenCalledWith("https://bankaccountdata.test/api/v2/institutions/?country=de", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer access-token" }) }));
  });
});
