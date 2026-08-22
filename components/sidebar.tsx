"use client";

import AbiLogo from "@/components/AbiLogo";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import dashboardStyles from "@/app/dashboard/dashboard.module.css";
import ThemeToggle from "@/components/ThemeToggle";

const navigationItems = [
  { label: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Transaktionen",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  { label: "Belege", href: "/dashboard/receipts", icon: FileText },
  { label: "Ziele", href: "/dashboard/goals", icon: Target },
  { label: "Kasse & Konten", href: "/dashboard/funds", icon: WalletCards },
  { label: "Berichte", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Personen", href: "/dashboard/people", icon: Users },
  { label: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="overflow-hidden rounded-l-3xl border-sidebar-border bg-white dark:bg-sidebar"
    >
      <SidebarHeader className={`${dashboardStyles.sidebarHeader} px-6 py-7`}>
        <AbiLogo className="ml-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className={`${dashboardStyles.sidebarGroup} px-4 py-3`}>
          <SidebarGroupContent>
            <SidebarMenu className={`${dashboardStyles.sidebarMenu} gap-2`}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      aria-label={item.label}
                      title={item.label}
                      className={`${dashboardStyles.sidebarMenuButton} h-14 gap-3 rounded-xl px-4 text-[15px] text-black/55 transition-[background-color,color,transform] duration-200 hover:translate-x-0.5 hover:bg-black/[0.025] hover:text-ink active:scale-[0.99] data-active:bg-black/[0.045] data-active:text-ink motion-reduce:transform-none dark:text-white/65 dark:hover:bg-white/[0.06] dark:hover:text-white dark:data-active:bg-white/[0.1] dark:data-active:text-white [&_svg]:size-5 [&_svg]:stroke-[1.7]`}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex px-4 py-4">
        <ThemeToggle />
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
