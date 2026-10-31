"use client";

import { useState, useRef, type Dispatch, type SetStateAction } from "react";
import { createManualTransactionFromUi } from "@/features/finance/actions/manual-ui";
import { correctTransactionFromUi } from "@/features/finance/actions/corrections";
import { invalidateFinanceQuery } from "@/lib/finance/client-cache";
import {
  formatShortDate,
  fromIso,
  type Category,
  type Transaction,
} from "@/features/finance/transactions/view-model";

type CashRegister = { id: string; name: string };

type TransactionType = "Einnahme" | "Ausgabe";

type UseTransactionEditorOptions = {
  cashRegisters: readonly CashRegister[];
  userId: string | null;
  setItems: Dispatch<SetStateAction<Transaction[]>>;
  refetch: () => void;
  onCreated: () => void;
};

function directionFor(type: TransactionType): "income" | "expense" {
  if (type === "Einnahme") {
    return "income";
  }

  return "expense";
}

function defaultCategoryFor(type: TransactionType): Category {
  if (type === "Einnahme") {
    return "Sales";
  }

  return "Sonstiges";
}

function signedAmountFor(parsedAmount: number, type: TransactionType) {
  if (type === "Ausgabe") {
    return -Math.abs(parsedAmount);
  }

  return Math.abs(parsedAmount);
}

export function useTransactionEditor({
  cashRegisters,
  userId,
  setItems,
  refetch,
  onCreated,
}: UseTransactionEditorOptions) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Sales");
  const [type, setType] = useState<TransactionType>("Einnahme");
  const [correctionReason, setCorrectionReason] = useState("");

  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState(
    () => cashRegisters[0]?.id ?? "",
  );

  const idempotencyKey = useRef<string | null>(null);

  const activeCashRegisterId = selectedCashRegisterId || cashRegisters[0]?.id || "";

  const transactionDirection = directionFor(type);

  const categoryOptionNames: string[] = transactionDirection === "income"
    ? ["Sales"]
    : ["Material", "Sonstiges", "Veranstaltung"];

  if (editing?.type === transactionDirection && !categoryOptionNames.includes(editing.category)) {
    categoryOptionNames.unshift(editing.category);
  }

  const categoryOptions = categoryOptionNames.map((value) => ({ value, label: value }));

  function clearIdempotencyKey() {
    idempotencyKey.current = null;
  }

  function openAdd() {
    clearIdempotencyKey();
    setEditing(null);
    setTitle("");
    setAmount("");
    setCategory(defaultCategoryFor(type));
    setCorrectionReason("");
    setError("");
    setOpen(true);
  }

  function openEdit(transaction: Transaction) {
    clearIdempotencyKey();
    setEditing(transaction);
    setTitle(transaction.title);
    setAmount(Math.abs(transaction.amount).toFixed(2).replace(".", ","));
    setType(transaction.type === "income" ? "Einnahme" : "Ausgabe");
    setCategory(transaction.category);
    setCorrectionReason("");
    setError("");
    setOpen(true);
  }

  function close() {
    if (saving) return;

    clearIdempotencyKey();
    setOpen(false);
    setEditing(null);
    setCorrectionReason("");
    setError("");
  }

  async function save() {
    if (saving) return;

    const parsedAmount = Number(amount.replace(",", "."));

    if (
      !title.trim() ||
      !Number.isFinite(parsedAmount) ||
      (!editing && !activeCashRegisterId) ||
      (editing && !correctionReason.trim())
    ) {
      setError(
        editing
          ? "Complete the description, amount, and correction reason."
          : "Complete the cash register, description, and amount.",
      );

      return;
    }

    setSaving(true);
    setError("");

    const requestKey = idempotencyKey.current ?? `ui-${crypto.randomUUID()}`;
    idempotencyKey.current = requestKey;

    try {
      if (editing) {
        await saveCorrection(parsedAmount, requestKey);
      } else {
        await saveNewTransaction(parsedAmount, requestKey);
      }
    } catch {
      setError("The transaction could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCorrection(parsedAmount: number, requestKey: string) {
    if (!editing) return;

    const result = await correctTransactionFromUi({
      transactionId: editing.id.toString(),
      title: title.trim(),
      amount,
      direction: transactionDirection,
      categoryName: category,
      reason: correctionReason,
      idempotencyKey: requestKey,
    });

    if (!result.success) {
      setError(result.error.message);

      return;
    }

    setItems((current) => current.map((transaction) => {
      if (transaction.id !== editing.id) {
        return transaction;
      }

      return {
        ...transaction,
        id: result.data.id,
        title: title.trim(),
        amount: signedAmountFor(parsedAmount, type),
        type: transactionDirection,
        category,
        receipt: undefined,
        receiptId: null,
        receiptType: null,
        reviewStatus: "Pending review",
        createdByName: null,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        canEdit: true,
      };
    }));

    setOpen(false);
    setEditing(null);
    setCorrectionReason("");
    clearIdempotencyKey();

    invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");

    refetch();
  }

  async function saveNewTransaction(parsedAmount: number, requestKey: string) {
    const result = await createManualTransactionFromUi({
      title: title.trim(),
      amount,
      direction: transactionDirection,
      categoryName: category,
      walletId: activeCashRegisterId,
      idempotencyKey: requestKey,
    });

    if (!result.ok) {
      setError(result.error.message);

      return;
    }

    const cashRegister = cashRegisters.find((item) => item.id === activeCashRegisterId);

    setItems((current) => [
      {
        id: result.data.id,
        title: title.trim(),
        category,
        date: formatShortDate(fromIso(result.data.bookedAt)),
        amount: signedAmountFor(parsedAmount, type),
        reviewStatus: "Pending review",
        receiptId: null,
        receiptType: null,
        createdByName: null,
        createdAt: new Date().toISOString(),
        account: cashRegister?.name ?? "Unassigned",
        walletId: activeCashRegisterId,
        type: transactionDirection,
        createdBy: null,
        canEdit: true,
        canDelete: false,
      },
      ...current,
    ]);

    setTitle("");
    setAmount("");
    setOpen(false);
    clearIdempotencyKey();
    onCreated();

    invalidateFinanceQuery("transactions", "wallets", "dashboard-snapshot", "report-snapshot", "report-kpis");
  }

  function changeTitle(value: string) {
    clearIdempotencyKey();
    setTitle(value);
  }

  function changeAmount(value: string) {
    clearIdempotencyKey();
    setAmount(value);
  }

  function changeCategory(value: Category) {
    clearIdempotencyKey();
    setCategory(value);
  }

  function changeType(value: TransactionType) {
    clearIdempotencyKey();
    setType(value);
    setCategory(defaultCategoryFor(value));
  }

  function changeCorrectionReason(value: string) {
    clearIdempotencyKey();
    setCorrectionReason(value);
  }

  function changeCashRegister(value: string) {
    clearIdempotencyKey();
    setSelectedCashRegisterId(value);
  }

  return {
    open,
    editing,
    saving,
    error,
    title,
    amount,
    category,
    type,
    correctionReason,
    selectedCashRegisterId: activeCashRegisterId,
    activeCashRegisterId,
    categoryOptions,
    openAdd,
    openEdit,
    close,
    save,
    changeTitle,
    changeAmount,
    changeCategory,
    changeType,
    changeCorrectionReason,
    changeCashRegister,
  };
}
