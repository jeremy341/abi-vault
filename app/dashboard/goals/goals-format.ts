import type { DashboardResult } from "@/features/finance/actions/queries";

export type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  progress: number;
  date: string;
  deadline: string;
};

type DashboardGoal = Extract<DashboardResult, { ok: true }>["goals"][number];

type DashboardData = Extract<DashboardResult, { ok: true }>;

export const displayGoalDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const dollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const dollarPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function toGoal(goal: DashboardGoal): Goal {
  const target = Number(goal.target_amount_minor) / 100;
  const saved = Number(goal.saved_amount_minor) / 100;

  return {
    id: goal.id,
    title: goal.title,
    target,
    saved,
    progress: target ? Math.round((saved / target) * 100) : 0,
    date: displayGoalDate(goal.deadline),
    deadline: goal.deadline,
  };
}

export function goalsFromDashboard(data: DashboardData) {
  return data.goals.map(toGoal);
}
