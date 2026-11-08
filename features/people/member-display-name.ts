export function getMemberDisplayName({
  displayName,
  email,
  isLocalDemoUser,
}: {
  displayName: string | null | undefined;
  email: string | null | undefined;
  isLocalDemoUser: boolean;
}) {
  if (isLocalDemoUser) return "Demo User";
  return displayName || email || "Unbekannt";
}
