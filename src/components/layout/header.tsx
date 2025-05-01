"use client";

import * as React from "react"; // Import React for hooks
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Import Button
import { LogOut, Settings, User, Bell } from "lucide-react"; // Added Bell
import Link from "next/link";
import { AuthUser, getCurrentUser } from "@/types/user"; // Import types and fetch function
import { getUnreadNotificationCount } from "@/services/notifications"; // Import notification service
import { Badge } from "@/components/ui/badge"; // Import Badge


export function Header() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

   // Fetch user data and notification count on mount
   React.useEffect(() => {
     const fetchData = async () => {
       setIsLoading(true);
       const currentUser = await getCurrentUser();
       setUser(currentUser);
       if (currentUser) {
           try {
               const count = await getUnreadNotificationCount(currentUser.id);
               setUnreadCount(count);
           } catch (error) {
               console.error("Error fetching notification count:", error);
               // Handle error silently or show toast
           }
       }
       setIsLoading(false);
     };
     fetchData();
   }, []); // Refetch if user changes? Add user dependency if login/logout is instant

  const getInitials = (name: string | undefined) => {
     return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-end gap-4"> {/* Updated to justify-end and added gap */}
        {/* App Title (optional, can be in sidebar) - Removed for cleaner header */}
         {/* <Link href="/" className="hidden md:block">
            <h1 className="text-xl font-semibold text-primary">CampusConnect</h1>
         </Link> */}

         {/* Notification Bell */}
         {user && (
            <Button variant="ghost" size="icon" asChild>
                 <Link href="/notifications" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">View notifications</span>
                 </Link>
             </Button>
         )}


        {/* User Menu */}
        {isLoading ? (
             <Skeleton className="h-9 w-9 rounded-full" /> // Skeleton loader for avatar
        ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile picture"/>
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">Role: {user.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 {user.role === 'admin' && ( // Only show settings for admin
                    <DropdownMenuItem asChild>
                    {/* Link to the new admin modules page */}
                    <Link href="/admin/modules" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                    </DropdownMenuItem>
                 )}
                <DropdownMenuSeparator />
                {/* TODO: Implement Logout */}
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            // Optional: Show Login button if not logged in
            <Link href="/login"> {/* TODO: Create /login page */}
                <Button variant="outline" size="sm">Login</Button>
            </Link>
        )}
      </div>
    </header>
  );
}
