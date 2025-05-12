
"use client"; // Required for hooks and interactions

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Loader2, CalendarDays, BarChart2, Download, AlertTriangle } from "lucide-react";
import {
    getStudentAttendance,
    calculateAttendanceSummary,
    markAttendance,
    getTodayAttendanceStatus,
    type AttendanceRecord,
    type AttendanceSummary,
    UserRole, // Import UserRole type
    getAttendanceForFaculty, // Import faculty function
    getAttendanceForAdmin, // Import admin function
    manualAttendanceOverride, // Import admin override function
    exportAttendanceToCSV // Import export function
} from "@/services/attendance";
import { getCurrentUser } from "@/types/user"; // Import getCurrentUser
import { cn } from "@/lib/utils";
import { format } from "date-fns"; // Ensure format is imported

const MOCK_CLASS_ID = "CS101"; // Keep for faculty view simulation, replace later

export default function AttendancePage() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [todayStatus, setTodayStatus] = useState<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDateString, setCurrentDateString] = useState<string>('');

  // --- Fetch User and Data Effect ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentDateString(new Date().toLocaleDateString()); // Set date string after mount

      const currentUser = await getCurrentUser();
      if (!currentUser) {
         setIsLoading(false);
         setError("User not authenticated.");
         return;
      }

      setUserRole(currentUser.role);
      setUserId(currentUser.id);
      if (currentUser.role === 'faculty') setFacultyId(currentUser.facultyId ?? currentUser.id);
      if (currentUser.role === 'admin') setAdminId(currentUser.id);

      try {
        let data: AttendanceRecord[] = [];
        if (currentUser.role === 'student') {
          data = await getStudentAttendance(currentUser.id);
          const status = await getTodayAttendanceStatus(currentUser.id);
          setTodayStatus(status);
        } else if (currentUser.role === 'faculty' && (currentUser.facultyId || currentUser.id)) {
          data = await getAttendanceForFaculty(currentUser.facultyId ?? currentUser.id, MOCK_CLASS_ID);
        } else if (currentUser.role === 'admin') {
          data = await getAttendanceForAdmin();
        }

        setAttendanceData(data);
        if (currentUser.role === 'student' || currentUser.role === 'admin') {
            setSummary(calculateAttendanceSummary(data));
        }

      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance data. Please try again.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch attendance records.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);


  // --- Handle Mark Attendance ---
  const handleMarkAttendance = async () => {
    if (userRole !== 'student' || !userId) {
         toast({ variant: "destructive", title: "Error", description: "Cannot mark attendance." });
        return;
    }
    setIsMarking(true);
    setError(null);
    try {
      const locationData = { wifiSsid: 'Campus-WiFi' };
      const result = await markAttendance(userId, locationData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        const status = await getTodayAttendanceStatus(userId);
        setTodayStatus(status);
         const updatedData = await getStudentAttendance(userId);
         setAttendanceData(updatedData);
         setSummary(calculateAttendanceSummary(updatedData));
      } else {
        setError(result.message);
        toast({
          variant: "destructive",
          title: "Failed to Mark Attendance",
          description: result.message,
        });
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      setError("An unexpected error occurred while marking attendance.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not mark attendance.",
      });
    } finally {
      setIsMarking(false);
    }
  };

    // --- Handle Download CSV ---
  const handleDownloadCSV = async () => {
      if (!userRole) return;
      try {
          const csvData = await exportAttendanceToCSV(attendanceData);
          const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          if (link.download !== undefined) {
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", `attendance_report_${userRole}_${new Date().toISOString().split('T')[0]}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
           toast({ title: "Success", description: "CSV report download initiated." });
      } catch (error) {
          console.error("Failed to generate CSV:", error);
          toast({ variant: "destructive", title: "Error", description: "Failed to generate CSV report." });
      }
  };


  // --- Render Loading/Error States ---
  if (isLoading) {
    return (
       <div className="space-y-6">
         <h1 className="text-3xl font-bold text-primary">Attendance</h1>
         <Card>
            <CardHeader><CardTitle>Loading Attendance...</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="h-10 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-40 bg-muted rounded animate-pulse"></div>
                <div className="h-60 bg-muted rounded animate-pulse"></div>
            </CardContent>
         </Card>
       </div>
    );
  }

   if (error && !isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Attendance</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
   }

  // --- Render Different Views Based on Role ---
  const renderStudentView = () => (
    <>
      {/* Today's Status & Mark Attendance */}
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
           <CardDescription>{currentDateString ? `Status for ${currentDateString}.` : `Loading date...`} Make sure you are on campus!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {todayStatus?.status === 'Present' && <Check className="h-6 w-6 text-green-500" />}
            {todayStatus?.status === 'Absent' && <X className="h-6 w-6 text-red-500" />}
            {todayStatus?.status === 'Not Marked' && <Clock className="h-6 w-6 text-yellow-500" />}
            <span className={cn(
                "text-lg font-semibold",
                todayStatus?.status === 'Present' && "text-green-600",
                todayStatus?.status === 'Absent' && "text-red-600",
                todayStatus?.status === 'Not Marked' && "text-yellow-600"
            )}>
                {todayStatus?.status ?? 'Loading...'}
                {todayStatus?.time && ` at ${todayStatus.time}`}
            </span>
          </div>
          <Button
            onClick={handleMarkAttendance}
            disabled={isMarking || todayStatus?.status === 'Present'}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {isMarking ? "Marking..." : (todayStatus?.status === 'Present' ? "Already Marked" : "Mark Attendance")}
          </Button>
        </CardContent>
         {error && <CardFooter><Alert variant="destructive" className="w-full"><AlertDescription>{error}</AlertDescription></Alert></CardFooter>}
      </Card>

      {/* Attendance Summary */}
      {summary && (
         <Card className="transform transition-transform duration-300 hover:shadow-lg">
           <CardHeader>
             <CardTitle>Attendance Summary</CardTitle>
             <CardDescription>Your overview for the recorded period.</CardDescription>
           </CardHeader>
           <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryBox label="Total Days" value={summary.totalDays} color="secondary" />
              <SummaryBox label="Present" value={summary.presentDays} color="green" />
              <SummaryBox label="Absent" value={summary.absentDays} color="red" />
              <SummaryBox label="Percentage" value={`${summary.attendancePercentage}%`} color="primary" />
           </CardContent>
         </Card>
      )}

       {/* Mini Calendar View */}
       <Card className="transform transition-transform duration-300 hover:shadow-lg">
         <CardHeader>
             <CardTitle>Attendance Calendar</CardTitle>
             <CardDescription>Your attendance history at a glance.</CardDescription>
         </CardHeader>
          <CardContent className="flex justify-center">
             <Calendar
                mode="multiple"
                selected={attendanceData.filter(r => r.isPresent).map(r => new Date(r.date))}
                modifiers={{
                    absent: attendanceData.filter(r => !r.isPresent).map(r => new Date(r.date)),
                }}
                modifiersClassNames={{
                    selected: 'bg-green-500/20 text-green-800 rounded-full',
                    absent: 'bg-red-500/20 text-red-800 rounded-full line-through',
                }}
                className="rounded-md border p-3"
              />
          </CardContent>
       </Card>

      {/* Detailed Records Table */}
       {renderDetailedTable(attendanceData)}
    </>
  );

  const renderFacultyView = () => (
    <>
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Class Attendance: {MOCK_CLASS_ID}</CardTitle>
          <CardDescription>Real-time view and management for your class.</CardDescription>
           <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!attendanceData.length}>
                    <Download className="mr-1 h-4 w-4" /> Export CSV
                </Button>
           </div>
        </CardHeader>
        <CardContent>
           {renderDetailedTable(attendanceData, true)}
        </CardContent>
      </Card>
    </>
  );

  const renderAdminView = () => (
    <>
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Global Attendance Overview</CardTitle>
          <CardDescription>Manage and view attendance across the institution.</CardDescription>
           <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!attendanceData.length}>
                    <Download className="mr-1 h-4 w-4" /> Export CSV
                </Button>
           </div>
        </CardHeader>
        <CardContent>
           {summary && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   <SummaryBox label="Total Records" value={summary.totalDays} color="secondary" />
                   <SummaryBox label="Total Present" value={summary.presentDays} color="green" />
                   <SummaryBox label="Total Absent" value={summary.absentDays} color="red" />
                    <SummaryBox label="Overall %" value={`${summary.attendancePercentage}%`} color="primary" />
               </div>
           )}
           {renderDetailedTable(attendanceData, true)}
        </CardContent>
      </Card>
    </>
  );

  // --- Helper: Detailed Table ---
 const renderDetailedTable = (data: AttendanceRecord[], showStudentName = false) => (
    <Card className="transform transition-transform duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>Detailed Records</CardTitle>
         <CardDescription>List of {userRole === 'student' ? 'your' : 'all'} recorded attendance.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
               {showStudentName && <TableHead>Student</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Time Marked</TableHead>
               <TableHead className="hidden md:table-cell">Remarks</TableHead>
               {userRole === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.sort((a,b) => b.date.localeCompare(a.date)).map((record) => (
                <TableRow key={record.id}>
                   {showStudentName && <TableCell>{record.studentName || record.studentId}</TableCell>}
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    {record.isPresent ? (
                      <Check className="h-5 w-5 text-green-500 inline-block" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 inline-block" />
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {record.timestamp ? format(new Date(record.timestamp), 'p') : 'N/A'}
                  </TableCell>
                   <TableCell className="hidden md:table-cell text-muted-foreground">{record.remarks || '-'}</TableCell>
                    {userRole === 'admin' && (
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" >Override</Button>
                        </TableCell>
                    )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showStudentName ? (userRole === 'admin' ? 6 : 5) : (userRole === 'admin' ? 5 : 4)} className="text-center text-muted-foreground">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
 );


  // --- Main Return ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
         <CalendarDays className="h-7 w-7" /> Attendance <span className="text-sm font-normal text-muted-foreground">({userRole})</span>
      </h1>

       {userRole === 'student' && renderStudentView()}
       {userRole === 'faculty' && renderFacultyView()}
       {userRole === 'admin' && renderAdminView()}

        {!isLoading && !userRole && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not determine user role.</AlertDescription>
             </Alert>
        )}

    </div>
  );
}


// --- Helper Component for Summary Boxes ---
interface SummaryBoxProps {
    label: string;
    value: string | number;
    color: 'primary' | 'secondary' | 'green' | 'red';
}
function SummaryBox({ label, value, color }: SummaryBoxProps) {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary-foreground', // Adjusted for better contrast with secondary
        green: 'bg-green-500/10 text-green-600',
        red: 'bg-red-500/10 text-red-600',
    };
    return (
        <div className={`flex flex-col items-center p-4 rounded-lg ${colorClasses[color]}`}>
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
}

