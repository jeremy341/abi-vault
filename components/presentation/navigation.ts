import {
  BarChart3,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Target,
  Users,
  WalletCards,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Overview",
    shortLabel: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    shortLabel: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  {
    label: "Receipts",
    shortLabel: "Receipts",
    href: "/dashboard/receipts",
    icon: FileText,
  },
  {
    label: "Goals",
    shortLabel: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    label: "Cash registers",
    shortLabel: "Cash register",
    href: "/dashboard/funds",
    icon: WalletCards,
  },
  {
    label: "Reports",
    shortLabel: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "People",
    shortLabel: "People",
    href: "/dashboard/people",
    icon: Users,
  },
  {
    label: "Settings",
    shortLabel: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Periods",
    shortLabel: "Periods",
    href: "/dashboard/periods",
    icon: CalendarClock,
  },
] as const;

export const pageInformation: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Financial overview",
    description: "Class finances at a glance.",
  },
  "/dashboard/transactions": {
    title: "Transactions",
    description: "All income and expenses in one view.",
  },
  "/dashboard/receipts": {
    title: "Receipts",
    description: "Upload, review, and assign receipts.",
  },
  "/dashboard/goals": {
    title: "Goals",
    description: "Plan savings goals and track progress.",
  },
  "/dashboard/funds": {
    title: "Cash registers",
    description: "Manage cash registers and balances.",
  },
  "/dashboard/reports": {
    title: "Reports",
    description: "Review financial data with clarity.",
  },
  "/dashboard/people": {
    title: "People",
    description: "Manage members and roles.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure workspace and access.",
  },
  "/dashboard/periods": {
    title: "Periods",
    description: "Open and safely close accounting periods.",
  },
};
