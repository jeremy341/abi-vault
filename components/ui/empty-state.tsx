import type { ReactNode } from "react";
import styles from "./empty-state.module.css";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.root} role="status">
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <strong>{title}</strong>
      <span>{description}</span>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
