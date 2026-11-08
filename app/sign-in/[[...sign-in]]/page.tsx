import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/auth/local";
import LoginPage from "./login-page";

export default async function SignInRoute(props: Parameters<typeof LoginPage>[0]) {
  // The local demo signs in automatically as the selected demo person.
  if (isLocalMode()) redirect("/dashboard");
  return <LoginPage {...props} />;
}
