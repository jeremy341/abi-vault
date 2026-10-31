import styles from "./receipts.module.css";

export function amountClassName(amount: string) {
  if (amount.startsWith("+")) return styles.positive;

  return styles.negative;
}
