
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input"; // Added Input
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Loader2, CalendarDays, BarChart2, AlertTriangle, ListChecks, RadioTower, Code, Timer, Send } from "lucide-react"; // Added Code, Timer, Send
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added RadioGroup

import {
    getStudentAttendance,
    calculateAttendanceSummary,
    markManualAttendance,
    getTodayAttendanceStatus,
    startNewAttendanceSession, // New service
    submitStudentAttendance,  // New service
    type AttendanceRecord,
    type AttendanceSummary,
    type AttendanceSessionStartResult,
} from "@/services/attendance";
import { getCurrentUser, AuthUser, UserRole } from "@/types/user";
import { getUsers } from "@/services/admin";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AttendancePage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Student specific state
  const [studentAttendanceData, setStudentAttendanceData] = useState<AttendanceRecord[]>([]);
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);
  const [studentTodayStatus, setStudentTodayStatus] = useState<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string; method?: string } | null>(null);
  const [studentActiveSession, setStudentActiveSession] = useState<{ sessionId: string; classCode: string; generatedCodes: string[]; endTime: Date } | null>(null);
  const [selectedCodeByStudent, setSelectedCodeByStudent] = useState<string>("");
  const [isSubmittingStudentAttendance, setIsSubmittingStudentAttendance] = useState(false);

  // Faculty/Admin specific state
  const [facultyClassCodeInput, setFacultyClassCodeInput] = useState("");
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeFacultySession, setActiveFacultySession] = useState<AttendanceSessionStartResult & {endTime?: Date} | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState<string>("");

  const [manualStudentList, setManualStudentList] = useState<AuthUser[]>([]);
  const [selectedStudentsForManual, setSelectedStudentsForManual] = useState<Record<string, boolean>>({});
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);

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
      // TODO: Student should fetch active sessions for their classes here.
      // For now, this will be manually triggered or mocked.
      // Simulating a found active session for demo:
      // setStudentActiveSession({ sessionId: "mockSession123", classCode: "CS101", generatedCodes: ["12", "34", "56"], endTime: new Date(Date.now() + 120000) });

    } catch (err) {
      console.error("Error fetching student attendance:", err);
      setError("Failed to load your attendance data.");
      toast({ variant: "destructive", title: "Error", description: "Could not fetch your attendance records." });
    }
  }, [toast]);

  const fetchAdminFacultyData = useCallback(async () => {
    try {
      const students = await getUsers({ role: 'student' });
      setManualStudentList(students);
      // For "View Records" tab - can be refined
      const allRecords = await getStudentAttendance(); // Fetches all for admin
      setAllAttendanceRecords(allRecords);
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

  // Countdown timer effect for faculty session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeFacultySession?.endTime) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = activeFacultySession.endTime!.getTime() - now;
        if (distance < 0) {
          setSessionCountdown("Session Expired");
          setActiveFacultySession(null); // Clear session when expired
          clearInterval(interval);
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setSessionCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };
      updateCountdown(); // Initial call
      interval = setInterval(updateCountdown, 1000);
    }
    return () => clearInterval(interval);
  }, [activeFacultySession?.endTime]);


  // --- Faculty/Admin: Code Challenge Session Control ---
  const handleStartCodeChallengeSession = async () => {
    if (!facultyClassCodeInput.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a class code." });
      return;
    }
    setIsStartingSession(true);
    setError(null);
    try {
      const result = await startNewAttendanceSession(facultyClassCodeInput.trim());
      if (result.success && result.session_id && result.generated_codes && result.end_time) {
        const endTime = new Date(result.end_time._seconds * 1000 + result.end_time._nanoseconds / 1000000);
        setActiveFacultySession({...result, endTime});
        toast({ title: "Session Started", description: `Challenge session for ${facultyClassCodeInput} is active. Announce the correct code.` });
        // IMPORTANT: Faculty needs to know the 'correct_code'.
        // Assuming 'result.correct_code' is returned by the backend function to the faculty.
        // If not, this UI part for faculty to see the correct code is illustrative.
        if(result.correct_code) {
            console.log("Faculty: The correct code to announce is: ", result.correct_code);
            // Display it securely if needed, or just keep in console for this demo
        } else {
            toast({variant: "destructive", title: "Warning", description: "Backend did not return correct code to faculty."})
        }
      } else {
        setError(result.message);
        toast({ variant: "destructive", title: "Failed to Start", description: result.message });
      }
    } catch (err) {
      console.error("Error starting code challenge session:", err);
      setError("An unexpected error occurred.");
      toast({ variant: "destructive", title: "Error", description: "Could not start session." });
    } finally {
      setIsStartingSession(false);
    }
  };

  // --- Student: Submit Code Challenge Attendance ---
  const handleStudentCodeSubmit = async () => {
    if (!studentActiveSession?.sessionId) {
      toast({ variant: "destructive", title: "Error", description: "No active session found." });
      return;
    }
    if (!selectedCodeByStudent) {
      toast({ variant: "destructive", title: "Error", description: "Please select a code." });
      return;
    }
    setIsSubmittingStudentAttendance(true);
    setError(null);
    try {
      const result = await submitStudentAttendance(studentActiveSession.sessionId, selectedCodeByStudent);
      if (result.success) {
        toast({ title: "Attendance Submitted", description: result.message });
        if (result.status === 'present' && currentUser) {
          await fetchStudentData(currentUser.id); // Refresh student data
        }
        setStudentActiveSession(null); // Clear session after submission
        setSelectedCodeByStudent("");
      } else {
        setError(result.message);
        toast({ variant: "destructive", title: "Submission Failed", description: result.message });
      }
    } catch (err) {
      console.error("Error submitting student attendance:", err);
      setError("An unexpected error occurred.");
      toast({ variant: "destructive", title: "Error", description: "Could not submit attendance." });
    } finally {
      setIsSubmittingStudentAttendance(false);
    }
  };
  
  // --- Mock function for student to "find" an active session (replace with real logic) ---
  const handleStudentCheckActiveSession = () => {
      // In a real app, query Firestore for active sessions for student's classes
      // For demo, we'll mock finding a session if faculty has started one recently
      if (activeFacultySession && activeFacultySession.session_id && activeFacultySession.generated_codes && activeFacultySession.endTime && activeFacultySession.endTime > new Date()) {
          setStudentActiveSession({
              sessionId: activeFacultySession.session_id,
              classCode: facultyClassCodeInput, // Assuming student is in this class
              generatedCodes: activeFacultySession.generated_codes,
              endTime: activeFacultySession.endTime
          });
          toast({ title: "Active Session Found", description: `Join session for class ${facultyClassCodeInput}.`});
      } else {
          toast({ title: "No Active Session", description: "No active attendance session found for your classes at this moment."});
          setStudentActiveSession(null);
      }
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
      if (selectedStudentsForManual[studentId]) {
        try {
          // Using new markManualAttendance function
          const result = await markManualAttendance(studentId, {
            classId: 'MANUAL-CLASS-' + todayDate, // Example class for manual entries
            markedBy: currentUser.id,
            isPresent: true, // Manual marking implies presence here
            dateOverride: todayDate
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
    setSelectedStudentsForManual({});
    setIsSubmittingManual(false);
    if (currentUser?.role !== 'student') await fetchAdminFacultyData(); // Refresh list
  };


  if (isLoading) return <div className="space-y-6"><h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1><Card><CardHeader><CardTitle>Loading Attendance...</CardTitle></CardHeader><CardContent className="flex justify-center items-center p-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></CardContent></Card></div>;
  if (error && !studentActiveSession && !activeFacultySession) return <div className="space-y-6"><h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;
  if (!currentUser) return <div className="space-y-6"><h1 className="text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Attendance</h1><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Authentication Error</AlertTitle><AlertDescription>Could not determine user.</AlertDescription></Alert></div>;

  // --- Student View ---
  const renderStudentView = () => (
    <>
      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>{currentDateString ? `Status for ${currentDateString}.` : `Loading date...`} Look for active sessions.</CardDescription>
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
                {studentTodayStatus?.method && ` (via ${studentTodayStatus.method.replace('_', ' ')})`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Code Challenge Attendance</CardTitle>
            <CardDescription>Join an active session announced by your faculty.</CardDescription>
        </CardHeader>
        <CardContent>
            {!studentActiveSession ? (
                <Button onClick={handleStudentCheckActiveSession} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                    <RadioTower className="mr-2 h-4 w-4" /> Check for Active Sessions
                </Button>
            ) : (
                <div className="space-y-4">
                    <Alert>
                        <Timer className="h-4 w-4" />
                        <AlertTitle>Session for {studentActiveSession.classCode} is Active!</AlertTitle>
                        <AlertDescription>
                            Select the code announced by your faculty. Session ends in: {sessionCountdown || format(studentActiveSession.endTime, 'HH:mm:ss')}
                        </AlertDescription>
                    </Alert>
                    <RadioGroup value={selectedCodeByStudent} onValueChange={setSelectedCodeByStudent} className="flex flex-col sm:flex-row gap-4 justify-center">
                        {studentActiveSession.generatedCodes.map(code => (
                            <Label key={code} htmlFor={`code-${code}`} 
                                className={cn(
                                    "flex-1 cursor-pointer rounded-md border-2 p-4 text-center text-2xl font-bold transition-all hover:border-primary",
                                    selectedCodeByStudent === code ? "border-primary bg-primary/10 text-primary ring-2 ring-primary" : "border-muted"
                                )}>
                                <RadioGroupItem value={code} id={`code-${code}`} className="sr-only" />
                                {code}
                            </Label>
                        ))}
                    </RadioGroup>
                    <Button onClick={handleStudentCodeSubmit} disabled={isSubmittingStudentAttendance || !selectedCodeByStudent} className="w-full">
                        {isSubmittingStudentAttendance ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Attendance
                    </Button>
                </div>
            )}
            {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {studentSummary && (
         <Card className="transform transition-transform duration-300 hover:shadow-lg">
           <CardHeader><CardTitle>Attendance Summary</CardTitle><CardDescription>Your overview.</CardDescription></CardHeader>
           <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryBox label="Total Days" value={studentSummary.totalDays} color="secondary" />
              <SummaryBox label="Present" value={studentSummary.presentDays} color="green" />
              <SummaryBox label="Absent" value={studentSummary.absentDays} color="red" />
              <SummaryBox label="Percentage" value={`${studentSummary.attendancePercentage}%`} color="primary" />
           </CardContent>
         </Card>
      )}
      {renderDetailedTable(studentAttendanceData, false)}
    </>
  );

  // --- Faculty/Admin View ---
  const renderFacultyAdminView = () => (
    <Tabs defaultValue="code_challenge" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
        <TabsTrigger value="code_challenge"><Code className="mr-1 h-4 w-4" />Code Challenge</TabsTrigger>
        <TabsTrigger value="manual_entry"><ListChecks className="mr-1 h-4 w-4" />Manual Entry</TabsTrigger>
        <TabsTrigger value="view_records"><BarChart2 className="mr-1 h-4 w-4" />View Records</TabsTrigger>
      </TabsList>

      <TabsContent value="code_challenge">
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Code Challenge Session Control</CardTitle>
            <CardDescription>Start a new code challenge session for a class.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeFacultySession ? (
                <>
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                        id="classCode"
                        placeholder="e.g., CS101"
                        value={facultyClassCodeInput}
                        onChange={(e) => setFacultyClassCodeInput(e.target.value)}
                        disabled={isStartingSession}
                    />
                    <Button onClick={handleStartCodeChallengeSession} disabled={isStartingSession || !facultyClassCodeInput.trim()} className="w-full sm:w-auto">
                        {isStartingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RadioTower className="mr-2 h-4 w-4" />}
                        Start Session
                    </Button>
                </>
            ) : (
                <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
                    <Timer className="h-4 w-4 text-green-600" />
                    <AlertTitle>Session for {facultyClassCodeInput} is Active!</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>Session ID: <span className="font-mono text-xs">{activeFacultySession.session_id}</span></p>
                        <p>Generated Codes: <span className="font-bold text-lg">{activeFacultySession.generated_codes?.join(" / ")}</span></p>
                        {activeFacultySession.correct_code && <p className="text-red-600 font-semibold">Announce this code: <span className="font-bold text-xl">{activeFacultySession.correct_code}</span></p>}
                        <p>Time Remaining: <span className="font-mono text-lg">{sessionCountdown}</span></p>
                        <Button variant="destructive" size="sm" onClick={() => setActiveFacultySession(null)}>End Session Manually</Button>
                    </AlertDescription>
                </Alert>
            )}
            {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
          <CardFooter><p className="text-xs text-muted-foreground">Students will select the verbally announced correct code from the three options shown in their app.</p></CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="manual_entry">
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Manual Attendance Entry</CardTitle>
            <CardDescription>Mark attendance for students for {currentDateString}.</CardDescription>
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
                      {student.name} ({student.studentId || student.id})
                    </Label>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No students found.</p>}
            <Button onClick={handleManualSubmit} disabled={isSubmittingManual || Object.values(selectedStudentsForManual).every(v => !v)}>
              {isSubmittingManual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Submit Manual Attendance
            </Button>
          </CardContent>
          <CardFooter><p className="text-xs text-muted-foreground">Submitted attendance will be marked as 'Present'.</p></CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="view_records">
         {renderDetailedTable(allAttendanceRecords, true)}
      </TabsContent>
    </Tabs>
  );

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
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="hidden md:table-cell">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.timestamp || '').localeCompare(a.timestamp || '')).map((record) => (
                <TableRow key={record.id}>
                  {showStudentName && <TableCell>{record.studentName || record.studentId}</TableCell>}
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    {record.isPresent ? <Check className="h-5 w-5 text-green-500 inline-block" /> : <X className="h-5 w-5 text-red-500 inline-block" />}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {record.timestamp ? format(new Date(record.timestamp), 'p') : 'N/A'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{record.method?.replace('_', ' ') || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{record.remarks || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={showStudentName ? 6 : 5} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
 );

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

interface SummaryBoxProps { label: string; value: string | number; color: 'primary' | 'secondary' | 'green' | 'red';}
function SummaryBox({ label, value, color }: SummaryBoxProps) {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary-foreground',
        green: 'bg-green-500/10 text-green-600',
        red: 'bg-red-500/10 text-red-600',
    };
    return (<div className={`flex flex-col items-center p-4 rounded-lg ${colorClasses[color]}`}><span className="text-2xl font-bold">{value}</span><span className="text-sm text-muted-foreground">{label}</span></div>);
}
