import Sidebar from "@/components/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar />

      <SidebarInset>
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <SidebarTrigger />
        </header>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
