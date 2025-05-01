// src/app/(requiresAuth)/admin/layout.tsx
// Note: This file now sits inside the (requiresAuth) directory

"use client"; // Client component for potential role-based checks or context usage

import * as React from "react";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

// The parent (requiresAuth)/layout.tsx handles the basic authentication check.
// This layout can perform additional role-specific checks if needed.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true); // Still useful for role check

    React.useEffect(() => {
        const checkAdminRole = async () => {
            setIsLoading(true);
            const currentUser = await getCurrentUser(); // Already authenticated by parent layout
            setUser(currentUser);
            setIsLoading(false);
        };
        checkAdminRole();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifying admin access...</p>
            </div>
        );
    }

    // Parent layout handles !user case. Here, we check the role.
    if (user?.role !== 'admin') {
        return (
             <div className="p-4 md:p-6">
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You must be an administrator to access this section.
                    </AlertDescription>
                </Alert>
             </div>
        );
    }

    // User is authenticated and is an admin
    return (
        <div className="admin-layout-container">
            {/* Add any admin-specific layout elements here if needed */}
            {children}
        </div>
    );
}
