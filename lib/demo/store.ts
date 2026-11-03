import { createClient } from "@supabase/supabase-js";
import type { ReceiptFileType } from "@/features/receipts/view-model";
import { currentDemoClassId, DEMO_CLASSES, type DemoClassId } from "@/lib/demo/classes";
import { demoData } from "@/lib/demo/sample-data";

export const DEMO_USER_ID = "u1";
export const DEMO_USER_NAME = "Demo user";

export type DemoTransaction = {
  id: string;
  title: string;
  category: string;
  date: string;
  amountMinor: string;
  type: "income" | "expense";
  receipt: boolean;
  receiptId: string | null;
  receiptFile: string | null;
  receiptType: string | null;
  reviewStatus: string;
  createdByName: string | null;
  createdAt: string;
  account: string;
  walletId: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  createdBy: string | null;
  canEdit: boolean;
  canDelete: boolean;
  periodLocked: boolean;
};

export type DemoWallet = {
  id: string;
  name: string;
  type: string;
  openingBalanceMinor: string;
  cardNumberVisual: string | null;
  cardHolderVisual: string | null;
  cardExpiryVisual: string | null;
  cardColorVisual: string | null;
  lastCountAt: string | null;
  lastCountedAmountMinor: string | null;
  lastCountDifferenceMinor: string | null;
  lastCountedByName: string | null;
  connected: {
    display_name: string | null;
    iban_last4: string | null;
    bic: string | null;
    account_holder: string | null;
  };
};

export type DemoGoal = {
  id: string;
  title: string;
  target_amount_minor: string;
  saved_amount_minor: string;
  deadline: string;
};

export type DemoCashCount = {
  id: string;
  walletId: string;
  countedAmountMinor: string;
  bookAmountMinor: string;
  differenceMinor: string;
  countedByName: string;
  createdAt: string;
  note: string;
};

export type DemoPeriod = {
  id: string;
  year: number;
  month: number;
  status: "open" | "locked";
  lockedAt: string | null;
  lockedByName: string | null;
  lockReason: string | null;
};

export type DemoRole = "admin" | "supervisor" | "student";

export type DemoMember = {
  id: string;
  name: string;
  role: DemoRole;
  status: "active" | "invited";
};

export type DemoReceipt = {
  id: string;
  file: string;
  type: ReceiptFileType;
  sizeBytes: number;
  transaction: string;
  transactionId: string | null;
  assigned: boolean;
  date: string;
  amountMinor: string;
  status: "approved" | "rejected" | "pending";
  uploadedByName: string | null;
  uploadedAt: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
  dataUrl?: string;
};

export type DemoSettings = {
  school_name: string;
  graduation_year: number;
  notifications: { receipts: boolean; payments: boolean; goals: boolean };
};

export type DemoInviteLink = {
  id: string;
  role: "admin" | "supervisor";
  token: string;
  expiresAt: string;
};

type DemoState = {
  classId: DemoClassId;
  transactions: DemoTransaction[];
  wallets: DemoWallet[];
  goals: DemoGoal[];
  cashCounts: DemoCashCount[];
  periods: DemoPeriod[];
  members: DemoMember[];
  receipts: DemoReceipt[];
  settings: DemoSettings;
  inviteLinks: DemoInviteLink[];
};

const memoryStates = new Map<DemoClassId, DemoState>();

export function createDemoState(classId: DemoClassId): DemoState {
  if (classId !== DEMO_CLASSES[0].id) return createEmptyClassState(classId);

  return {
    classId,
    transactions: structuredClone(demoData.transactions.items) as DemoTransaction[],
    wallets: structuredClone(demoData.wallets.items) as DemoWallet[],
    goals: structuredClone(demoData.goals.items),
    cashCounts: structuredClone(demoData.cashCounts.items),
    periods: structuredClone(demoData.periods.items) as DemoPeriod[],
    members: structuredClone(demoData.members.items) as DemoMember[],
    receipts: structuredClone(demoData.receipts.items) as DemoReceipt[],
    settings: {
      school_name: demoData.settings.data.school_name,
      graduation_year: demoData.settings.data.graduation_year,
      notifications: { receipts: true, payments: true, goals: true },
    },
    inviteLinks: [],
  };
}

function createEmptyClassState(classId: DemoClassId): DemoState {
  return {
    classId,
    transactions: [],
    wallets: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        name: "Class cash box",
        type: "cash",
        openingBalanceMinor: "0",
        cardNumberVisual: "0010",
        cardHolderVisual: "Abi 2027",
        cardExpiryVisual: "06/27",
        cardColorVisual: "#141414",
        lastCountAt: null,
        lastCountedAmountMinor: null,
        lastCountDifferenceMinor: null,
        lastCountedByName: null,
        connected: { display_name: null, iban_last4: null, bic: null, account_holder: null },
      },
    ],
    goals: [],
    cashCounts: [],
    periods: (demoData.periods.items as DemoPeriod[]).map((period) => ({
      ...period,
      status: "open" as const,
      lockedAt: null,
      lockedByName: null,
      lockReason: null,
    })),
    members: structuredClone(demoData.members.items) as DemoMember[],
    receipts: [],
    settings: { school_name: "Rheinau High School", graduation_year: 2027, notifications: { receipts: true, payments: true, goals: true } },
    inviteLinks: [],
  };
}

function demoDatabase() {
  const url = process.env.DEMO_SUPABASE_URL;
  const key = process.env.DEMO_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function rowIdFor(classId: DemoClassId) {
  return `demo:${classId}`;
}

async function loadState(): Promise<DemoState> {
  const classId = await currentDemoClassId();
  const database = demoDatabase();

  if (!database) {
    const existing = memoryStates.get(classId);

    if (existing) return existing;

    const fresh = createDemoState(classId);

    memoryStates.set(classId, fresh);

    return fresh;
  }

  const { data, error } = await database.from("demo_state").select("data").eq("id", rowIdFor(classId)).maybeSingle();

  if (error) throw new Error("The demo database could not be read.");

  if (data) return data.data as DemoState;

  const fresh = createDemoState(classId);

  await saveState(fresh);

  return fresh;
}

async function saveState(state: DemoState) {
  const database = demoDatabase();

  if (!database) {
    memoryStates.set(state.classId, state);

    return;
  }

  const { error } = await database
    .from("demo_state")
    .upsert({ id: rowIdFor(state.classId), data: state, updated_at: new Date().toISOString() });

  if (error) throw new Error("The demo database could not be saved.");
}

function newId() {
  return globalThis.crypto.randomUUID();
}

function periodFor(state: DemoState, date: string) {
  const [year, month] = date.split("-").map(Number);

  return state.periods.find((period) => period.year === year && period.month === month) ?? null;
}

function syncTransactionLocks(state: DemoState) {
  for (const transaction of state.transactions) {
    transaction.periodLocked = periodFor(state, transaction.date)?.status === "locked";
  }
}

function bookBalanceMinor(state: DemoState, walletId: string) {
  const wallet = state.wallets.find((item) => item.id === walletId);

  if (!wallet) return BigInt(0);

  return state.transactions
    .filter((transaction) => transaction.walletId === walletId)
    .reduce((total, transaction) => total + BigInt(transaction.amountMinor), BigInt(wallet.openingBalanceMinor));
}

export async function listDemoTransactions() {
  return [...(await loadState()).transactions];
}

export async function listDemoWallets() {
  return [...(await loadState()).wallets];
}

export async function listDemoGoals() {
  return [...(await loadState()).goals];
}

export async function listDemoCashCounts() {
  return [...(await loadState()).cashCounts];
}

export async function listDemoPeriods() {
  return [...(await loadState()).periods];
}

export async function listDemoMembers() {
  return [...(await loadState()).members];
}

export async function listDemoReceipts() {
  return [...(await loadState()).receipts];
}

export async function getDemoSettings() {
  const { settings } = await loadState();

  return { ...settings, notifications: { ...settings.notifications } };
}

export async function findDemoWallet(walletId: string) {
  return (await loadState()).wallets.find((wallet) => wallet.id === walletId) ?? null;
}

export async function findDemoTransaction(transactionId: string) {
  return (await loadState()).transactions.find((item) => item.id === transactionId) ?? null;
}

export async function findDemoGoal(goalId: string) {
  return (await loadState()).goals.find((goal) => goal.id === goalId) ?? null;
}

export async function findDemoPeriod(periodId: string) {
  return (await loadState()).periods.find((period) => period.id === periodId) ?? null;
}

export async function findDemoMember(memberId: string) {
  return (await loadState()).members.find((member) => member.id === memberId) ?? null;
}

export async function findDemoReceipt(receiptId: string) {
  return (await loadState()).receipts.find((receipt) => receipt.id === receiptId) ?? null;
}

export async function walletBookBalanceMinor(walletId: string) {
  return bookBalanceMinor(await loadState(), walletId);
}

export async function countDemoAdmins() {
  return (await loadState()).members.filter((member) => member.role === "admin" && member.status === "active").length;
}

export async function addDemoTransaction(input: {
  title: string;
  categoryName: string;
  type: "income" | "expense";
  amountMinor: bigint;
  date: string;
  walletId: string;
  walletName: string;
}) {
  const state = await loadState();
  const id = newId();
  const signed = input.type === "expense" ? -input.amountMinor : input.amountMinor;

  state.transactions.unshift({
    id,
    title: input.title,
    category: input.categoryName,
    date: input.date,
    amountMinor: signed.toString(),
    type: input.type,
    receipt: false,
    receiptId: null,
    receiptFile: null,
    receiptType: null,
    reviewStatus: "Approved",
    createdByName: DEMO_USER_NAME,
    createdAt: new Date().toISOString(),
    account: input.walletName,
    walletId: input.walletId,
    fromWalletId: input.type === "expense" ? input.walletId : null,
    toWalletId: input.type === "income" ? input.walletId : null,
    createdBy: DEMO_USER_ID,
    canEdit: true,
    canDelete: true,
    periodLocked: periodFor(state, input.date)?.status === "locked",
  });

  await saveState(state);

  return id;
}

export async function updateDemoTransaction(
  transactionId: string,
  patch: {
    title: string;
    categoryName: string;
    type: "income" | "expense";
    amountMinor: bigint;
  },
) {
  const state = await loadState();
  const transaction = state.transactions.find((item) => item.id === transactionId);

  if (!transaction || !transaction.walletId) return false;

  const signed = patch.type === "expense" ? -patch.amountMinor : patch.amountMinor;

  Object.assign(transaction, {
    title: patch.title,
    category: patch.categoryName,
    type: patch.type,
    amountMinor: signed.toString(),
    fromWalletId: patch.type === "expense" ? transaction.walletId : null,
    toWalletId: patch.type === "income" ? transaction.walletId : null,
  });

  await saveState(state);

  return true;
}

export async function removeDemoTransaction(transactionId: string) {
  const state = await loadState();

  state.transactions = state.transactions.filter((item) => item.id !== transactionId);

  for (const receipt of state.receipts) {
    if (receipt.transactionId === transactionId) {
      receipt.transactionId = null;
      receipt.assigned = false;
    }
  }

  await saveState(state);
}

export async function addDemoWallet(input: {
  name: string;
  cardNumberVisual: string | null;
  cardHolderVisual: string | null;
  cardExpiryVisual: string | null;
  cardColorVisual: string | null;
}) {
  const state = await loadState();
  const id = newId();

  state.wallets.push({
    id,
    name: input.name,
    type: "cash",
    openingBalanceMinor: "0",
    cardNumberVisual: input.cardNumberVisual,
    cardHolderVisual: input.cardHolderVisual,
    cardExpiryVisual: input.cardExpiryVisual,
    cardColorVisual: input.cardColorVisual,
    lastCountAt: null,
    lastCountedAmountMinor: null,
    lastCountDifferenceMinor: null,
    lastCountedByName: null,
    connected: { display_name: null, iban_last4: null, bic: null, account_holder: null },
  });

  await saveState(state);

  return id;
}

export async function updateDemoWallet(
  walletId: string,
  patch: {
    name: string;
    cardNumberVisual: string | null;
    cardHolderVisual: string | null;
    cardExpiryVisual: string | null;
    cardColorVisual: string | null;
  },
) {
  const state = await loadState();
  const wallet = state.wallets.find((item) => item.id === walletId);

  if (!wallet) return false;

  Object.assign(wallet, patch);

  for (const transaction of state.transactions) {
    if (transaction.walletId === walletId) transaction.account = patch.name;
  }

  await saveState(state);

  return true;
}

export async function removeDemoWallet(walletId: string) {
  const state = await loadState();

  state.wallets = state.wallets.filter((wallet) => wallet.id !== walletId);

  await saveState(state);
}

export async function addDemoCashCount(input: {
  walletId: string;
  countedAmountMinor: bigint;
  countedByName: string;
  note: string;
}) {
  const state = await loadState();
  const wallet = state.wallets.find((item) => item.id === input.walletId);

  if (!wallet) return null;

  const bookAmountMinor = bookBalanceMinor(state, input.walletId);
  const differenceMinor = input.countedAmountMinor - bookAmountMinor;
  const createdAt = new Date().toISOString();
  const id = newId();

  state.cashCounts.unshift({
    id,
    walletId: input.walletId,
    countedAmountMinor: input.countedAmountMinor.toString(),
    bookAmountMinor: bookAmountMinor.toString(),
    differenceMinor: differenceMinor.toString(),
    countedByName: input.countedByName,
    createdAt,
    note: input.note,
  });

  Object.assign(wallet, {
    lastCountAt: createdAt,
    lastCountedAmountMinor: input.countedAmountMinor.toString(),
    lastCountDifferenceMinor: differenceMinor.toString(),
    lastCountedByName: input.countedByName,
  });

  await saveState(state);

  return id;
}

export async function addDemoGoal(input: { title: string; targetAmountMinor: string; deadline: string }) {
  const state = await loadState();
  const id = newId();

  state.goals.push({
    id,
    title: input.title,
    target_amount_minor: input.targetAmountMinor,
    saved_amount_minor: "0",
    deadline: input.deadline,
  });

  await saveState(state);

  return id;
}

export async function updateDemoGoal(goalId: string, patch: { title: string; targetAmountMinor: string; deadline: string }) {
  const state = await loadState();
  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) return false;

  Object.assign(goal, {
    title: patch.title,
    target_amount_minor: patch.targetAmountMinor,
    deadline: patch.deadline,
  });

  await saveState(state);

  return true;
}

export async function removeDemoGoal(goalId: string) {
  const state = await loadState();

  state.goals = state.goals.filter((goal) => goal.id !== goalId);

  await saveState(state);
}

export async function addDemoGoalContribution(goalId: string, transactionId: string, amountMinor: bigint) {
  const state = await loadState();
  const goal = state.goals.find((item) => item.id === goalId);
  const transaction = state.transactions.find((item) => item.id === transactionId);

  if (!goal || !transaction) return null;

  goal.saved_amount_minor = (BigInt(goal.saved_amount_minor) + amountMinor).toString();

  await saveState(state);

  return newId();
}

export async function setDemoPeriodLock(periodId: string, locked: boolean, reason: string) {
  const state = await loadState();
  const period = state.periods.find((item) => item.id === periodId);

  if (!period) return { ok: false as const, code: "NOT_FOUND" as const };

  if ((period.status === "locked") === locked) return { ok: false as const, code: "ALREADY" as const };

  Object.assign(period, {
    status: locked ? "locked" : "open",
    lockedAt: locked ? new Date().toISOString() : null,
    lockedByName: locked ? DEMO_USER_NAME : null,
    lockReason: locked ? reason : null,
  });

  syncTransactionLocks(state);

  await saveState(state);

  return { ok: true as const };
}

export async function updateDemoSettings(patch: DemoSettings) {
  const state = await loadState();

  state.settings = { ...patch, notifications: { ...patch.notifications } };

  await saveState(state);
}

export async function setDemoMemberRole(memberId: string, role: DemoRole) {
  const state = await loadState();
  const member = state.members.find((item) => item.id === memberId);

  if (!member) return false;

  member.role = role;

  await saveState(state);

  return true;
}

export async function removeDemoMember(memberId: string) {
  const state = await loadState();

  state.members = state.members.filter((member) => member.id !== memberId);

  await saveState(state);
}

export async function addDemoInvitedMember(email: string, role: "admin" | "supervisor") {
  const state = await loadState();
  const id = newId();

  state.members.push({ id, name: email, role, status: "invited" });

  await saveState(state);

  return id;
}

export async function addDemoInviteLink(role: "admin" | "supervisor", expiresAt: string) {
  const state = await loadState();
  const link: DemoInviteLink = {
    id: newId(),
    role,
    token: newId().replace(/-/g, "") + newId().replace(/-/g, ""),
    expiresAt,
  };

  state.inviteLinks.push(link);

  await saveState(state);

  return link;
}

export async function addDemoReceipt(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  transactionId: string | null;
}) {
  const state = await loadState();
  const transaction = input.transactionId ? state.transactions.find((item) => item.id === input.transactionId) : null;
  const id = newId();
  const now = new Date().toISOString();

  if (transaction) {
    Object.assign(transaction, {
      receipt: true,
      receiptId: id,
      receiptFile: input.fileName,
      receiptType: input.mimeType,
      reviewStatus: "Pending review",
    });
  }

  state.receipts.unshift({
    id,
    file: input.fileName,
    type: input.mimeType === "application/pdf" ? "PDF" : "JPG",
    sizeBytes: input.sizeBytes,
    transaction: transaction?.title ?? "Unassigned",
    transactionId: transaction?.id ?? null,
    assigned: Boolean(transaction),
    date: transaction?.date ?? now.slice(0, 10),
    amountMinor: transaction?.amountMinor ?? "0",
    status: "pending",
    uploadedByName: DEMO_USER_NAME,
    uploadedAt: now,
    reviewedByName: null,
    reviewedAt: null,
    canEdit: true,
    canDelete: true,
    dataUrl: input.dataUrl,
  });

  await saveState(state);

  return id;
}

export async function updateDemoReceipt(receiptId: string, patch: { fileName: string; transactionId: string | null }) {
  const state = await loadState();
  const receipt = state.receipts.find((item) => item.id === receiptId);

  if (!receipt) return false;

  const transaction = patch.transactionId ? state.transactions.find((item) => item.id === patch.transactionId) : null;

  receipt.file = patch.fileName;
  receipt.transactionId = transaction?.id ?? null;
  receipt.assigned = Boolean(transaction);
  receipt.transaction = transaction?.title ?? "Unassigned";
  receipt.date = transaction?.date ?? receipt.date;
  receipt.amountMinor = transaction?.amountMinor ?? "0";

  if (transaction) {
    Object.assign(transaction, {
      receipt: true,
      receiptId: receipt.id,
      receiptFile: receipt.file,
      receiptType: receipt.type,
    });
  }

  await saveState(state);

  return true;
}

export async function setDemoReceiptStatus(receiptId: string, status: "approved" | "rejected" | "pending") {
  const state = await loadState();
  const receipt = state.receipts.find((item) => item.id === receiptId);

  if (!receipt) return false;

  receipt.status = status;
  receipt.reviewedByName = status === "pending" ? null : DEMO_USER_NAME;
  receipt.reviewedAt = status === "pending" ? null : new Date().toISOString();

  const transaction = receipt.transactionId ? state.transactions.find((item) => item.id === receipt.transactionId) : null;

  if (transaction) {
    transaction.reviewStatus = status === "approved" ? "Approved" : status === "rejected" ? "Invalid" : "Pending review";
  }

  await saveState(state);

  return true;
}

export async function removeDemoReceipt(receiptId: string) {
  const state = await loadState();
  const receipt = state.receipts.find((item) => item.id === receiptId);

  if (!receipt) return false;

  const transaction = receipt.transactionId ? state.transactions.find((item) => item.id === receipt.transactionId) : null;

  if (transaction && transaction.receiptId === receiptId) {
    Object.assign(transaction, { receipt: false, receiptId: null, receiptFile: null, receiptType: null, reviewStatus: "Approved" });
  }

  state.receipts = state.receipts.filter((item) => item.id !== receiptId);

  await saveState(state);

  return true;
}

export async function reportKpisFromDemo() {
  const state = await loadState();
  const income = state.transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + BigInt(transaction.amountMinor), BigInt(0));
  const expense = state.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total - BigInt(transaction.amountMinor), BigInt(0));
  const liquid = state.wallets.reduce((total, wallet) => total + bookBalanceMinor(state, wallet.id), BigInt(0));
  const counts = state.cashCounts.length;
  const matching = state.cashCounts.filter((count) => count.differenceMinor === "0").length;

  return {
    liquidMinor: liquid.toString(),
    expenseMinor: expense.toString(),
    netMinor: (income - expense).toString(),
    reviewCount: state.receipts.filter((receipt) => receipt.status === "pending").length,
    reviewedReceiptCount: state.receipts.filter((receipt) => receipt.status === "approved").length,
    unassignedReceiptCount: state.receipts.filter((receipt) => !receipt.assigned).length,
    reconciliationPercent: counts === 0 ? 0 : Math.round((matching / counts) * 100),
  };
}
