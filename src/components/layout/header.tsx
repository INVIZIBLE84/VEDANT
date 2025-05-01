"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";


export function Header() {
  // TODO: Replace with actual user data and authentication logic
  const user = { name: "Admin User", email: "admin@campusconnect.edu", avatarUrl: "https://picsum.photos/40/40?random=1" };
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center justify-between">
        {/* App Title (optional, can be in sidebar) */}
         <Link href="/" className="hidden md:block">
            <h1 className="text-xl font-semibold text-primary">CampusConnect</h1>
         </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile picture"/>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Implement Logout */}
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
