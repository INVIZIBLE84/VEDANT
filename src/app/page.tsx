"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Loader2 } from "lucide-react";

export default function RootRedirectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState<AuthUser | null>(null); // Store user to check auth state

  React.useEffect(() => {
    const determineRedirect = async () => {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser); // Store the fetched user

      if (!currentUser) {
        // Redirect to login page if not authenticated
        console.log("No user found, redirecting to /login.");
        router.replace('/login');
        // No need to explicitly set loading to false here, router.replace handles it
        return;
      }

      // Redirect based on role if user is authenticated
      console.log(`User found with role: ${currentUser.role}. Redirecting...`);
      switch (currentUser.role) {
        case "student":
          router.replace("/dashboard/student");
          break;
        case "faculty":
           router.replace("/dashboard/faculty");
           break;
         case "clearance_officer":
           router.replace("/clearance");
           break;
         case "print_cell":
           router.replace("/documents");
           break;
        case "admin":
          router.replace("/admin");
          break;
        default:
          // Fallback for any other roles or unexpected scenarios
           console.log("Unknown role, redirecting to /login.");
          router.replace("/login"); // Redirect unknown roles to login as well
      }
       // Loading state will be implicitly handled by the navigation
    };

    determineRedirect();
    // Intentionally excluding router from dependencies to avoid potential loops
    // if router object itself changes identity frequently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading indicator while determining authentication status and redirecting
  if (isLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-xl font-medium text-muted-foreground">Checking authentication...</h1>
        </div>
     );
  }

  // This part should ideally not be reached if redirection logic works correctly,
  // but provides a fallback message if the user isn't logged in and somehow isn't redirected.
  // It will also show briefly if the redirect to /login happens.
   return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
       <h1 className="text-2xl font-bold text-primary mb-4">Welcome to S.P.A.R.K.</h1>
       <p className="text-muted-foreground">Redirecting to login...</p>
       {/* Login button might not be needed here if redirect is reliable */}
       {/* <Link href="/login"><Button>Login</Button></Link> */}
     </div>
   );
}
