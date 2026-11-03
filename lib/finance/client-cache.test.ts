import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cachedFinanceQuery,
  clearFinanceCache,
  FINANCE_CACHE_TTL_MS,
  getCachedFinanceData,
  getFinanceCacheState,
  subscribeFinanceQuery,
} from "./client-cache";

describe("Finance stale-while-revalidate cache", () => {
  afterEach(() => {
    clearFinanceCache();
    vi.useRealTimers();
  });

  it("Returns fresh results from memory", async () => {
    const query = vi.fn().mockResolvedValue({ ok: true, value: "first" });
    await cachedFinanceQuery("transactions", query, { scope: "org:user" });
    const result = await cachedFinanceQuery("transactions", query, { scope: "org:user" });

    expect(result).toEqual({ ok: true, value: "first" });
    expect(query).toHaveBeenCalledTimes(1);
    expect(getCachedFinanceData("transactions", "org:user")).toEqual({ ok: true, value: "first" });
  });

  it("Keeps stale data while refreshing once", async () => {
    vi.useFakeTimers();

    const query = vi.fn()
      .mockResolvedValueOnce({ ok: true, value: "first" })
      .mockResolvedValueOnce({ ok: true, value: "second" });

    await cachedFinanceQuery("reports", query, { scope: "org:user" });
    vi.advanceTimersByTime(FINANCE_CACHE_TTL_MS + 1);

    const refresh = cachedFinanceQuery("reports", query, { scope: "org:user" });
    expect(getFinanceCacheState("reports", "org:user").data).toEqual({ ok: true, value: "first" });
    expect(getFinanceCacheState("reports", "org:user").refreshing).toBe(true);
    await refresh;
    expect(getCachedFinanceData("reports", "org:user")).toEqual({ ok: true, value: "second" });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("Does not cache failed results", async () => {
    const query = vi.fn().mockResolvedValue({ ok: false, error: "DATABASE_ERROR" });
    await cachedFinanceQuery("receipts", query, { scope: "org:user" });
    expect(getCachedFinanceData("receipts", "org:user")).toBeUndefined();
  });

  it("Notifies listeners with refreshed values", async () => {
    const listener = vi.fn<(value: { ok: true; value: string }) => void>();

    const unsubscribe = subscribeFinanceQuery<{ ok: true; value: string }>(
      "typed",
      listener,
      "org:user",
    );

    await cachedFinanceQuery(
      "typed",
      async () => ({ ok: true as const, value: "fresh" }),
      { scope: "org:user" },
    );

    expect(listener).toHaveBeenCalledWith({ ok: true, value: "fresh" });
    unsubscribe();
  });
});
