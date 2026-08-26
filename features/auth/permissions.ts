import "server-only";

export const APP_ROLES = ["admin", "supervisor", "student"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = {
  viewTransparency: ["admin", "supervisor", "student"],
  viewOperationalTransactions: ["admin", "supervisor"],
  viewReceipts: ["admin", "supervisor"],
  uploadReceipts: ["admin", "supervisor"],
  reviewReceipts: ["admin", "supervisor"],
  createTransactions: ["admin", "supervisor"],
  editOpenTransactions: ["admin", "supervisor"],
  softDeleteOpenTransactions: ["admin", "supervisor"],
  lockPeriods: ["admin"],
  unlockPeriods: ["admin"],
  manageGoals: ["admin", "supervisor"],
  manageWallets: ["admin", "supervisor"],
  manageMemberships: ["admin"],
  viewAuditLogs: ["admin", "supervisor"],
  exportData: ["admin", "supervisor"],
} as const satisfies Record<string, readonly AppRole[]>;

export function hasPermission(
  role: AppRole,
  permission: keyof typeof PERMISSIONS,
) {
  return PERMISSIONS[permission].includes(role as never);
}
