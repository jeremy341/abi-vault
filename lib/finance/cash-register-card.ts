import type { AccountCardDetails } from "@/components/dashboard/AccountCard";

export type CashRegisterCard = {
  id: string;
  details: Pick<AccountCardDetails, "accountName"> &
    Partial<Omit<AccountCardDetails, "accountName">>;
  balance: number;
};

export type CashRegisterWallet = {
  id: string;
  name: string;
  balanceMinor: string | number;
  cardNumberVisual?: string | null;
  cardHolderVisual?: string | null;
  cardExpiryVisual?: string | null;
  cardColorVisual?: string | null;
};

export function mapWalletToCashRegisterCard(
  wallet: CashRegisterWallet,
): CashRegisterCard {
  return {
    id: wallet.id,
    details: {
      accountName: wallet.name,
      cardNumber: wallet.cardNumberVisual ?? undefined,
      holder: wallet.cardHolderVisual ?? undefined,
      expiry: wallet.cardExpiryVisual ?? undefined,
      color: wallet.cardColorVisual ?? "#111114",
    },
    balance: Number(wallet.balanceMinor) / 100,
  };
}
