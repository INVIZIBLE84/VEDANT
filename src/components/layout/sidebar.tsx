
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
import { BarChart3, DollarSign, CheckCircle, FileText, User, Settings, LayoutDashboard, LogOut, Bell, CalendarClock, ShieldCheck, DatabaseZap, Activity, BarChartBig } from "lucide-react"; // Added BarChartBig
import { cn } from "@/lib/utils";
import { UserRole, getCurrentUser } from "@/types/user"; // Import UserRole and fetch function
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Separator } from "@/components/ui/separator"; // Import Separator

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  isAdminSection?: boolean; // Flag for admin-specific sections
  isDashboardLink?: boolean; // Flag for role-specific dashboard links
}

// Updated navItems with specific dashboard links
const navItems: NavItem[] = [
  // Role-Specific Dashboards
   { href: "/dashboard/student", label: "My Dashboard", icon: <LayoutDashboard />, roles: ["student"], isDashboardLink: true },
   { href: "/dashboard/faculty", label: "Faculty Dashboard", icon: <LayoutDashboard />, roles: ["faculty"], isDashboardLink: true },
   // Admin Overview (acts as admin dashboard)
   { href: "/admin", label: "Admin Dashboard", icon: <LayoutDashboard />, roles: ["admin"], isAdminSection: true, isDashboardLink: true },

   // General Sections (Non-dashboard links)
  { href: "/attendance", label: "Attendance", icon: <BarChart3 />, roles: ["student", "faculty", "admin"] },
  { href: "/fees", label: "Fees", icon: <DollarSign />, roles: ["student", "admin"] },
  { href: "/clearance", label: "Clearance", icon: <CheckCircle />, roles: ["student", "faculty", "admin", "clearance_officer"] },
  { href: "/schedule", label: "Schedule", icon: <CalendarClock />, roles: ["student", "faculty"] },
  { href: "/documents", label: "Documents", icon: <FileText />, roles: ["student", "faculty", "admin", "print_cell"] },
  { href: "/notifications", label: "Notifications", icon: <Bell />, roles: ["student", "faculty", "admin", "print_cell", "clearance_officer"] },
  { href: "/profile", label: "Profile", icon: <User />, roles: ["student", "faculty", "admin", "print_cell", "clearance_officer"] },

  // Admin Sections (Excluding the main admin dashboard link which is now above)
  { href: "/admin/users", label: "Users", icon: <User />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/roles", label: "Roles", icon: <ShieldCheck />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/modules", label: "Modules", icon: <Settings />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChartBig />, roles: ["admin"], isAdminSection: true }, // Added Analytics link
  { href: "/admin/logs", label: "Logs", icon: <FileText />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/backups", label: "Backups", icon: <DatabaseZap />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: <Activity />, roles: ["admin"], isAdminSection: true }, // Changed icon to Activity as BellRing was duplicate
];

export function AppSidebar() {
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);


   // Fetch user role on component mount
   React.useEffect(() => {
     const fetchUserRole = async () => {
       setIsLoading(true);
       const user = await getCurrentUser(); // Fetch the current user
       setCurrentUserRole(user?.role ?? null); // Set the role, default to null if no user
       setIsLoading(false);
     };
     fetchUserRole();
   }, []);


   // Filter items based on the current user's role
  const filteredNavItems = navItems.filter(item => currentUserRole && item.roles.includes(currentUserRole));

  // Separate dashboard links, general links, and admin-specific links
  const dashboardLinks = filteredNavItems.filter(item => item.isDashboardLink);
  const generalNavItems = filteredNavItems.filter(item => !item.isDashboardLink && !item.isAdminSection);
  const adminNavItems = filteredNavItems.filter(item => item.isAdminSection && !item.isDashboardLink); // Exclude the main admin dashboard link here


  const renderMenuItems = (items: NavItem[]) => {
     // Sort admin items alphabetically by label
     if (items === adminNavItems) {
        items.sort((a, b) => a.label.localeCompare(b.label));
     }

     return items.map((item) => {
         const isActive = pathname === item.href || (item.href !== "/" && !item.isDashboardLink && pathname.startsWith(item.href));
         // Special check for admin root dashboard link
         const isAdminRootActive = item.href === "/admin" && pathname === "/admin";

          return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive || isAdminRootActive}
                    tooltip={item.label}
                    className={cn(
                      "transition-colors duration-200",
                       (isActive || isAdminRootActive)
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
          );
        });
  };

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
           {isLoading ? (
             // Show Skeleton loaders while fetching user role
             Array.from({ length: 8 }).map((_, index) => (
                <SidebarMenuItem key={`skel-${index}`}>
                     <SidebarMenuButton asChild disabled className="cursor-wait">
                         <a>
                             <Skeleton className="h-5 w-5 rounded" />
                            <Skeleton className="h-4 w-20 ml-2 group-data-[collapsible=icon]:hidden" />
                         </a>
                     </SidebarMenuButton>
                </SidebarMenuItem>
             ))
           ) : (
             <>
                 {/* Render Dashboard Link First */}
                 {renderMenuItems(dashboardLinks)}

                 {/* Separator if there are general items */}
                 {(generalNavItems.length > 0 || adminNavItems.length > 0) && <Separator className="my-2" />}

                 {/* Render General Items */}
                 {renderMenuItems(generalNavItems)}

                {/* Separator and Admin Section Header */}
                {adminNavItems.length > 0 && (
                    <>
                        <Separator className="my-2 group-data-[collapsible=icon]:hidden" />
                         <SidebarMenuItem className="px-2 py-1 group-data-[collapsible=icon]:hidden">
                             <span className="text-xs font-semibold text-muted-foreground">Admin Panel</span>
                         </SidebarMenuItem>
                        {renderMenuItems(adminNavItems)}
                    </>
                )}
             </>
           )}
           {!isLoading && !currentUserRole && (
                <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                         {/* Optionally link to login */}
                        <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Login Required</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-2 mt-auto">
        {/* TODO: Implement Logout */}
         <SidebarMenu>
            <SidebarMenuItem>
                 <SidebarMenuButton
                   tooltip="Logout"
                   className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
                    disabled={isLoading || !currentUserRole} // Disable if loading or not logged in
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
