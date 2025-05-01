
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, CheckCircle, DollarSign, FileText, Bell, AlertTriangle, BrainCircuit, FileSignature, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudentAttendance, calculateAttendanceSummary, getTodayAttendanceStatus } from "@/services/attendance";
import { getFeeDetails, FeeDetails } from "@/services/fee-management"; // Import FeeDetails type
import { getStudentClearanceStatus, calculateProgress as calculateClearanceProgress, ClearanceRequest, ClearanceStep } from "@/services/clearance"; // Import Clearance types
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Mock Data Types (replace with actual types if available)
interface MockNotice { id: string; title: string; timestamp: string; }
interface MockReport { id: string; title: string; generatedDate: string; }
interface MockApplication { id: string; type: string; status: string; submittedDate: string; }

// --- Helper to get status style ---
const getStatusStyle = (status: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Present' | 'Absent' | 'Not Marked'): { variant: "default" | "secondary" | "destructive" | "outline", className: string } => {
    switch (status) {
        case 'Paid':
        case 'Approved':
        case 'Present':
            return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' };
        case 'Unpaid':
        case 'Rejected':
        case 'Absent':
            return { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' };
        case 'Partially Paid':
        case 'Pending':
        case 'In Progress':
        case 'Not Marked':
            return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
        default:
            return { variant: 'outline', className: '' };
    }
};

export default function StudentDashboardPage() {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Data states with types
    const [attendanceSummary, setAttendanceSummary] = React.useState<any>(null); // Replace 'any' with AttendanceSummary type if available
    const [todayAttendance, setTodayAttendance] = React.useState<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string } | null>(null);
    const [feeDetails, setFeeDetails] = React.useState<FeeDetails | null>(null);
    const [clearanceDetails, setClearanceDetails] = React.useState<ClearanceRequest | null>(null);

    // Mock data states
    const [notices, setNotices] = React.useState<MockNotice[]>([
        { id: 'n1', title: 'Midterm Exam Schedule Released', timestamp: '2024-07-25T10:00:00Z'},
        { id: 'n2', title: 'Library Closure Notice', timestamp: '2024-07-24T15:30:00Z'},
    ]);
    const [reports, setReports] = React.useState<MockReport[]>([
         { id: 'r1', title: 'Semester 1 Performance Report', generatedDate: '2024-07-20'},
    ]);
    const [applications, setApplications] = React.useState<MockApplication[]>([
        { id: 'app1', type: 'Leave Application', status: 'Approved', submittedDate: '2024-07-15'},
    ]);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (!currentUser || currentUser.role !== 'student') {
                // Handled by layout, but set state for robustness
                setError("Access denied. Student role required.");
                setIsLoading(false);
                return;
            }

            try {
                const [attendanceData, todayStatus, fees, clearance] = await Promise.all([
                    getStudentAttendance(currentUser.id),
                    getTodayAttendanceStatus(currentUser.id),
                    getFeeDetails(currentUser.id),
                    getStudentClearanceStatus(currentUser.id),
                ]);

                setAttendanceSummary(calculateAttendanceSummary(attendanceData));
                setTodayAttendance(todayStatus);
                setFeeDetails(fees);
                setClearanceDetails(clearance);

            } catch (err) {
                console.error("Error fetching student dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-primary">Student Dashboard</h1>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

     if (!user) {
        // Should be handled by layout, but include fallback
        return (
             <div className="space-y-6">
                <h1 className="text-3xl font-bold text-primary">Student Dashboard</h1>
                <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Not Logged In</AlertTitle>
                     <AlertDescription>Please log in to view your dashboard.</AlertDescription>
                 </Alert>
            </div>
        );
    }


    const attendanceStatus = todayAttendance?.status || 'Not Marked';
    const attendanceStyle = getStatusStyle(attendanceStatus);
    const feeStatus = feeDetails?.status || 'Unpaid'; // Default to Unpaid if no details
    const feeStyle = getStatusStyle(feeStatus);
    const clearanceStatus = clearanceDetails?.overallStatus || 'Not Submitted';
    const clearanceProgress = clearanceDetails ? calculateClearanceProgress(clearanceDetails.steps) : 0;
    const clearanceStyle = getStatusStyle(clearanceStatus);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Welcome, {user.name}!</h1>

            {/* Core Module Summaries */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Attendance Panel */}
                <Link href="/attendance">
                     <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary" /> Attendance</CardTitle>
                            <CardDescription>Today: <Badge variant={attendanceStyle.variant} className={cn("ml-1", attendanceStyle.className)}>{attendanceStatus}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent>
                             {attendanceSummary ? (
                                <>
                                    <p className="text-sm font-medium">Overall Percentage: <span className="text-primary">{attendanceSummary.attendancePercentage}%</span></p>
                                    <p className="text-xs text-muted-foreground">Present: {attendanceSummary.presentDays} days, Absent: {attendanceSummary.absentDays} days</p>
                                    {/* TODO: Add Mini Calendar/Heatmap */}
                                </>
                             ) : <p className="text-sm text-muted-foreground">No summary available.</p>}
                        </CardContent>
                    </Card>
                 </Link>

                {/* Fee Panel */}
                <Link href="/fees">
                    <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign className="text-secondary" /> Fee Status</CardTitle>
                             <CardDescription>Current Status: <Badge variant={feeStyle.variant} className={cn("ml-1", feeStyle.className)}>{feeStatus}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent>
                            {feeDetails ? (
                                <>
                                    <p className="text-sm font-medium">Balance Due: <span className={feeDetails.balanceDue > 0 ? "text-red-600" : "text-green-600"}>${feeDetails.balanceDue.toFixed(2)}</span></p>
                                     <p className="text-xs text-muted-foreground">Total Due: ${feeDetails.totalDue.toFixed(2)}{feeDetails.dueDate ? ` | Due: ${format(new Date(feeDetails.dueDate), 'PP')}` : ''}</p>
                                </>
                            ): <p className="text-sm text-muted-foreground">No fee details available.</p>}
                        </CardContent>
                    </Card>
                </Link>

                {/* Clearance Panel */}
                <Link href="/clearance">
                    <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-accent" /> Clearance</CardTitle>
                             <CardDescription>Overall Status: <Badge variant={clearanceStyle.variant} className={cn("ml-1", clearanceStyle.className)}>{clearanceStatus}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent>
                             {clearanceDetails ? (
                                <>
                                    <Progress value={clearanceProgress} className="h-2 mb-1" />
                                    <p className="text-xs text-muted-foreground text-center">{clearanceProgress}% Complete</p>
                                </>
                            ) : (
                                // Updated to use Link for navigation, styling might need adjustment
                                <Link href="/clearance" passHref>
                                    <Button size="sm" variant="outline" className="w-full">Submit Clearance Request</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </Link>
            </section>

            {/* Other Sections */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Notices & Announcements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="text-blue-500" /> Notices & Announcements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {notices.length > 0 ? (
                            <ul className="space-y-2">
                                {notices.map(n => (
                                    <li key={n.id} className="text-sm text-muted-foreground border-b pb-1 last:border-none">
                                        <Link href="/notifications" className="hover:text-primary">{n.title}</Link>
                                         <span className="text-xs block">{format(new Date(n.timestamp), 'PP p')}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No recent notices.</p>}
                         <Link href="/notifications"><Button variant="link" size="sm" className="mt-2">View All</Button></Link>
                    </CardContent>
                </Card>

                 {/* Behavior & Academic Reports (Mockup) */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-purple-500" /> Behavior & Reports</CardTitle>
                    </CardHeader>
                     <CardContent>
                        {reports.length > 0 ? (
                             <ul className="space-y-2">
                                {reports.map(r => (
                                    <li key={r.id} className="text-sm text-muted-foreground border-b pb-1 last:border-none">
                                        <span className="hover:text-primary cursor-pointer">{r.title}</span> {/* Link to actual report later */}
                                        <span className="text-xs block">Generated: {format(new Date(r.generatedDate), 'PP')}</span>
                                     </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No reports generated yet.</p>}
                        <Button variant="link" size="sm" className="mt-2" disabled>View Insights</Button> {/* Enable when ML part is done */}
                     </CardContent>
                 </Card>

                 {/* Submit Applications (Mockup) */}
                 <Card className="md:col-span-2">
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2"><FileSignature className="text-orange-500" /> Applications & Forms</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <div className="flex flex-col sm:flex-row gap-4">
                             <div className="flex-1">
                                <h3 className="font-semibold mb-2">Submit New</h3>
                                 <Button variant="outline" size="sm" className="mb-2 w-full sm:w-auto" disabled><Send className="mr-2 h-4 w-4"/>Submit Leave Application</Button>
                                 <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled><Send className="mr-2 h-4 w-4"/>Request ID Card</Button>
                                 {/* Add more application buttons */}
                             </div>
                              <div className="flex-1 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                                 <h3 className="font-semibold mb-2">Recent Submissions</h3>
                                  {applications.length > 0 ? (
                                      <ul className="space-y-2">
                                        {applications.map(app => {
                                             const appStyle = getStatusStyle(app.status as any); // Cast status for demo
                                             return (
                                                  <li key={app.id} className="text-sm text-muted-foreground">
                                                      <span>{app.type}</span> - <Badge variant={appStyle.variant} className={cn("text-xs", appStyle.className)}>{app.status}</Badge>
                                                      <span className="text-xs block">{format(new Date(app.submittedDate), 'PP')}</span>
                                                  </li>
                                             )
                                        })}
                                     </ul>
                                  ) : <p className="text-sm text-muted-foreground">No recent applications.</p>}
                             </div>
                         </div>
                     </CardContent>
                 </Card>
            </section>
        </div>
    );
}


// Skeleton Loader for Student Dashboard
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
             <Skeleton className="h-8 w-1/2 rounded" /> {/* Title */}

            {/* Core Module Summaries Skeleton */}
             <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                         <CardHeader>
                             <Skeleton className="h-6 w-1/3 rounded mb-1" />
                             <Skeleton className="h-4 w-1/2 rounded" />
                         </CardHeader>
                         <CardContent>
                             <Skeleton className="h-5 w-3/4 rounded mb-1" />
                             <Skeleton className="h-4 w-full rounded" />
                         </CardContent>
                    </Card>
                 ))}
            </section>

             {/* Other Sections Skeleton */}
             <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Notices Card */}
                 <Card>
                     <CardHeader><Skeleton className="h-6 w-1/2 rounded" /></CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full rounded" />
                         <Skeleton className="h-4 w-5/6 rounded" />
                         <Skeleton className="h-4 w-full rounded" />
                     </CardContent>
                 </Card>
                   {/* Reports Card */}
                 <Card>
                     <CardHeader><Skeleton className="h-6 w-1/2 rounded" /></CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full rounded" />
                         <Skeleton className="h-4 w-5/6 rounded" />
                     </CardContent>
                 </Card>
                  {/* Applications Card */}
                  <Card className="md:col-span-2">
                      <CardHeader><Skeleton className="h-6 w-1/2 rounded" /></CardHeader>
                     <CardContent className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-20 rounded mb-2"/>
                              <Skeleton className="h-8 w-32 rounded" />
                              <Skeleton className="h-8 w-28 rounded" />
                          </div>
                           <div className="flex-1 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 space-y-3">
                               <Skeleton className="h-5 w-24 rounded mb-2"/>
                               <Skeleton className="h-4 w-full rounded" />
                               <Skeleton className="h-4 w-5/6 rounded" />
                           </div>
                     </CardContent>
                 </Card>
            </section>
        </div>
    );
}
