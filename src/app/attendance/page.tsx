import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { getAttendance, type Attendance } from "@/services/attendance"; // Assuming service exists

export default async function AttendancePage() {
  // TODO: Replace 'student123' with actual logged-in student ID
  const studentId = 'student123';
  const attendanceData: Attendance[] = await getAttendance(studentId);

  // Calculate summary
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(att => att.isPresent).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Attendance</h1>

      {/* Attendance Summary */}
       <Card className="transform transition-transform duration-300 hover:shadow-lg">
         <CardHeader>
           <CardTitle>Attendance Summary</CardTitle>
           <CardDescription>Your attendance overview for the current period.</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-secondary/10 rounded-lg">
                <span className="text-2xl font-bold text-secondary">{totalDays}</span>
                <span className="text-sm text-muted-foreground">Total Days</span>
            </div>
             <div className="flex flex-col items-center p-4 bg-green-500/10 rounded-lg">
                <span className="text-2xl font-bold text-green-600">{presentDays}</span>
                <span className="text-sm text-muted-foreground">Present</span>
            </div>
             <div className="flex flex-col items-center p-4 bg-red-500/10 rounded-lg">
                <span className="text-2xl font-bold text-red-600">{absentDays}</span>
                <span className="text-sm text-muted-foreground">Absent</span>
            </div>
             <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
                <span className="text-2xl font-bold text-primary">{attendancePercentage}%</span>
                <span className="text-sm text-muted-foreground">Percentage</span>
            </div>
         </CardContent>
       </Card>

      {/* Detailed Attendance Records */}
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Detailed Records</CardTitle>
          <CardDescription>List of attendance records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.length > 0 ? (
                attendanceData.map((record) => (
                  <TableRow key={record.date}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      {record.isPresent ? (
                        <Check className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No attendance records found.
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
