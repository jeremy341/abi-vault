import { LoadingStatus } from "@/components/ui/loading-state";
import styles from "@/app/dashboard/funds/funds.module.css";

type FundsStatusProps = {
  loading: boolean;
  notice: string;
};

export default function FundsStatus({ loading, notice }: FundsStatusProps) {
  return (
    <>
      <LoadingStatus loading={loading} label="Loading cash registers" />

      <p className={styles.liveNotice} aria-live="polite">
        {notice}
      </p>
    </>
  );
}
