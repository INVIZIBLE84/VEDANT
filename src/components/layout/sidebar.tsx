
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // Import next/image
import { usePathname, useRouter } from "next/navigation"; // Import useRouter
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
import { BarChart3, DollarSign, CheckCircle, FileText, User as UserIcon, Settings, LayoutDashboard, LogOut, Bell, CalendarClock, ShieldCheck, DatabaseZap, BellRing as BellRingIconLucide, Activity, BarChartBig } from "lucide-react"; // Renamed User to UserIcon, BellRing to BellRingIconLucide
import { cn } from "@/lib/utils";
import { UserRole, getCurrentUser, logoutUser, AuthUser } from "@/types/user"; // Import UserRole, fetch function, and logoutUser
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Separator } from "@/components/ui/separator"; // Import Separator
import { useToast } from "@/hooks/use-toast"; // Import useToast

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
  { href: "/profile", label: "Profile", icon: <UserIcon />, roles: ["student", "faculty", "admin", "print_cell", "clearance_officer"] },

  // Admin Sections (Excluding the main admin dashboard link which is now above)
  { href: "/admin/users", label: "Users", icon: <UserIcon />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/roles", label: "Roles", icon: <ShieldCheck />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/modules", label: "Modules", icon: <Settings />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChartBig />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/logs", label: "Logs", icon: <Activity />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/backups", label: "Backups", icon: <DatabaseZap />, roles: ["admin"], isAdminSection: true },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: <BellRingIconLucide />, roles: ["admin"], isAdminSection: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter(); // Hook for navigation
  const { toast } = useToast(); // Hook for toasts
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(null); // Changed to store full user object
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false); // State for logout operation


   // Fetch user role on component mount and path change
   React.useEffect(() => {
     const fetchUser = async () => {
       setIsLoading(true);
       const user = await getCurrentUser(); // Fetch the current user
       console.log("AppSidebar: Fetched user in useEffect:", user); // Debug log
       setCurrentUser(user); // Set the full user object
       setIsLoading(false);
     };
     fetchUser();
   }, [pathname]); // Re-run when the path changes


   // Filter items based on the current user's role
  const filteredNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  // Separate dashboard links, general links, and admin-specific links
  const dashboardLinks = filteredNavItems.filter(item => item.isDashboardLink);
  const generalNavItems = filteredNavItems.filter(item => !item.isDashboardLink && !item.isAdminSection);
  const adminNavItems = filteredNavItems.filter(item => item.isAdminSection && !item.isDashboardLink); // Exclude the main admin dashboard link here


  const handleLogout = async () => {
      setIsLoggingOut(true); // Indicate logout in progress
      try {
          await logoutUser(); // Call the simulated logout function
          setCurrentUser(null); // Clear local user state
          toast({
              title: "Logged Out",
              description: "You have been successfully logged out.",
          });
          router.push('/login'); // Redirect to login page
      } catch (error) {
           console.error("Logout error:", error);
           toast({
               variant: "destructive",
               title: "Logout Failed",
               description: "Could not log you out. Please try again.",
           });
           setIsLoggingOut(false); // Reset loading state on error
      }
      // setIsLoggingOut(false) will be implicitly handled by navigation on success
  };

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
      <SidebarHeader className="flex flex-col items-center justify-center p-4"> {/* Centering content */}
         <Link href="/" className="flex flex-col items-center gap-2 overflow-hidden">
             <Image
                src="/logo.png"
                alt="S.P.A.R.K. Logo"
                data-ai-hint="spark logo"
                width={700}
                height={176}
                className="h-auto max-w-full group-data-[collapsible=icon]:w-[40px] group-data-[collapsible=icon]:h-auto"
                priority
             />
         </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
           {isLoading ? (
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
           ) : currentUser ? (
             <>
                 {renderMenuItems(dashboardLinks)}

                 {(generalNavItems.length > 0 || adminNavItems.length > 0) && <Separator className="my-2" />}

                 {renderMenuItems(generalNavItems)}

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
           ) : (
                <SidebarMenuItem>
                    <SidebarMenuButton disabled asChild>
                        <Link href="/login" className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                            Login Required
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="p-2 mt-auto">
         <SidebarMenu>
            <SidebarMenuItem>
                 <SidebarMenuButton
                   tooltip="Logout"
                   className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
                    disabled={isLoading || !currentUser || isLoggingOut}
                    onClick={handleLogout}
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
