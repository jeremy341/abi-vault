import {
  fromIso,
  parseDate,
  type FilterType,
  type ReceiptFilter,
  type ReviewFilter,
  type Transaction,
} from "./view-model";

export type TransactionFilters = {
  query: string;
  category: string;
  type: "All" | FilterType;
  categories: string[];
  types: FilterType[];
  start: string;
  end: string;
  minimumAmount: string;
  maximumAmount: string;
  receipt: ReceiptFilter;
  review: ReviewFilter;
};

type PreparedFilters = {
  search: string;
  category: string;
  type: "All" | FilterType;
  categories: string[];
  types: FilterType[];
  startDate: Date | null;
  endDate: Date | null;
  minimumAmount: number | null;
  maximumAmount: number | null;
  receipt: ReceiptFilter;
  review: ReviewFilter;
};

function matchesFilters(
  transaction: Transaction,
  filters: PreparedFilters,
  date: Date,
) {
  const title = transaction.title.toLowerCase();
  const category = transaction.category.toLowerCase();
  const transactionDate = transaction.date.toLowerCase();
  const transactionType = transaction.amount >= 0 ? "Income" : "Expenses";

  if (filters.search && !`${title} ${category} ${transactionDate}`.includes(filters.search)) return false;

  if (filters.category !== "All" && transaction.category !== filters.category) return false;

  if (filters.type !== "All" && transactionType !== filters.type) return false;

  if (filters.categories.length && !filters.categories.includes(transaction.category)) return false;

  if (filters.types.length && !filters.types.includes(transactionType)) return false;

  if (filters.startDate && date < filters.startDate) return false;

  if (filters.endDate && date > filters.endDate) return false;

  const absoluteAmount = Math.abs(transaction.amount);

  if (filters.minimumAmount !== null && !(absoluteAmount >= filters.minimumAmount)) return false;

  if (filters.maximumAmount !== null && !(absoluteAmount <= filters.maximumAmount)) return false;

  if (filters.receipt === "Vorhanden" && !transaction.receipt) return false;

  if (filters.receipt === "Fehlt" && transaction.receipt) return false;

  if (filters.review !== "All" && transaction.reviewStatus !== filters.review) return false;

  return true;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
) {
  const preparedFilters: PreparedFilters = {
    search: filters.query.trim().toLowerCase(),
    category: filters.category,
    type: filters.type,
    categories: filters.categories,
    types: filters.types,
    startDate: filters.start ? fromIso(filters.start) : null,
    endDate: filters.end ? fromIso(filters.end) : null,
    minimumAmount: filters.minimumAmount
      ? Number(filters.minimumAmount.replace(",", "."))
      : null,
    maximumAmount: filters.maximumAmount
      ? Number(filters.maximumAmount.replace(",", "."))
      : null,
    receipt: filters.receipt,
    review: filters.review,
  };

  const matches: { transaction: Transaction; date: Date }[] = [];

  for (const transaction of transactions) {
    const date = parseDate(transaction.date);

    if (!matchesFilters(
      transaction,
      preparedFilters,
      date,
    )) {
      continue;
    }

    matches.push({ transaction, date });
  }

  matches.sort((left, right) => right.date.getTime() - left.date.getTime());

  return matches.map(({ transaction }) => transaction);
}
