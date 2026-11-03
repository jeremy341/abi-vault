import type { AccountCardDetails } from "@/components/dashboard/account-card-details";

export type CashRegisterCard = {
  id: string;
  details: Pick<AccountCardDetails, "accountName"> &
    Partial<Omit<AccountCardDetails, "accountName">>;
  balance: number;
  lastCountAt?: string;
  lastCountDifference?: number;
};

export type CashRegisterWallet = {
  id: string;
  name: string;
  balanceMinor: string | number;
  lastCountAt?: string | null;
  lastCountedAmountMinor?: string | number | null;
  lastCountDifferenceMinor?: string | number | null;
  lastCountedByName?: string | null;
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
      color: wallet.cardColorVisual ?? "#242426",
    },
    balance: Number(wallet.balanceMinor) / 100,
    lastCountAt: wallet.lastCountAt ?? undefined,
    lastCountDifference:
      wallet.lastCountDifferenceMinor == null ? undefined : Number(wallet.lastCountDifferenceMinor) / 100,
  };
}
