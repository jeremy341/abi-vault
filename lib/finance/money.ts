const USD_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:[.,]\d{1,2})?$/;

export function parseDollarToMinor(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  if (!USD_AMOUNT_PATTERN.test(normalized)) {
    throw new Error("INVALID_AMOUNT");
  }

  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function formatMinorDollar(amountMinor: bigint) {
  const sign = amountMinor < BigInt(0) ? "-" : "";
  const absolute = amountMinor < BigInt(0) ? -amountMinor : amountMinor;
  const whole = absolute / BigInt(100);
  const fraction = String(absolute % BigInt(100)).padStart(2, "0");

  return `${sign}$${whole.toLocaleString("en-US")}.${fraction}`;
}
