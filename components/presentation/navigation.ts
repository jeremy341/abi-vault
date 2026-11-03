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
    description: "where the money stands today",
  },
  "/dashboard/transactions": {
    title: "Transactions",
    description: "every coin in, every coin out",
  },
  "/dashboard/receipts": {
    title: "Receipts",
    description: "paper proof, filed away",
  },
  "/dashboard/goals": {
    title: "Goals",
    description: "what we are saving for",
  },
  "/dashboard/funds": {
    title: "Cash registers",
    description: "the tins and what is in them",
  },
  "/dashboard/reports": {
    title: "Reports",
    description: "the numbers, plainly",
  },
  "/dashboard/people": {
    title: "People",
    description: "who helps keep the books",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "the class and its house rules",
  },
  "/dashboard/periods": {
    title: "Periods",
    description: "closing the month, carefully",
  },
} satisfies Record<string, { title: string; description: string }>;

export function pageInformationFor(pathname: string) {
  return pageInformation[pathname as keyof typeof pageInformation] ?? pageInformation["/dashboard"];
}
