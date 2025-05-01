
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, CheckCircle, FileUp, Users, MessageSquare, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { getAttendanceForFaculty } from "@/services/attendance"; // Assuming basic fetch exists
import { getPendingClearanceActions } from "@/services/clearance"; // Assuming basic fetch exists
import { getDocuments } from "@/services/documents"; // For document count
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Mock Data Types (replace if needed)
interface MockStudentBehavior { studentId: string; studentName: string; regularity: number; engagement: number; }
interface MockMessage { studentId: string; studentName: string; lastMessage: string; timestamp: string; unread: boolean; }

// --- Helper to get status style ---
// Re-use or import from a shared utility if available
const getStatusStyle = (status: 'Pending' | 'Approved' | 'Rejected' /* Add other statuses if needed */): { variant: "default" | "secondary" | "destructive" | "outline", className: string } => {
    switch (status) {
        case 'Approved': return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' };
        case 'Rejected': return { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' };
        case 'Pending': return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
        default: return { variant: 'outline', className: '' };
    }
};

export default function FacultyDashboardPage() {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Data states (counts/summaries)
    const [attendanceSummary, setAttendanceSummary] = React.useState<{ presentToday?: number, totalStudents?: number } | null>(null);
    const [pendingClearanceCount, setPendingClearanceCount] = React.useState<number>(0);
    const [uploadedDocsCount, setUploadedDocsCount] = React.useState<number>(0);

    // Mock data states
     const [studentBehavior, setStudentBehavior] = React.useState<MockStudentBehavior[]>([
         { studentId: 'student123', studentName: 'Alice Smith', regularity: 95, engagement: 80 },
         { studentId: 'student456', studentName: 'Bob Johnson', regularity: 80, engagement: 65 },
     ]);
     const [messages, setMessages] = React.useState<MockMessage[]>([
         { studentId: 'student123', studentName: 'Alice Smith', lastMessage: 'Okay, thank you professor.', timestamp: '2024-07-25T11:00:00Z', unread: false },
         { studentId: 'student789', studentName: 'Charlie Brown', lastMessage: 'I have a question about the assignment.', timestamp: '2024-07-26T09:30:00Z', unread: true },
     ]);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (!currentUser || currentUser.role !== 'faculty') {
                // Handled by layout, but keep check for robustness
                setError("Access denied. Faculty role required.");
                setIsLoading(false);
                return;
            }
            if (!currentUser.department || !currentUser.facultyId) {
                 setError("Faculty profile incomplete (missing department or ID).");
                 setIsLoading(false);
                 return;
            }

            try {
                 // Fetch Attendance Summary (Simplified: fetch today's data for a default class)
                 // TODO: Need a way to select class or get overall summary
                 const today = format(new Date(), 'yyyy-MM-dd');
                 // const attendanceData = await getAttendanceForFaculty(currentUser.facultyId, 'default-class-id', { startDate: today, endDate: today });
                 // const presentToday = attendanceData.filter(a => a.isPresent).length;
                 // const totalStudents = new Set(attendanceData.map(a => a.studentId)).size; // Estimate total students
                 // setAttendanceSummary({ presentToday, totalStudents });
                 setAttendanceSummary({ presentToday: 18, totalStudents: 25 }); // Mock data for now

                 // Fetch Pending Clearances
                 const pendingClearances = await getPendingClearanceActions(currentUser.id, currentUser.role, currentUser.department);
                 setPendingClearanceCount(pendingClearances.length);

                 // Fetch Uploaded Documents Count (by this faculty)
                 const myDocs = await getDocuments({ uploaderId: currentUser.id }, currentUser.role); // Pass role for permission checks
                 setUploadedDocsCount(myDocs.length);

            } catch (err) {
                console.error("Error fetching faculty dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

     if (isLoading) {
        return <FacultyDashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-primary">Faculty Dashboard</h1>
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
                <h1 className="text-3xl font-bold text-primary">Faculty Dashboard</h1>
                <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Not Logged In</AlertTitle>
                     <AlertDescription>Please log in to view your dashboard.</AlertDescription>
                 </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Welcome, {user.name}!</h1>
             <p className="text-muted-foreground">Your central hub for managing classes, approvals, and documents ({user.department}).</p>

            {/* Core Module Summaries */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {/* Attendance Panel */}
                 <Link href="/attendance">
                     <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary" /> Class Attendance</CardTitle>
                             <CardDescription>Quick overview of today's attendance.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             {attendanceSummary ? (
                                <>
                                     <p className="text-2xl font-bold">{attendanceSummary.presentToday ?? 'N/A'} / {attendanceSummary.totalStudents ?? 'N/A'}</p>
                                     <p className="text-sm text-muted-foreground">Students Present Today</p>
                                     {/* TODO: Add link to specific class */}
                                </>
                             ) : <p className="text-sm text-muted-foreground">Loading attendance data...</p>}
                         </CardContent>
                    </Card>
                 </Link>

                 {/* Clearance Approvals Panel */}
                 <Link href="/clearance">
                     <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CheckCircle className="text-accent" /> Clearance Approvals</CardTitle>
                             <CardDescription>Action required for student clearances.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <p className="text-2xl font-bold">{pendingClearanceCount}</p>
                             <p className="text-sm text-muted-foreground">Pending Requests</p>
                         </CardContent>
                    </Card>
                 </Link>

                 {/* Document Upload Panel */}
                  <Link href="/documents">
                     <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><FileUp className="text-blue-500" /> Documents & Papers</CardTitle>
                             <CardDescription>Manage exam papers and notices.</CardDescription>
                        </CardHeader>
                         <CardContent>
                             <p className="text-2xl font-bold">{uploadedDocsCount}</p>
                             <p className="text-sm text-muted-foreground">Your Uploaded Documents</p>
                             {/* <Button size="sm" variant="outline" className="mt-2"><FileUp className="mr-1 h-4 w-4"/> Upload New</Button> */}
                         </CardContent>
                    </Card>
                 </Link>
            </section>

             {/* Secondary Sections (Mockups) */}
             <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 {/* Student Behavior Dashboard (Mockup) */}
                 <Card>
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Users className="text-purple-500" /> Student Overview</CardTitle>
                          <CardDescription>Quick look at student regularity.</CardDescription>
                     </CardHeader>
                      <CardContent>
                         {studentBehavior.length > 0 ? (
                             <ul className="space-y-2 max-h-40 overflow-y-auto">
                                {studentBehavior.map(s => (
                                    <li key={s.studentId} className="text-sm flex justify-between items-center border-b pb-1 last:border-none">
                                        <span>{s.studentName}</span>
                                         <span className="text-xs text-muted-foreground">Regularity: {s.regularity}%</span>
                                     </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No student data available.</p>}
                         <Button variant="link" size="sm" className="mt-2" disabled>View Full Report</Button>
                     </CardContent>
                 </Card>

                 {/* Direct Communication (Mockup) */}
                 <Card>
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2"><MessageSquare className="text-orange-500" /> Student Communication</CardTitle>
                          <CardDescription>Recent messages or reminders.</CardDescription>
                     </CardHeader>
                     <CardContent>
                         {messages.length > 0 ? (
                             <ul className="space-y-2 max-h-40 overflow-y-auto">
                                 {messages.map(m => (
                                    <li key={m.studentId} className={cn("text-sm border-b pb-1 last:border-none", m.unread && "font-medium")}>
                                         <span>{m.studentName}:</span> <span className="text-muted-foreground italic">"{m.lastMessage}"</span>
                                         <span className="text-xs block text-muted-foreground/80">{format(new Date(m.timestamp), 'Pp')}</span>
                                     </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground">No recent messages.</p>}
                         <Button variant="link" size="sm" className="mt-2" disabled>Open Chat</Button>
                    </CardContent>
                 </Card>
            </section>

        </div>
    );
}

// Skeleton Loader for Faculty Dashboard
function FacultyDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
             <Skeleton className="h-8 w-1/2 rounded" /> {/* Title */}
             <Skeleton className="h-4 w-3/4 rounded" /> {/* Description */}

             {/* Core Module Summaries Skeleton */}
             <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={`core-${i}`}>
                         <CardHeader>
                             <Skeleton className="h-6 w-1/2 rounded mb-1" />
                             <Skeleton className="h-4 w-3/4 rounded" />
                         </CardHeader>
                         <CardContent>
                             <Skeleton className="h-8 w-1/4 rounded mb-1" />
                             <Skeleton className="h-4 w-1/2 rounded" />
                         </CardContent>
                    </Card>
                 ))}
            </section>

             {/* Secondary Sections Skeleton */}
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Card 1 */}
                 <Card>
                     <CardHeader><Skeleton className="h-6 w-1/2 rounded" /></CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full rounded" />
                         <Skeleton className="h-4 w-5/6 rounded" />
                         <Skeleton className="h-4 w-full rounded" />
                     </CardContent>
                 </Card>
                   {/* Card 2 */}
                 <Card>
                     <CardHeader><Skeleton className="h-6 w-1/2 rounded" /></CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full rounded" />
                         <Skeleton className="h-4 w-5/6 rounded" />
                     </CardContent>
                 </Card>
            </section>
        </div>
    );
}
