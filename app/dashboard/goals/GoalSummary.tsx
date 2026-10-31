import { LoadingText } from "@/components/ui/loading-state";
import ledger from "../ledger.module.css";
import { dollar } from "./goals-format";

type GoalSummaryProps = {
  loading: boolean;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  onAddGoal: () => void;
};

export function GoalSummary({ loading, totalSaved, totalTarget, overallProgress, onAddGoal }: GoalSummaryProps) {
  return (
    <div className={ledger.summary}>
      <dl className={ledger.figures}>
        <div>
          <dt>Saved</dt>
          <dd><LoadingText loading={loading}>{dollar.format(totalSaved)}</LoadingText></dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd><LoadingText loading={loading}>{dollar.format(totalTarget)}</LoadingText></dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd><LoadingText loading={loading}>{overallProgress}%</LoadingText></dd>
        </div>
      </dl>
      <button type="button" className={ledger.primaryButton} onClick={onAddGoal} disabled={loading}>
        Add goal
      </button>
    </div>
  );
}
