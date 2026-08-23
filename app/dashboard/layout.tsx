import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ResponsiveDashboardShell from "@/components/presentation/ResponsiveDashboardShell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return <ResponsiveDashboardShell>{children}</ResponsiveDashboardShell>;
}
