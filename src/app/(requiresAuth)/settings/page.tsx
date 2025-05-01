
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Redirect users from the old /settings page to the new admin modules page.
// Placed within (requiresAuth) to ensure user is logged in, although admin layout handles role.
export default function SettingsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the main admin modules configuration page
        router.replace('/admin/modules');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-xl font-medium text-muted-foreground">Redirecting to Admin Settings...</h1>
            <p className="text-sm text-muted-foreground">System settings are now managed under the Admin Panel.</p>
        </div>
    );
}
