import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/auth/local";
import SignUpPage from "./signup-page";

export default async function SignUpRoute() {
  // The local demo signs in automatically as the selected demo person.
  if (isLocalMode()) redirect("/dashboard");
  return <SignUpPage />;
}
