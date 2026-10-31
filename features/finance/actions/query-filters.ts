export function transactionsForCashWallets(walletIds: readonly string[]) {
  const walletFilter = walletIds.map((id) => `"${id}"`).join(",");

  return [
    `and(correction_role.is.null,from_wallet_id.in.(${walletFilter}))`,
    `and(correction_role.is.null,to_wallet_id.in.(${walletFilter}))`,
    `and(correction_role.neq.reversal,from_wallet_id.in.(${walletFilter}))`,
    `and(correction_role.neq.reversal,to_wallet_id.in.(${walletFilter}))`,
  ].join(",");
}
