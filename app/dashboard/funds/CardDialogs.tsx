import CashRegisterDialog from "@/components/dashboard/CashRegisterDialog";
import { defaultCardColor, type AccountCardDetails } from "@/components/dashboard/account-card-details";
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
      {isAddCardOpen ? (
        <CashRegisterDialog
          mode="add"
          onClose={onCloseAddCard}
          onSave={({ name, holder }, idempotencyKey) =>
            onSaveNewCard(
              { accountName: name, holder, cardNumber: "", expiry: "", color: defaultCardColor },
              idempotencyKey,
            )
          }
        />
      ) : null}
      {isEditCardOpen && activeCard ? (
        <CashRegisterDialog
          key={activeCard.id}
          mode="edit"
          initialName={activeCard.details.accountName}
          initialHolder={activeCard.details.holder}
          onClose={onCloseEditCard}
          onSave={({ name, holder }) =>
            onUpdateCard({
              accountName: name,
              holder,
              cardNumber: activeCard.details.cardNumber ?? "",
              expiry: activeCard.details.expiry ?? "",
              color: activeCard.details.color ?? defaultCardColor,
            })
          }
          onArchive={onRequestDelete}
        />
      ) : null}
    </>
  );
}
