export type MemberRemovalError =
  | "SELF_REMOVAL_NOT_ALLOWED"
  | "LAST_ADMIN_REQUIRED"
  | string;

export function getMemberRemovalMessage(error: MemberRemovalError) {
  if (error === "SELF_REMOVAL_NOT_ALLOWED") {
    return "You cannot remove your own account.";
  }
  if (error === "LAST_ADMIN_REQUIRED") {
    return "The last administrator cannot be removed. Assign administrator access to another active member first.";
  }
  return "The person could not be removed.";
}
