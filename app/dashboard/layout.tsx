import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import styles from "./dashboard.module.css";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  return (
    <div className={`${styles.shell} bg-canvas dark:bg-background`}>
      <SidebarProvider
        className={`${styles.frame} relative mx-auto w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm dark:border-white/10 dark:bg-card`}
        style={
          {
            "--sidebar-width": "var(--dashboard-sidebar-width)",
          } as React.CSSProperties
        }
      >
        <Sidebar />

        <SidebarInset
          className={`${styles.main} min-w-0 bg-white dark:bg-background`}
        >
          <DashboardHeader />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
