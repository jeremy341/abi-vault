export const previewCardNumber = "5789123456782847";

export function maskCardNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "5789 **** **** 2847";

  const display = Array.from(digits, (digit, index) =>
    index >= 4 && index < 12 ? "*" : digit,
  ).join("");

  return display.match(/.{1,4}/g)?.join(" ") ?? display;
}

export function isValidFutureExpiry(value: string, now = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;

  const expiryMonth = Number(match[1]);
  const expiryYear = 2000 + Number(match[2]);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    expiryYear > currentYear ||
    (expiryYear === currentYear && expiryMonth >= currentMonth)
  );
}
export function filterLetters(value: string, maxLength: number) {
  return value.replace(/[^\p{L}\s'-]/gu, "").slice(0, maxLength);
}
