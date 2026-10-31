export type DetectiveTransaction = {
  id: string;
  title: string;
  direction: "income" | "expense";
  amountMinor: bigint;
  bookedAt: string;
  periodLocked: boolean;
};

export type DifferenceSuggestionKind =
  | "double-entry"
  | "wrong-entry"
  | "sign-flip"
  | "digits-swapped"
  | "denomination"
  | "unrecorded-expense"
  | "no-match";

export type DifferenceSuggestion = {
  kind: DifferenceSuggestionKind;
  transactionId: string | null;
  periodLocked: boolean;
};

const ZERO = BigInt(0);
const TWO = BigInt(2);
const MAX_SUGGESTIONS = 3;

const DENOMINATIONS_MINOR = [
  BigInt(5000),
  BigInt(2000),
  BigInt(1000),
  BigInt(500),
  BigInt(200),
  BigInt(100),
  BigInt(50),
  BigInt(25),
  BigInt(10),
];

function absoluteValue(value: bigint) {
  return value < ZERO ? -value : value;
}

function swappedNeighbourDigits(amountMinor: bigint): bigint[] {
  const digits = amountMinor.toString().split("");
  const variants: bigint[] = [];

  for (let index = 0; index < digits.length - 1; index += 1) {
    const swapped = [...digits];
    const first = swapped[index];

    swapped[index] = swapped[index + 1];
    swapped[index + 1] = first;
    variants.push(BigInt(swapped.join("")));
  }

  return variants;
}

function suggestionFor(kind: DifferenceSuggestionKind, transaction: DetectiveTransaction): DifferenceSuggestion {
  return { kind, transactionId: transaction.id, periodLocked: transaction.periodLocked };
}

function findDoubleEntry(candidates: readonly DetectiveTransaction[], size: bigint) {
  return candidates.find((transaction, index) =>
    transaction.amountMinor === size &&
    candidates.some((other, otherIndex) =>
      otherIndex !== index &&
      other.amountMinor === size &&
      other.title === transaction.title &&
      other.bookedAt === transaction.bookedAt,
    ),
  );
}

function findDigitsSwapped(transactions: readonly DetectiveTransaction[], size: bigint) {
  return transactions.find((transaction) =>
    swappedNeighbourDigits(transaction.amountMinor).some(
      (variant) => absoluteValue(transaction.amountMinor - variant) === size,
    ),
  );
}

export function explainDifference(
  differenceMinor: bigint,
  transactions: readonly DetectiveTransaction[],
): DifferenceSuggestion[] {
  if (differenceMinor === ZERO) {
    return [];
  }

  const size = absoluteValue(differenceMinor);
  const direction = differenceMinor > ZERO ? "expense" : "income";
  const candidates = transactions.filter((transaction) => transaction.direction === direction);
  const suggestions: DifferenceSuggestion[] = [];

  const duplicate = findDoubleEntry(candidates, size);

  if (duplicate) {
    suggestions.push(suggestionFor("double-entry", duplicate));
  }

  const sameAmount = candidates.find((transaction) => transaction.amountMinor === size);

  if (sameAmount) {
    suggestions.push(suggestionFor("wrong-entry", sameAmount));
  }

  const flipped = candidates.find((transaction) => transaction.amountMinor * TWO === size);

  if (flipped) {
    suggestions.push(suggestionFor("sign-flip", flipped));
  }

  const swapped = findDigitsSwapped(transactions, size);

  if (swapped) {
    suggestions.push(suggestionFor("digits-swapped", swapped));
  }

  if (DENOMINATIONS_MINOR.includes(size)) {
    suggestions.push({ kind: "denomination", transactionId: null, periodLocked: false });
  }

  if (suggestions.length === 0) {
    const kind = direction === "income" ? "unrecorded-expense" : "no-match";

    suggestions.push({ kind, transactionId: null, periodLocked: false });
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
