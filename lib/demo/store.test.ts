import { describe, expect, it } from "vitest";
import {
  addDemoCashCount,
  createDemoState,
  addDemoTransaction,
  findDemoTransaction,
  listDemoPeriods,
  listDemoTransactions,
  listDemoWallets,
  removeDemoTransaction,
  setDemoPeriodLock,
  updateDemoTransaction,
  walletBookBalanceMinor,
} from "./store";

async function cashBoxId() {
  return (await listDemoWallets())[0].id;
}

describe("demo store", () => {
  it("adds an expense that lowers the cash register balance", async () => {
    const walletId = await cashBoxId();
    const before = await walletBookBalanceMinor(walletId);
    const id = await addDemoTransaction({
      title: "Test expense",
      categoryName: "Supplies",
      type: "expense",
      amountMinor: BigInt(500),
      date: "2026-10-30",
      walletId,
      walletName: "Class cash box",
    });

    expect(await walletBookBalanceMinor(walletId)).toBe(before - BigInt(500));
    expect(await findDemoTransaction(id)).toMatchObject({ amountMinor: "-500", type: "expense", fromWalletId: walletId });
  });

  it("corrects a transaction in place and keeps its register", async () => {
    const walletId = await cashBoxId();
    const id = await addDemoTransaction({
      title: "Before",
      categoryName: "Other",
      type: "income",
      amountMinor: BigInt(700),
      date: "2026-10-30",
      walletId,
      walletName: "Class cash box",
    });

    expect(await updateDemoTransaction(id, { title: "After", categoryName: "Event", type: "expense", amountMinor: BigInt(300) })).toBe(true);
    expect(await findDemoTransaction(id)).toMatchObject({
      title: "After",
      category: "Event",
      amountMinor: "-300",
      walletId,
      fromWalletId: walletId,
      toWalletId: null,
    });
  });

  it("removes an archived transaction from the list", async () => {
    const id = await addDemoTransaction({
      title: "To archive",
      categoryName: "Other",
      type: "income",
      amountMinor: BigInt(100),
      date: "2026-10-30",
      walletId: await cashBoxId(),
      walletName: "Class cash box",
    });

    await removeDemoTransaction(id);

    expect((await listDemoTransactions()).some((transaction) => transaction.id === id)).toBe(false);
  });

  it("records a cash count and stores the difference against the book balance", async () => {
    const walletId = await cashBoxId();
    const book = await walletBookBalanceMinor(walletId);
    const id = await addDemoCashCount({
      walletId,
      countedAmountMinor: book + BigInt(250),
      countedByName: "Tester",
      note: "",
    });

    expect(id).not.toBeNull();
    expect((await listDemoWallets())[0].lastCountDifferenceMinor).toBe("250");
  });

  it("locks a period and marks its transactions as locked", async () => {
    const october = (await listDemoPeriods()).find((period) => period.month === 10 && period.year === 2026);

    expect(october).toBeDefined();
    expect((await setDemoPeriodLock(october!.id, true, "Closing October")).ok).toBe(true);

    const lockedTransaction = (await listDemoTransactions()).find((transaction) => transaction.date.startsWith("2026-10"));

    expect(lockedTransaction?.periodLocked).toBe(true);
    expect((await setDemoPeriodLock(october!.id, true, "Again")).ok).toBe(false);
    expect((await setDemoPeriodLock(october!.id, false, "Reopen")).ok).toBe(true);
  });
});

describe("demo classes", () => {
  it("starts the second class with no transactions and one cash register", () => {
    const state = createDemoState("class-2027");

    expect(state.classId).toBe("class-2027");
    expect(state.transactions).toHaveLength(0);
    expect(state.wallets).toHaveLength(1);
  });
});
