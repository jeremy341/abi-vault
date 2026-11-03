export type ApplicationRole = "admin" | "supervisor" | "student";

export type ClerkApplicationMetadata = {
  abiVaultRole?: string;
};

export function applicationRoleFromMetadata(
  metadata?: ClerkApplicationMetadata | null,
): ApplicationRole | null {
  const role = metadata?.abiVaultRole;

  return role === "admin" || role === "supervisor" || role === "student"
    ? role
    : null;
}

export function applicationRoleFromClerkRole(
  role: string | null | undefined,
  metadata?: ClerkApplicationMetadata | null,
): ApplicationRole {
  const metadataRole = applicationRoleFromMetadata(metadata);

  if (metadataRole) return metadataRole;

  if (role === "org:admin" || role === "admin") return "admin";

  if (role === "org:supervisor" || role === "supervisor") return "supervisor";

  return "student";
}
