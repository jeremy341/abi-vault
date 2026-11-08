export function memberDisplayName(id: string, name: string) {
  return id === "u1" ? "Demo User" : name;
}

export function isCurrentMember(id: string, userId: string | null) {
  return id === userId || id === "u1";
}
