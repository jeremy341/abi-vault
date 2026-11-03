"use client";

import styles from "./load-error.module.css";

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p className={styles.error} role="alert">
      <span>{message}</span>
      <button type="button" onClick={onRetry ?? (() => window.location.reload())}>
        Try again
      </button>
    </p>
  );
}
