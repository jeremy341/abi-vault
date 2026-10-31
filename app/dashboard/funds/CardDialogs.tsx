import AddCardModal from "@/components/dashboard/AddCardModal";
import EditCardModal from "@/components/dashboard/EditCardModal";
import type { AccountCardDetails } from "@/components/dashboard/AccountCard";
import type { CashRegisterCard } from "@/lib/finance/cash-register-card";

type CardDialogsProps = {
  activeCard: CashRegisterCard | undefined;
  isAddCardOpen: boolean;
  isEditCardOpen: boolean;
  onCloseAddCard: () => void;
  onCloseEditCard: () => void;
  onSaveNewCard: (details: AccountCardDetails, idempotencyKey: string) => Promise<boolean>;
  onUpdateCard: (details: AccountCardDetails) => Promise<boolean>;
  onRequestDelete: () => void;
};

export default function CardDialogs({
  activeCard,
  isAddCardOpen,
  isEditCardOpen,
  onCloseAddCard,
  onCloseEditCard,
  onSaveNewCard,
  onUpdateCard,
  onRequestDelete,
}: CardDialogsProps) {
  return (
    <>
      <AddCardModal
        key={isAddCardOpen ? "add-card-open" : "add-card-closed"}
        open={isAddCardOpen}
        onClose={onCloseAddCard}
        onSave={onSaveNewCard}
      />
      <EditCardModal
        key={activeCard?.id ?? "no-card"}
        open={isEditCardOpen}
        card={activeCard?.details ?? null}
        onClose={onCloseEditCard}
        onSave={onUpdateCard}
        onDelete={onRequestDelete}
      />
    </>
  );
}
