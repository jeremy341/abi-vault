"use client";

import type { PresentationMode } from "@/hooks/use-presentation-mode";
import DesktopFunds from "./funds/DesktopFunds";
import PhoneFunds from "./funds/PhoneFunds";
import TabletFunds from "./funds/TabletFunds";
import type { AdaptiveFundsViewProps } from "./funds/funds-shared";

export type { AdaptiveFundsViewProps } from "./funds/funds-shared";

export default function AdaptiveFundsView(props: AdaptiveFundsViewProps) {
  const mode: PresentationMode = props.mode;

  if (mode === "desktop") return <DesktopFunds {...props} />;

  if (mode === "tablet") return <TabletFunds {...props} />;

  return <PhoneFunds {...props} />;
}
