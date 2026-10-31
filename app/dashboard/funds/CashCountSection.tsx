import CashCountDialog, {
  type CashBox,
  type CashCountInput,
  type SaveCashCountResult,
} from "@/app/dashboard/funds/CashCountDialog";
import { dollar } from "@/app/dashboard/funds/funds-helpers";

type CashCountSectionProps = {
  isOpen: boolean;
  activeCardId: string | undefined;
  cashBox: CashBox;
  onClose: () => void;
  onSave: (input: CashCountInput) => Promise<SaveCashCountResult>;
};

export default function CashCountSection({ isOpen, activeCardId, cashBox, onClose, onSave }: CashCountSectionProps) {
  if (!isOpen) return null;

  return (
    <CashCountDialog
      key={`cash-count-${activeCardId ?? "no-card"}`}
      cashBox={cashBox}
      formatMoney={dollar}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
