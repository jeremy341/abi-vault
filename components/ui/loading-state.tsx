"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./loading-state.module.css";

export type LoadingState = {
  loading: boolean;
  refreshing?: boolean;
  knownItemCount?: number;
};

export function useDelayedLoading(loading: boolean, delay = 160) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(loading),
      loading ? delay : 0,
    );
    return () => window.clearTimeout(timer);
  }, [delay, loading]);

  return loading && visible;
}

export function LoadingStatus({ loading, label = "Inhalte werden geladen…" }: { loading: boolean; label?: string }) {
  if (!loading) return null;
  return <span className={styles.status} role="status" aria-live="polite">{label}</span>;
}

export function LoadingText({ loading, children, className }: { loading: boolean; children: ReactNode; className?: string }) {
  return <span aria-hidden={loading || undefined} className={cn(styles.textSlot, loading && styles.loadingText, className)}>{children}</span>;
}

export function LoadingBlock({ loading, children, className }: { loading: boolean; children?: ReactNode; className?: string }) {
  if (!loading) return <>{children}</>;
  return <div aria-hidden="true" className={cn(styles.loadingBlock, className)} />;
}

export function InlineLoading({ label = "Wird geladen…", className }: { label?: string; className?: string }) {
  return <span className={cn(styles.inlineLoading, className)} role="status"><span className={styles.spinner} aria-hidden="true" />{label}</span>;
}

export function LoadingCollection({ loading, knownItemCount = 0, emptyHeight, children, label }: LoadingState & { emptyHeight: string; children: ReactNode; label: string }) {
  if (!loading || knownItemCount > 0) return <>{children}</>;
  return (
    <div
      className={styles.collectionLoading}
      style={{
        minHeight: emptyHeight,
        height: emptyHeight === "100%" ? "100%" : undefined,
      } as CSSProperties}
      data-loading-collection="true"
      aria-busy="true"
    >
      <InlineLoading label={label} />
    </div>
  );
}
