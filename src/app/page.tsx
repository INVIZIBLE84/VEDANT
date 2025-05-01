"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Loader2 } from "lucide-react";

export default function RootRedirectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const determineRedirect = async () => {
      setIsLoading(true);
      const user = await getCurrentUser();

      if (!user) {
        // Redirect to login page if not authenticated
        // router.replace('/login'); // TODO: Uncomment when login page exists
        setIsLoading(false); // For now, stop loading if no user
        console.log("No user found, staying on root (or redirect to login later).");
        return;
      }

      // Redirect based on role
      switch (user.role) {
        case "student":
          router.replace("/dashboard/student");
          break;
        case "faculty":
           router.replace("/dashboard/faculty");
           break;
         case "clearance_officer": // Redirect clearance officer to clearance page
           router.replace("/clearance");
           break;
         case "print_cell": // Redirect print cell to documents page
           router.replace("/documents");
           break;
        case "admin":
          router.replace("/admin"); // Admins go to their specific dashboard
          break;
        default:
          // Fallback for any other roles or unexpected scenarios
          router.replace("/"); // Or a generic landing page
          setIsLoading(false);
      }
      // Note: setIsLoading(false) happens implicitly on navigation change
    };

    determineRedirect();
  }, [router]);

  if (isLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-xl font-medium text-muted-foreground">Loading Dashboard...</h1>
        </div>
     );
  }

  // Render a simple message if no user and no redirect (e.g., for future login page)
   return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
       <h1 className="text-2xl font-bold text-primary mb-4">Welcome to CampusConnect</h1>
       <p className="text-muted-foreground">Please log in to continue.</p>
       {/* TODO: Add Login Button/Link */}
     </div>
   );
}
