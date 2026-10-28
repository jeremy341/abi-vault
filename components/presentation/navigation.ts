export const navigationRoutes = [
  {
    label: "Overview",
    shortLabel: "Overview",
    href: "/dashboard",
  },
  {
    label: "Transactions",
    shortLabel: "Transactions",
    href: "/dashboard/transactions",
  },
  {
    label: "Receipts",
    shortLabel: "Receipts",
    href: "/dashboard/receipts",
  },
  {
    label: "Goals",
    shortLabel: "Goals",
    href: "/dashboard/goals",
  },
  {
    label: "Cash registers",
    shortLabel: "Cash register",
    href: "/dashboard/funds",
  },
  {
    label: "Reports",
    shortLabel: "Reports",
    href: "/dashboard/reports",
  },
  {
    label: "People",
    shortLabel: "People",
    href: "/dashboard/people",
  },
  {
    label: "Settings",
    shortLabel: "Settings",
    href: "/dashboard/settings",
  },
  {
    label: "Periods",
    shortLabel: "Periods",
    href: "/dashboard/periods",
  },
] as const;

export const adminOnlyRoutes = ["/dashboard/periods"] as const;

export function isCurrentRoute(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export const pageInformation = {
  "/dashboard": {
    title: "Overview",
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
} satisfies Record<string, { title: string; description: string }>;

export function pageInformationFor(pathname: string) {
  return pageInformation[pathname as keyof typeof pageInformation] ?? pageInformation["/dashboard"];
}
