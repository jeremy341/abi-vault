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

export function LoadingStatus({ loading, label = "Loading" }: { loading: boolean; label?: string }) {
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

export function InlineLoading({ label = "Loading", className }: { label?: string; className?: string }) {
  return <span className={cn(styles.inlineLoading, className)} role="status"><span className={styles.spinner} aria-hidden="true" />{label}</span>;
}

const SKELETON_WIDTHS = [
  ["58%", "22%"],
  ["44%", "18%"],
  ["66%", "26%"],
  ["52%", "20%"],
  ["62%", "16%"],
  ["48%", "24%"],
  ["56%", "18%"],
  ["40%", "22%"],
];

const SLOW_LOADING_MS = 6000;

function useSlowLoading(active: boolean, after = SLOW_LOADING_MS) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setSlow(true), after);

    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [active, after]);

  return slow;
}

export function SkeletonRows({ rows = 6, label }: { rows?: number; label?: string }) {
  return (
    <div className={styles.skeletonList} aria-busy="true">
      {label ? <span className={styles.status} role="status" aria-live="polite">{label}</span> : null}
      {Array.from({ length: rows }, (_, index) => {
        const [main, side] = SKELETON_WIDTHS[index % SKELETON_WIDTHS.length];

        return (
          <div
            className={styles.skeletonRow}
            key={index}
            aria-hidden="true"
            style={{ "--i": index, "--main": main, "--side": side } as CSSProperties}
          >
            <span />
            <span />
          </div>
        );
      })}
    </div>
  );
}

export function LoadingCollection({ loading, knownItemCount = 0, children, label, rows }: LoadingState & { emptyHeight?: string; children: ReactNode; label: string; rows?: number }) {
  const slow = useSlowLoading(loading && knownItemCount === 0);

  if (!loading || knownItemCount > 0) return <>{children}</>;

  return (
    <div data-loading-collection="true">
      <SkeletonRows rows={rows ?? 6} label={label} />
      {slow ? <p className={styles.slowHint}>Still loading. This is taking longer than usual.</p> : null}
    </div>
  );
}

export function PageSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className={styles.pageSkeleton}>
      <div className={styles.skeletonFigures} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SkeletonRows rows={8} label={label} />
    </div>
  );
}
