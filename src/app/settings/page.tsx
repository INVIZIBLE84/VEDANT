import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// TODO: Implement actual settings based on user role (Admin primarily)
// This is a placeholder page.

export default function SettingsPage() {
  // TODO: Check user role. If not admin, show an access denied message or redirect.
  const isAdmin = true; // Assume admin for now

  if (!isAdmin) {
    return (
       <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access the settings page.
        </AlertDescription>
      </Alert>
    )
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>

      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Manage application settings (Admin Only).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is currently under development. Administrators will be able to configure user roles, manage system parameters, and view audit logs here.
          </p>
          {/* Placeholder for future settings forms/options */}
           <div className="mt-6 grid gap-4">
                <div className="p-4 border rounded-lg bg-muted/50">User Management (Coming Soon)</div>
                <div className="p-4 border rounded-lg bg-muted/50">Notification Settings (Coming Soon)</div>
                <div className="p-4 border rounded-lg bg-muted/50">Theme Customization (Coming Soon)</div>
                <div className="p-4 border rounded-lg bg-muted/50">Audit Logs (Coming Soon)</div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
