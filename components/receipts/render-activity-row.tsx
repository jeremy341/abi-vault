import styles from "./ReceiptReviewDialog.module.css";
import { formatTimestamp } from "./format-timestamp";

export function renderActivityRow(
  label: string,
  name: string | null | undefined,
  timestamp: string | null | undefined,
) {
  if (!name) return null;

  return (
    <div>
      <dt>{label}</dt>
      <dd>{name}</dd>
      {timestamp ? <dd className={styles.when}>{formatTimestamp(timestamp)}</dd> : null}
    </div>
  );
}
