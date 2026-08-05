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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  { label: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transaktionen", href: "/dashboard/transactions", icon: ReceiptText },
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
      className="border-sidebar-border bg-white"
    >
      <SidebarHeader className="px-4 py-6">
        <AbiLogo className="ml-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-11 px-3 text-muted-foreground data-active:bg-blue-50 data-active:text-black-600"
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

      <SidebarFooter className="px-4 py-4">
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Abi 2026
        </p>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
