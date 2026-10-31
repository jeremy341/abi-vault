"use client";

import { useState } from "react";
import { pageWindow } from "@/hooks/use-pagination";
import { filterTransactions, type TransactionFilters } from "@/features/finance/transactions/filter-transactions";
import {
  formatLongDate,
  formatShortDate,
  fromIso,
  type FilterType,
  type Transaction,
} from "@/features/finance/transactions/view-model";

type DraftFilters = Pick<
  TransactionFilters,
  | "categories"
  | "types"
  | "start"
  | "end"
  | "minimumAmount"
  | "maximumAmount"
  | "receipt"
  | "review"
>;

function emptyFilters(): TransactionFilters {
  return {
    query: "",
    category: "All",
    type: "All",
    categories: [],
    types: [],
    start: "",
    end: "",
    minimumAmount: "",
    maximumAmount: "",
    receipt: "All",
    review: "All",
  };
}

function draftFrom(filters: TransactionFilters): DraftFilters {
  return {
    categories: filters.categories,
    types: filters.types,
    start: filters.start,
    end: filters.end,
    minimumAmount: filters.minimumAmount,
    maximumAmount: filters.maximumAmount,
    receipt: filters.receipt,
    review: filters.review,
  };
}

function countActiveFilters(filters: TransactionFilters) {
  const activeChecks = [
    Boolean(filters.query.trim()),
    filters.category !== "All",
    filters.type !== "All",
    filters.categories.length > 0,
    filters.types.length > 0,
    Boolean(filters.start || filters.end),
    Boolean(filters.minimumAmount || filters.maximumAmount),
    filters.receipt !== "All",
    filters.review !== "All",
  ];

  return activeChecks.filter(Boolean).length;
}

function dateRangeLabel(start: string, end: string) {
  if (!start && !end) {
    return "Select period";
  }

  const startLabel = start ? formatLongDate(formatShortDate(fromIso(start))) : "Start";
  const endLabel = end ? formatLongDate(formatShortDate(fromIso(end))) : "today";

  return `${startLabel} to ${endLabel}`;
}

function toggleItem<T>(items: T[], item: T) {
  if (items.includes(item)) {
    return items.filter((selected) => selected !== item);
  }

  return [...items, item];
}

export function useTransactionFilters(
  transactions: Transaction[],
  pageSize: number,
) {
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState<DraftFilters>(() => draftFrom(emptyFilters()));
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filteredTransactions = filterTransactions(transactions, filters);

  const pagination = pageWindow(filteredTransactions.length, pageSize, page);

  const visibleTransactions = filteredTransactions.slice(
    pagination.offset,
    pagination.offset + pageSize,
  );

  const activeFilterCount = countActiveFilters(filters);

  const dateLabel = dateRangeLabel(filters.start, filters.end);

  function setQuery(query: string) {
    setFilters((current) => ({ ...current, query }));
    setPage(1);
  }

  function setCategory(category: string) {
    setFilters((current) => ({ ...current, category }));
    setPage(1);
  }

  function setType(type: "All" | FilterType) {
    setFilters((current) => ({ ...current, type }));
    setPage(1);
  }

  function openDateDialog() {
    setDraft(draftFrom(filters));
    setDateDialogOpen(true);
  }

  function openFilterDialog() {
    setDraft(draftFrom(filters));
    setFilterDialogOpen(true);
  }

  function applyDraftFilters() {
    setFilters((current) => ({ ...current, ...draft }));
    setPage(1);
    setFilterDialogOpen(false);
    setDateDialogOpen(false);
  }

  function resetFilters() {
    const defaults = emptyFilters();

    setFilters(defaults);
    setDraft(draftFrom(defaults));
    setPage(1);
    setFilterDialogOpen(false);
    setDateDialogOpen(false);
  }

  function resetDraftDateRange() {
    setDraft((current) => ({ ...current, start: "", end: "" }));
  }

  function setDraftStart(start: string) {
    setDraft((current) => ({ ...current, start }));
  }

  function setDraftEnd(end: string) {
    setDraft((current) => ({ ...current, end }));
  }

  function setDraftMinimumAmount(minimumAmount: string) {
    setDraft((current) => ({ ...current, minimumAmount }));
  }

  function setDraftMaximumAmount(maximumAmount: string) {
    setDraft((current) => ({ ...current, maximumAmount }));
  }

  function setDraftReceiptFilter(receipt: TransactionFilters["receipt"]) {
    setDraft((current) => ({ ...current, receipt }));
  }

  function setDraftReviewFilter(review: TransactionFilters["review"]) {
    setDraft((current) => ({ ...current, review }));
  }

  function toggleDraftCategory(category: string) {
    setDraft((current) => ({
      ...current,
      categories: toggleItem(current.categories, category),
    }));
  }

  function toggleDraftType(type: FilterType) {
    setDraft((current) => ({
      ...current,
      types: toggleItem(current.types, type),
    }));
  }

  return {
    filters,
    draft,
    filterDialogOpen,
    dateDialogOpen,
    page: pagination.currentPage,
    pageCount: pagination.pageCount,
    rangeStart: pagination.rangeStart,
    rangeEnd: pagination.rangeEnd,
    visibleTransactions,
    filteredCount: filteredTransactions.length,
    activeFilterCount,
    dateLabel,
    setPage,
    setQuery,
    setCategory,
    setType,
    setFilterDialogOpen,
    setDateDialogOpen,
    openDateDialog,
    openFilterDialog,
    applyDraftFilters,
    resetFilters,
    resetDraftDateRange,
    setDraftStart,
    setDraftEnd,
    setDraftMinimumAmount,
    setDraftMaximumAmount,
    setDraftReceiptFilter,
    setDraftReviewFilter,
    toggleDraftCategory,
    toggleDraftType,
  };
}
