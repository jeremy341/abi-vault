import { isLocalMode } from "@/lib/auth/local";
import ClerkJoinPage from "./clerk-join-page";
import LocalJoinPage from "./local-join-page";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (isLocalMode()) return <LocalJoinPage token={token} />;
  return <ClerkJoinPage token={token} />;
}
