import { isValidFutureExpiry } from "@/lib/card-format";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasInvalidMonthDigits(digits: string) {
  if (digits.length > 0 && !["0", "1"].includes(digits[0])) {
    return true;
  }

  const month = digits.slice(0, 2);

  if (month.length < 2) {
    return false;
  }

  return month === "00" || Number(month) > 12;
}

export function formatCardNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 16);
  const groups = digits.match(/.{1,4}/g);

  if (!groups) {
    return "";
  }

  return groups.join(" ");
}

export function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return digits;
}

export function hasExpiryInputError(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (hasInvalidMonthDigits(digits)) {
    return true;
  }

  const next = formatExpiry(value);

  if (next.length !== 5) {
    return false;
  }

  return !isValidFutureExpiry(next);
}
