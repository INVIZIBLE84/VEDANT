// src/app/(requiresAuth)/schedule/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser, UserRole } from "@/types/user"; // Import user types/functions
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { CalendarClock, AlertTriangle } from "lucide-react"; // Import icons

// TODO: Replace with actual data fetching from a service
interface ScheduleItem {
  day: string;
  time: string;
  courseCode: string;
  courseName: string;
  location: string;
  faculty: string;
}

// Sample data - structure may vary based on actual data source
const sampleSchedule: ScheduleItem[] = [
  { day: 'Monday', time: '09:00 - 10:30', courseCode: 'CS101', courseName: 'Intro to Computer Science', location: 'Room 301', faculty: 'Dr. Turing' },
  { day: 'Monday', time: '11:00 - 12:30', courseCode: 'MA101', courseName: 'Calculus I', location: 'Room 210', faculty: 'Prof. Newton' },
  { day: 'Tuesday', time: '10:00 - 11:30', courseCode: 'PH101', courseName: 'General Physics', location: 'Lab 1', faculty: 'Dr. Curie' },
  { day: 'Wednesday', time: '09:00 - 10:30', courseCode: 'CS101', courseName: 'Intro to Computer Science', location: 'Room 301', faculty: 'Dr. Turing' },
  { day: 'Wednesday', time: '13:00 - 14:30', courseCode: 'EN101', courseName: 'English Composition', location: 'Room 105', faculty: 'Prof. Austen' },
  { day: 'Thursday', time: '10:00 - 11:30', courseCode: 'PH101', courseName: 'General Physics', location: 'Lab 1', faculty: 'Dr. Curie' },
  { day: 'Friday', time: '11:00 - 12:30', courseCode: 'MA101', courseName: 'Calculus I', location: 'Room 210', faculty: 'Prof. Newton' },
];

export default async function SchedulePage() {
  // User is guaranteed to be authenticated by the layout
  const user = await getCurrentUser();

  // In a real app, fetch schedule based on user role and ID
  // Example: If student, fetch their schedule; if faculty, fetch classes they teach.
  let schedule: ScheduleItem[] = [];
  if (user && (user.role === 'student' || user.role === 'faculty')) {
      // TODO: Replace with actual fetch logic based on user.id and user.role
      schedule = sampleSchedule; // Using sample data for now
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // Add Sat/Sun if needed

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
         <CalendarClock className="h-7 w-7"/> Course Schedule
      </h1>

      {/* Show alert if schedule isn't applicable for the role */}
       {user && !['student', 'faculty'].includes(user.role) && (
           <Alert>
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Information</AlertTitle>
               <AlertDescription>The course schedule is typically available for students and faculty.</AlertDescription>
           </Alert>
       )}


       {['student', 'faculty'].includes(user?.role || '') && (
            <Card className="transform transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>Your class timetable for the current semester.</CardDescription>
                </CardHeader>
                <CardContent>
                {daysOfWeek.map(day => {
                    const daySchedule = schedule.filter(item => item.day === day);
                    if (daySchedule.length === 0) return null; // Don't render if no classes on this day

                    return (
                        <div key={day} className="mb-6">
                            <h2 className="text-xl font-semibold text-secondary mb-3 border-b pb-1">{day}</h2>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Time</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead className="hidden md:table-cell">Location</TableHead>
                                    <TableHead className="hidden lg:table-cell">Faculty</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {daySchedule.sort((a, b) => a.time.localeCompare(b.time)).map((item, index) => (
                                    <TableRow key={`${day}-${index}`}>
                                        <TableCell className="font-medium">{item.time}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold block">{item.courseName}</span>
                                            <span className="text-xs text-muted-foreground">{item.courseCode}</span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{item.location}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{item.faculty}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                    )
                })}
                {schedule.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No schedule information available.</p>
                )}
                </CardContent>
            </Card>
       )}
    </div>
  );
}
