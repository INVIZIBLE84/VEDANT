"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger, // Keep for consistency if needed elsewhere, though header has one
} from "@/components/ui/sidebar";
import { BarChart3, DollarSign, CheckCircle, FileText, User, Settings, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Implement role-based access control
type UserRole = "student" | "faculty" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard />, roles: ["student", "faculty", "admin"] },
  { href: "/attendance", label: "Attendance", icon: <BarChart3 />, roles: ["student", "faculty", "admin"] },
  { href: "/fees", label: "Fees", icon: <DollarSign />, roles: ["student", "admin"] },
  { href: "/clearance", label: "Clearance", icon: <CheckCircle />, roles: ["student", "admin"] },
  { href: "/documents", label: "Documents", icon: <FileText />, roles: ["student", "faculty", "admin"] },
  { href: "/profile", label: "Profile", icon: <User />, roles: ["student", "faculty", "admin"] },
  { href: "/settings", label: "Settings", icon: <Settings />, roles: ["admin"] }, // Example: Settings only for admin
];

export function AppSidebar() {
  const pathname = usePathname();
  const currentUserRole: UserRole = "admin"; // TODO: Replace with actual user role from context/auth

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4">
         {/* Logo/App Name for Sidebar */}
         <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            {/* Replace with actual SVG logo if available */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
           <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden text-foreground">CampusConnect</span>
         </Link>
         {/* Mobile trigger might be redundant if header handles it, but keep for potential standalone use */}
         {/* <SidebarTrigger className="md:hidden" /> */}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className={cn(
                    "transition-colors duration-200",
                     pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <a>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-2 mt-auto">
        {/* TODO: Implement Logout */}
         <SidebarMenu>
            <SidebarMenuItem>
                 <SidebarMenuButton
                   tooltip="Logout"
                   className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
                 >
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                 </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
