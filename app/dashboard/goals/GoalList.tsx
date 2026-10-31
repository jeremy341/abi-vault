import { LoadingCollection, LoadingText } from "@/components/ui/loading-state";
import ledger from "../ledger.module.css";
import { dollar, dollarPrecise, type Goal } from "./goals-format";

type GoalListProps = {
  goals: Goal[];
  loading: boolean;
  onAddGoal: () => void;
  onEditGoal: (goal: Goal, index: number) => void;
};

export function GoalList({ goals, loading, onAddGoal, onEditGoal }: GoalListProps) {
  return (
    <section className={ledger.section}>
      <header className={ledger.sectionHeader}>
        <h2>Goals</h2>
        <p><LoadingText loading={loading}>{goals.length} active</LoadingText></p>
      </header>
      <div>
        <LoadingCollection loading={loading} knownItemCount={goals.length} emptyHeight="10rem" label="Loading goals">
          {goals.length ? (
            <ul className={ledger.list}>
              {goals.map((goal, index) => (
                <li key={goal.id}>
                  <button type="button" className={ledger.rowButton} onClick={() => onEditGoal(goal, index)}>
                    <span className={ledger.rowTitle}>
                      <span>{goal.title}</span>
                      <span className={ledger.rowMeta}>By {goal.date}</span>
                    </span>
                    <span className={ledger.line} role="presentation">
                      <i style={{ width: `${Math.min(100, goal.progress)}%` }} />
                    </span>
                    <span className={ledger.rowEnd}>
                      <span>{dollarPrecise.format(goal.saved)} of {dollar.format(goal.target)}</span>
                      <span className={ledger.rowMeta}>{goal.progress}%, {dollarPrecise.format(Math.max(0, goal.target - goal.saved))} to go</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={ledger.empty}>
              No goals yet.{" "}
              <button type="button" className={ledger.textButton} onClick={onAddGoal}>Add one</button>
            </p>
          )}
        </LoadingCollection>
      </div>
    </section>
  );
}
