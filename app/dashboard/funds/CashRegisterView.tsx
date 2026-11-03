import FundsView from "@/components/presentation/funds/FundsView";
import type { CashRegisterCard } from "@/lib/finance/cash-register-card";
import type { CashBox } from "@/app/dashboard/funds/CashCountDialog";
import type { CashAuditEntry } from "@/app/dashboard/funds/funds-page-types";
import { dollar } from "@/app/dashboard/funds/funds-helpers";
import type { DifferenceReview } from "@/app/dashboard/funds/difference-review";
import DifferenceSuggestions from "@/app/dashboard/funds/DifferenceSuggestions";

type CashRegisterViewProps = {
  differenceReview: DifferenceReview | null;
  loading: boolean;
  loadError: string;
  onRetry: () => void;
  cards: CashRegisterCard[];
  activeCard: CashRegisterCard | undefined;
  activeCardIndex: number;
  cashBox: CashBox;
  auditLogs: CashAuditEntry[];
  onSwitchCard: (direction: -1 | 1) => void;
  onSelectCard: (index: number) => void;
  onAddCard: () => void;
  onEditCard: () => void;
  onCountCash: () => void;
};

export default function CashRegisterView({
  differenceReview,
  loading,
  loadError,
  onRetry,
  cards,
  activeCard,
  activeCardIndex,
  cashBox,
  auditLogs,
  onSwitchCard,
  onSelectCard,
  onAddCard,
  onEditCard,
  onCountCash,
}: CashRegisterViewProps) {
  return (
    <FundsView
      loading={loading}
      error={loadError || null}
      onRetry={onRetry}
      cards={cards}
      activeCard={activeCard}
      activeCardIndex={activeCardIndex}
      cashBox={cashBox}
      auditLogs={auditLogs}
      activities={[]}
      dollar={dollar}
      differencePanel={differenceReview ? <DifferenceSuggestions review={differenceReview} /> : undefined}
      onSwitchCard={onSwitchCard}
      onSelectCard={onSelectCard}
      onAddCard={onAddCard}
      onEditCard={onEditCard}
      onCountCash={onCountCash}
    />
  );
}
