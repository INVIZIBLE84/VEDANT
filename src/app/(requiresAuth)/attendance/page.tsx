
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Loader2, CalendarDays, BarChart2, Download, AlertTriangle, RadioTower, ListChecks, Power, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
    getStudentAttendance,
    calculateAttendanceSummary,
    markAttendance, // Updated to handle different methods
    getTodayAttendanceStatus,
    type AttendanceRecord,
    type AttendanceSummary,
} from "@/services/attendance";
import { getCurrentUser, AuthUser, UserRole } from "@/types/user";
import { getUsers, type AdminUserFilters } from "@/services/admin"; // For fetching student list
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const MOCK_CLASS_ID_ULTRASONIC = "CS-ULTRA-101"; // Example class ID for ultrasonic sessions

export default function AttendancePage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Student specific state
  const [studentAttendanceData, setStudentAttendanceData] = useState<AttendanceRecord[]>([]);
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);
  const [studentTodayStatus, setStudentTodayStatus] = useState<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string } | null>(null);
  const [isUltrasonicListening, setIsUltrasonicListening] = useState(false);
  const [isMarkingStudent, setIsMarkingStudent] = useState(false);

  // Faculty/Admin specific state
  const [isEmitterActive, setIsEmitterActive] = useState(false);
  const [manualStudentList, setManualStudentList] = useState<AuthUser[]>([]);
  const [selectedStudentsForManual, setSelectedStudentsForManual] = useState<Record<string, boolean>>({});
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]); // For admin/faculty view records tab

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDateString, setCurrentDateString] = useState<string>('');


  const fetchStudentData = useCallback(async (studentId: string) => {
    try {
      const [data, status] = await Promise.all([
        getStudentAttendance(studentId),
        getTodayAttendanceStatus(studentId)
      ]);
      setStudentAttendanceData(data);
      setStudentSummary(calculateAttendanceSummary(data));
      setStudentTodayStatus(status);
    } catch (err) {
      console.error("Error fetching student attendance:", err);
      setError("Failed to load your attendance data.");
      toast({ variant: "destructive", title: "Error", description: "Could not fetch your attendance records." });
    }
  }, [toast]);

  const fetchAdminFacultyData = useCallback(async () => {
    try {
      // Fetch all students for manual marking tab
      const students = await getUsers({ role: 'student' }); // Filter for students
      setManualStudentList(students);

      // Fetch all attendance records for "View Records" tab (can be refined with filters later)
      // Simulating fetching all records - replace with actual admin/faculty specific fetch if available
      const allRecords = await getStudentAttendance(''); // This service needs to be adapted or use a new one for "all"
      setAllAttendanceRecords(allRecords); // This is a placeholder, ideally needs a getAttendanceForAdmin/Faculty

    } catch (err) {
      console.error("Error fetching admin/faculty data:", err);
      setError("Failed to load data for attendance management.");
      toast({ variant: "destructive", title: "Error", description: "Could not fetch necessary data." });
    }
  }, [toast]);


  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      setCurrentDateString(new Date().toLocaleDateString());

      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }
      setUserRole(user.role);

      if (user.role === 'student') {
        await fetchStudentData(user.id);
      } else if (user.role === 'faculty' || user.role === 'admin') {
        await fetchAdminFacultyData();
      }
      setIsLoading(false);
    };
    initialize();
  }, [fetchStudentData, fetchAdminFacultyData]);


  // --- Student: Ultrasonic Attendance ---
  const handleUltrasonicReady = async () => {
    if (!currentUser || currentUser.role !== 'student') return;
    setIsUltrasonicListening(true);
    setIsMarkingStudent(true);
    setError(null);
    toast({ title: "Listening for Ultrasonic Signal...", description: "Please wait for detection." });

    // Simulate detection
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second "listening"

    try {
      // Simulate successful detection for now
      const result = await markAttendance(currentUser.id, {
        method: 'ultrasonic',
        classId: MOCK_CLASS_ID_ULTRASONIC, // Example class ID
        isPresentOverride: true // Ultrasonic implies presence
      });

      if (result.success) {
        toast({ title: "Attendance Marked!", description: result.message });
        await fetchStudentData(currentUser.id); // Refresh data
      } else {
        setError(result.message);
        toast({ variant: "destructive", title: "Marking Failed", description: result.message });
      }
    } catch (err) {
      console.error("Error marking ultrasonic attendance:", err);
      setError("An unexpected error occurred.");
      toast({ variant: "destructive", title: "Error", description: "Could not mark attendance." });
    } finally {
      setIsUltrasonicListening(false);
      setIsMarkingStudent(false);
    }
  };

  // --- Faculty/Admin: Ultrasonic Control ---
  const handleToggleEmitter = () => {
    setIsEmitterActive(!isEmitterActive);
    toast({
      title: isEmitterActive ? "Ultrasonic Emitter Stopped" : "Ultrasonic Emitter Started",
      description: isEmitterActive ? "Students can no longer mark attendance via ultrasonic signal for this session." : "Students can now attempt to mark attendance using the ultrasonic signal.",
    });
  };

  // --- Faculty/Admin: Manual Attendance ---
  const handleManualStudentSelect = (studentId: string, checked: boolean | "indeterminate") => {
    if (typeof checked === 'boolean') {
        setSelectedStudentsForManual(prev => ({ ...prev, [studentId]: checked }));
    }
  };

  const handleManualSubmit = async () => {
    if (!currentUser || !['faculty', 'admin'].includes(currentUser.role)) return;
    setIsSubmittingManual(true);
    setError(null);
    let successCount = 0;
    let failCount = 0;

    const todayDate = new Date().toISOString().split('T')[0];

    for (const studentId in selectedStudentsForManual) {
      if (selectedStudentsForManual[studentId]) { // Only mark if checkbox is true (present)
        try {
          const result = await markAttendance(studentId, {
            method: 'manual',
            classId: 'MANUAL-CLASS', // Example class for manual entries
            markedBy: currentUser.id,
            isPresentOverride: true, // Manual marking implies presence here
            dateOverride: todayDate // Ensure it's for today
          });
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            toast({ variant: "destructive", title: `Failed for ${studentId}`, description: result.message, duration: 2000 });
          }
        } catch (err) {
          failCount++;
          toast({ variant: "destructive", title: `Error for ${studentId}`, description: "Could not mark attendance.", duration: 2000 });
        }
      }
    }

    toast({
      title: "Manual Attendance Submitted",
      description: `${successCount} marked successfully. ${failCount} failed.`,
    });
    setSelectedStudentsForManual({}); // Clear selections
    setIsSubmittingManual(false);
    // Optionally, re-fetch all attendance records for the "View Records" tab
    // await fetchAdminFacultyData(); // Or a more specific refresh
  };


  // --- Render Loading/Error States ---
  if (isLoading) {
    return (
       <div className="space-y-6">
         <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1>
         <Card>
            <CardHeader><CardTitle>Loading Attendance...</CardTitle></CardHeader>
            <CardContent className="flex justify-center items-center p-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></CardContent>
         </Card>
       </div>
    );
  }

   if (error) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
   }
   if (!currentUser) {
     return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1>
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>Could not determine user. Please try logging in again.</AlertDescription>
             </Alert>
        </div>
     );
   }


  // --- Student View ---
  const renderStudentView = () => (
    <>
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
           <CardDescription>{currentDateString ? `Status for ${currentDateString}.` : `Loading date...`} Ensure you are in class for ultrasonic marking!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {studentTodayStatus?.status === 'Present' && <Check className="h-6 w-6 text-green-500" />}
            {studentTodayStatus?.status === 'Absent' && <X className="h-6 w-6 text-red-500" />}
            {studentTodayStatus?.status === 'Not Marked' && <Clock className="h-6 w-6 text-yellow-500" />}
            <span className={cn(
                "text-lg font-semibold",
                studentTodayStatus?.status === 'Present' && "text-green-600",
                studentTodayStatus?.status === 'Absent' && "text-red-600",
                studentTodayStatus?.status === 'Not Marked' && "text-yellow-600"
            )}>
                {studentTodayStatus?.status ?? 'Loading...'}
                {studentTodayStatus?.time && ` at ${studentTodayStatus.time}`}
            </span>
          </div>
          <Button
            onClick={handleUltrasonicReady}
            disabled={isMarkingStudent || studentTodayStatus?.status === 'Present'}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isMarkingStudent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RadioTower className="mr-2 h-4 w-4" />}
            {isUltrasonicListening ? "Listening..." : (studentTodayStatus?.status === 'Present' ? "Marked (Ultrasonic)" : "Ready to Mark (Ultrasonic)")}
          </Button>
        </CardContent>
         {error && <CardFooter><Alert variant="destructive" className="w-full"><AlertDescription>{error}</AlertDescription></Alert></CardFooter>}
      </Card>

      {studentSummary && (
         <Card className="transform transition-transform duration-300 hover:shadow-lg">
           <CardHeader>
             <CardTitle>Attendance Summary</CardTitle>
             <CardDescription>Your overview for the recorded period.</CardDescription>
           </CardHeader>
           <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryBox label="Total Days" value={studentSummary.totalDays} color="secondary" />
              <SummaryBox label="Present" value={studentSummary.presentDays} color="green" />
              <SummaryBox label="Absent" value={studentSummary.absentDays} color="red" />
              <SummaryBox label="Percentage" value={`${studentSummary.attendancePercentage}%`} color="primary" />
           </CardContent>
         </Card>
      )}

       <Card className="transform transition-transform duration-300 hover:shadow-lg">
         <CardHeader>
             <CardTitle>Attendance Calendar</CardTitle>
             <CardDescription>Your attendance history at a glance.</CardDescription>
         </CardHeader>
          <CardContent className="flex justify-center">
             <Calendar
                mode="multiple"
                selected={studentAttendanceData.filter(r => r.isPresent).map(r => new Date(r.date))}
                modifiers={{
                    absent: studentAttendanceData.filter(r => !r.isPresent).map(r => new Date(r.date)),
                }}
                modifiersClassNames={{
                    selected: 'bg-green-500/20 text-green-800 rounded-full',
                    absent: 'bg-red-500/20 text-red-800 rounded-full line-through',
                }}
                className="rounded-md border p-3"
              />
          </CardContent>
       </Card>
       {renderDetailedTable(studentAttendanceData, false)}
    </>
  );

  // --- Faculty/Admin View ---
  const renderFacultyAdminView = () => (
    <Tabs defaultValue="ultrasonic_control" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
        <TabsTrigger value="ultrasonic_control"><RadioTower className="mr-1 h-4 w-4" />Ultrasonic Session</TabsTrigger>
        <TabsTrigger value="manual_entry"><ListChecks className="mr-1 h-4 w-4" />Manual Entry</TabsTrigger>
        <TabsTrigger value="view_records"><BarChart2 className="mr-1 h-4 w-4" />View Records</TabsTrigger>
      </TabsList>

      <TabsContent value="ultrasonic_control">
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Ultrasonic Attendance Control</CardTitle>
            <CardDescription>Start or stop the ultrasonic emitter for the current lecture session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleToggleEmitter} className={cn("w-full sm:w-auto", isEmitterActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}>
              <Power className="mr-2 h-4 w-4" />
              {isEmitterActive ? "Stop Ultrasonic Emitter" : "Start Ultrasonic Emitter"}
            </Button>
            {isEmitterActive && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
                <RadioTower className="h-4 w-4 text-green-600" />
                <AlertTitle>Emitter Active</AlertTitle>
                <AlertDescription>Students can now mark their attendance using the ultrasonic signal. Ensure the physical emitter device is operational.</AlertDescription>
              </Alert>
            )}
            {!isEmitterActive && (
                 <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                     <RadioTower className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Emitter Inactive</AlertTitle>
                    <AlertDescription>The ultrasonic emitter is currently off. Students cannot mark attendance via this method.</AlertDescription>
                 </Alert>
            )}
          </CardContent>
           <CardFooter>
              <p className="text-xs text-muted-foreground">Note: This simulates control of a physical ultrasonic device. Actual hardware integration is required.</p>
           </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="manual_entry">
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Manual Attendance Entry</CardTitle>
            <CardDescription>Mark attendance for students for the current date ({currentDateString}). Select students and mark them as present.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {manualStudentList.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-4">
                {manualStudentList.map(student => (
                  <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`manual-${student.id}`}
                      checked={selectedStudentsForManual[student.id] || false}
                      onCheckedChange={(checked) => handleManualStudentSelect(student.id, checked)}
                    />
                    <Label htmlFor={`manual-${student.id}`} className="flex-1 cursor-pointer">
                      {student.name} ({student.studentId || student.id}) - {student.department || 'N/A'}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No students found or list is loading.</p>
            )}
            <Button onClick={handleManualSubmit} disabled={isSubmittingManual || Object.values(selectedStudentsForManual).every(v => !v)}>
              {isSubmittingManual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Submit Manual Attendance
            </Button>
          </CardContent>
          <CardFooter>
              <p className="text-xs text-muted-foreground">Ensure the correct date is implied. Submitted attendance will be marked as 'Present'.</p>
           </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="view_records">
         {/* TODO: This should ideally fetch faculty/admin specific "all records" data */}
         {renderDetailedTable(allAttendanceRecords, true)}
      </TabsContent>
    </Tabs>
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
              data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.timestamp || '').localeCompare(a.timestamp || '')).map((record) => (
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
                            {/* TODO: Admin override action button */}
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
       {(userRole === 'faculty' || userRole === 'admin') && renderFacultyAdminView()}

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
        secondary: 'bg-secondary/10 text-secondary-foreground',
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

