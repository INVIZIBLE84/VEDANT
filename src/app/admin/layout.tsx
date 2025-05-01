
"use client"; // Ensure client-side behavior for layout effects or context

import * as React from "react";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifying access...</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
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

    // User is admin, render the children within the layout structure
    return (
        <div className="admin-layout-container">
            {/* Add any admin-specific layout elements here if needed */}
            {children}
        </div>
    );
}
