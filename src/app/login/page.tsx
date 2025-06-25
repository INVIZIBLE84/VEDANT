
"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import { authenticateUser } from "@/services/auth"; // Import mock authentication service
import { loginUser, getCurrentUser, UserRole } from "@/types/user"; // Import login simulation
import { useToast } from "@/hooks/use-toast";
import Image from "next/image"; // Import next/image

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const authResult = await authenticateUser(username, password);

      if (authResult.success && authResult.user) {
        // Simulate setting the logged-in state (in a real app, this would involve tokens/sessions)
        await loginUser(authResult.user.role); // Pass the role to simulate login

        toast({
          title: "Login Successful",
          description: `Welcome, ${authResult.user.name}! Redirecting...`,
        });

        // Re-fetch user to get updated state and redirect correctly
        // Small delay to allow state update simulation if needed
        await new Promise(res => setTimeout(res, 100));
        const loggedInUser = await getCurrentUser(); // Should now return the user based on loginUser call

        // Redirect based on role
        if (loggedInUser) {
            switch (loggedInUser.role) {
                case "student":
                  router.push("/dashboard/student");
                  break;
                case "faculty":
                   router.push("/dashboard/faculty");
                   break;
                 case "clearance_officer":
                   router.push("/clearance");
                   break;
                 case "print_cell":
                   router.push("/documents");
                   break;
                case "admin":
                  router.push("/admin");
                  break;
                default:
                  router.push("/"); // Fallback
            }
        } else {
             // Should not happen if login was successful, but handle defensively
             setError("Login succeeded but failed to retrieve user data.");
             setIsLoading(false);
        }

      } else {
        setError(authResult.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <Card className="w-full max-w-sm shadow-2xl border border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <Image
            src="/logo.png"
            alt="S.P.A.R.K. Logo"
            data-ai-hint="spark logo"
            width={219}
            height={55}
            className="mx-auto mb-4 h-auto"
            priority
          />
          <CardTitle className="text-2xl font-bold text-primary">Login</CardTitle>
          <CardDescription>
            Enter your username and password to access your dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your unique username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your secure password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Logging in..." : "Login"}
            </Button>
             <p className="text-xs text-muted-foreground text-center mt-2">
                Forgot your password? Contact Administrator.
             </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
