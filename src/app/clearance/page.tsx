import * as React from "react"; // Added import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { getClearanceStatus, type ClearanceStatus } from "@/services/clearance"; // Assuming service exists
import { cn } from "@/lib/utils";


// Helper to determine badge variant and icon based on status
const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return { variant: 'default', icon: <CheckCircle className="h-4 w-4 text-green-500" />, className: "bg-green-100 text-green-800 border-green-300" };
    case 'pending':
      return { variant: 'secondary', icon: <Clock className="h-4 w-4 text-yellow-500" />, className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    case 'rejected':
      return { variant: 'destructive', icon: <XCircle className="h-4 w-4 text-red-500" />, className: "bg-red-100 text-red-800 border-red-300"};
    default:
      return { variant: 'outline', icon: null, className: "" };
  }
};


export default async function ClearancePage() {
  // TODO: Replace 'student123' with actual logged-in student ID
  const studentId = 'student123';
  const clearanceStatuses: ClearanceStatus[] = await getClearanceStatus(studentId);

   // Check overall clearance status
  const allApproved = clearanceStatuses.every(status => status.status.toLowerCase() === 'approved');
  const anyPending = clearanceStatuses.some(status => status.status.toLowerCase() === 'pending');
  const anyRejected = clearanceStatuses.some(status => status.status.toLowerCase() === 'rejected');

  let overallStatus = "Pending";
  let overallStatusStyle = getStatusStyle("pending");

  if (allApproved && clearanceStatuses.length > 0) {
      overallStatus = "Approved";
      overallStatusStyle = getStatusStyle("approved");
  } else if (anyRejected) {
      overallStatus = "Rejected";
      overallStatusStyle = getStatusStyle("rejected");
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Clearance Status</h1>

       {/* Overall Status */}
       <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
            <CardTitle>Overall Clearance Status</CardTitle>
             <CardDescription>Your final clearance status based on all departments.</CardDescription>
        </CardHeader>
         <CardContent className="flex items-center justify-center p-6">
            <Badge variant={overallStatusStyle.variant} className={cn("text-lg px-4 py-2", overallStatusStyle.className)}>
                 {overallStatusStyle.icon && React.cloneElement(overallStatusStyle.icon, { className: "mr-2 h-5 w-5" })}
                {overallStatus}
            </Badge>
         </CardContent>
       </Card>


      {/* Department-wise Status */}
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Department Clearance</CardTitle>
          <CardDescription>Status of clearance requests for each department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clearanceStatuses.length > 0 ? (
                clearanceStatuses.map((status) => {
                   const style = getStatusStyle(status.status);
                   return (
                      <TableRow key={status.department}>
                        <TableCell className="font-medium">{status.department}</TableCell>
                        <TableCell className="text-center">
                           <Badge variant={style.variant} className={cn("text-xs", style.className)}>
                              {style.icon && React.cloneElement(style.icon, { className: "mr-1 h-3 w-3" })}
                             {status.status}
                           </Badge>
                        </TableCell>
                      </TableRow>
                   );
                 })
              ) : (
                 <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No clearance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
