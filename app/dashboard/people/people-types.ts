export type PersonRole = "Administrator" | "Supervisor" | "Member";

export type InviteRole = "Administrator" | "Supervisor";

export type Person = {
  id: string;
  name: string;
  role: PersonRole;
  access: string;
  status: "Active" | "Invitation pending" | "Inactive";
};

export type RoleInviteLink = {
  role: "admin" | "supervisor";
  url: string;
  expiresAt: string;
};

export type RoleLinks = Partial<Record<RoleInviteLink["role"], RoleInviteLink>>;

export type RoleCounts = {
  administrators: number;
  supervisors: number;
  members: number;
};
