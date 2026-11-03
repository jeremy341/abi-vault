export type {
  AccountingPeriodListItem,
  CashCountListItem,
  TransactionListItem,
} from "./queries-types";

export {
  listGoalsForCurrentOrganization,
  listReceiptsForCurrentOrganization,
  listTransactionsForCurrentOrganization,
  listWalletsForCurrentOrganization,
} from "./finance-queries";

export {
  getCommitteeSettingsForCurrentOrganization,
  listAccountingPeriodsForCurrentOrganization,
  listCashCountsForCurrentOrganization,
  listMembersForCurrentOrganization,
} from "./organization-queries";

export {
  getDashboardSnapshot,
  getReportKpisForCurrentOrganization,
  getReportSnapshot,
} from "./snapshot-queries";

import type { getDashboardSnapshot } from "./snapshot-queries";

export type DashboardResult = Awaited<ReturnType<typeof getDashboardSnapshot>>;

