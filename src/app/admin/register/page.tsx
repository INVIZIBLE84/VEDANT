
"use client";

import * as React from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, UserPlus } from "lucide-react";
import { UserRole } from "@/types/user";
import { addUser, type UserUpdateData } from "@/services/admin"; // Import admin service function
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const username = formData.get('username') as string; // Assuming username is needed for login
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const role = formData.get('role') as UserRole;
    const department = formData.get('department') as string || undefined;
    const studentId = formData.get('studentId') as string || undefined;
    const facultyId = formData.get('facultyId') as string || undefined;

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
    }

    // Basic password strength check (example)
    if (password.length < 8) {
         setError("Password must be at least 8 characters long.");
         setIsLoading(false);
         return;
    }

    const userData: UserUpdateData & { username?: string; password?: string } = {
      name,
      email,
      username, // Include username if needed for login/ID generation
      password,
      role,
      department,
      studentId,
      facultyId,
    };

    try {
      const result = await addUser(userData);

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `User ${result.user?.name} created successfully.`,
        });
        router.push('/admin/users'); // Redirect back to user list after success
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border border-primary/20">
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
          <CardTitle className="text-2xl font-bold text-primary">Register New User</CardTitle>
          <CardDescription>
            Fill in the details to create a new user account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegisterSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" type="text" placeholder="Enter full name" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="Enter email address" required disabled={isLoading} />
            </div>
             <div className="space-y-2">
               <Label htmlFor="username">Username *</Label>
               <Input id="username" name="username" type="text" placeholder="Create a unique username" required disabled={isLoading} />
             </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" placeholder="Create a password" required disabled={isLoading} />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="confirmPassword">Confirm Password *</Label>
                   <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter password" required disabled={isLoading} />
                 </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select name="role" required disabled={isLoading}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="print_cell">Print Cell</SelectItem>
                        <SelectItem value="clearance_officer">Clearance Officer</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             {/* Optional Fields */}
             <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" type="text" placeholder="Enter department (optional)" disabled={isLoading} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" name="studentId" type="text" placeholder="If student (optional)" disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facultyId">Faculty ID</Label>
                    <Input id="facultyId" name="facultyId" type="text" placeholder="If faculty (optional)" disabled={isLoading} />
                  </div>
             </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Registering..." : "Register User"}
            </Button>
             <Button type="button" variant="outline" className="w-full" onClick={() => router.back()} disabled={isLoading}>
                Cancel
             </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
