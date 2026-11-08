import { LOCAL_ORGANIZATION_ID } from "@/lib/auth/constants";

export function resolveLocalOrganizationId(
  selectedId: string | undefined,
  activeMembershipIds: readonly string[],
) {
  if (selectedId && activeMembershipIds.includes(selectedId)) return selectedId;
  if (activeMembershipIds.includes(LOCAL_ORGANIZATION_ID)) return LOCAL_ORGANIZATION_ID;
  if (activeMembershipIds[0]) return activeMembershipIds[0];
  throw new Error("The local demo user has no active class membership.");
}
