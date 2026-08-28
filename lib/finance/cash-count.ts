export function calculateCashDenominationMinor(
  counts: Readonly<Record<string, number>>,
) {
  return Object.entries(counts).reduce(
    (sum, [denomination, count]) =>
      sum + Math.round(Number.parseFloat(denomination) * 100) * (count || 0),
    0,
  );
}
