import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AccountCard from "@/components/dashboard/AccountCard";
import {
  InlineLoading,
} from "@/components/ui/loading-state";
import {
  mapWalletToCashRegisterCard,
  type CashRegisterWallet,
} from "@/lib/finance/cash-register-card";
import type { DashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import desktopStyles from "@/app/dashboard/dashboard-desktop.module.css";

export default function DashboardCashCarousel({
  snapshot,
  loading,
  error,
  selectedWalletId,
  onSelectWallet,
  onPreview,
}: {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: string | null;
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
  onPreview: (wallet: CashRegisterWallet) => void;
}) {
  const wallets =
    snapshot?.wallets.filter((wallet) => wallet.type === "cash") ?? [];

  if (loading) {
    return (
      <div className={desktopStyles.cashCardCarousel} aria-busy="true">
        <div className={desktopStyles.cashCardCarouselCard}>
          <InlineLoading label="Cash register is loading…" />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className={desktopStyles.cashCardCarousel} aria-hidden="true" />
    );

  if (!wallets.length)
    return (
      <Link
        href="/dashboard/funds"
        className={desktopStyles.accountCard}
        aria-label="Create cash register"
      >
        <AccountCard variant="add" />
      </Link>
    );

  const selectedIndex = wallets.findIndex(
    (wallet) => wallet.id === selectedWalletId,
  );

  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const wallet = wallets[safeIndex];
  const card = mapWalletToCashRegisterCard(wallet);

  return (
    <div className={desktopStyles.cashCardCarousel}>
      {wallets.length > 1 ? (
        <button
          type="button"
          aria-label="Previous cash register"
          onClick={() =>
            onSelectWallet(
              wallets[(safeIndex - 1 + wallets.length) % wallets.length].id,
            )
          }
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        className={desktopStyles.cashCardCarouselCard}
        aria-label={`View ${wallet.name}`}
        onClick={() => onPreview(wallet)}
      >
        <AccountCard cardColor={card.details.color} details={card.details} />
      </button>
      {wallets.length > 1 ? (
        <button
          type="button"
          aria-label="Next cash register"
          onClick={() =>
            onSelectWallet(wallets[(safeIndex + 1) % wallets.length].id)
          }
        >
          <ChevronRight aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
