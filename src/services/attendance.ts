
import { firebaseApp } from '@/lib/firebase'; // Assuming firebase.ts exports initialized app
import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import { AuthUser } from '@/types/user'; // For user context if needed

/**
 * Represents a student's attendance status for a specific date.
 */
export interface AttendanceRecord {
  /** Unique identifier for the record */
  id: string;
  /** ID of the student */
  studentId: string;
  /** Student's Name */
  studentName?: string;
  /** Date of attendance */
  date: string; // ISO Date string (e.g., "2024-07-26")
  /** Time attendance was marked (optional) */
  timestamp?: string; // ISO DateTime string
  /** Status */
  isPresent: boolean;
  /** Class/Course ID (optional) */
  classId?: string;
  /** Remarks (e.g., "Late", "Manual Override", "Code Challenge") */
  remarks?: string;
  /** Method of attendance marking */
  method?: 'code_challenge' | 'manual' | 'other';
}

/**
 * Represents summary statistics for attendance.
 */
export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
}

// --- New Types for Code Challenge System ---
export interface AttendanceSessionStartData {
  class_code: string;
}

export interface AttendanceSessionStartResult {
  success: boolean;
  message: string;
  session_id?: string;
  generated_codes?: string[];
  correct_code?: string; // Faculty needs this to announce
  end_time?: { _seconds: number, _nanoseconds: number }; // Firestore Timestamp structure
}

export interface StudentAttendanceSubmitData {
  session_id: string;
  selected_code: string;
}

export interface StudentAttendanceSubmitResult {
  success: boolean;
  message: string;
  status?: 'present' | 'invalid';
}


let functionsInstance: Functions | null = null;

const getFirebaseFunctions = (): Functions => {
  if (!functionsInstance) {
    // TODO: Make sure YOUR_PROJECT_ID is replaced or dynamically configured.
    // It's better to initialize Firebase centrally and import `functions` from there.
    // For now, assuming firebaseApp from @/lib/firebase is correctly initialized.
    functionsInstance = getFunctions(firebaseApp, 'us-central1'); // Specify region if not us-central1
  }
  return functionsInstance;
};

/**
 * (Faculty/Admin) Starts a new code challenge attendance session.
 * @param classCode The class code for which to start the session.
 * @returns A promise resolving to the session details.
 */
export async function startNewAttendanceSession(classCode: string): Promise<AttendanceSessionStartResult> {
  try {
    const functions = getFirebaseFunctions();
    const startSessionFunction = httpsCallable<AttendanceSessionStartData, AttendanceSessionStartResult>(functions, 'startAttendanceSession');
    const result = await startSessionFunction({ class_code: classCode });
    return result.data;
  } catch (error: any) {
    console.error("Error starting attendance session:", error);
    return { success: false, message: error.message || "Failed to start session." };
  }
}

/**
 * (Student) Submits their selected code for an attendance session.
 * Student ID is taken from the authenticated context on the backend.
 * @param sessionId The ID of the active session.
 * @param selectedCode The 2-digit code selected by the student.
 * @returns A promise resolving to the submission result.
 */
export async function submitStudentAttendance(sessionId: string, selectedCode: string): Promise<StudentAttendanceSubmitResult> {
  try {
    const functions = getFirebaseFunctions();
    const submitAttendanceFunction = httpsCallable<StudentAttendanceSubmitData, StudentAttendanceSubmitResult>(functions, 'submitAttendance');
    const result = await submitAttendanceFunction({ session_id: sessionId, selected_code: selectedCode });
    return result.data;
  } catch (error: any) {
    console.error("Error submitting attendance:", error);
    return { success: false, message: error.message || "Failed to submit attendance." };
  }
}


/**
 * Marks attendance manually by faculty/admin.
 * @param studentId The ID of the student.
 * @param details Details about the marking context.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function markManualAttendance(
  studentId: string,
  details: {
    classId?: string;
    markedBy: string; // UserID of faculty/admin
    isPresent: boolean;
    dateOverride?: string; // For manual marking on a specific date (YYYY-MM-DD)
  }
): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to mark manual attendance for student: ${studentId}:`, details);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB operation

  const dateToMark = details.dateOverride || new Date().toISOString().split('T')[0];
  const studentName = mockStudents.find(s => s.id === studentId)?.name || `Student ${studentId.slice(-3)}`;

  const existingRecord = sampleAttendanceData.find(r =>
    r.studentId === studentId &&
    r.date === dateToMark &&
    (details.classId ? r.classId === details.classId : true) &&
    r.method === 'manual' // Check if already manually marked
  );

  if (existingRecord) {
    return { success: false, message: `Attendance already manually marked as ${existingRecord.isPresent ? 'Present' : 'Absent'} for ${dateToMark}${details.classId ? ` in class ${details.classId}`: ''}.` };
  }

  const newRecord: AttendanceRecord = {
    id: `att-manual-${Date.now()}`,
    studentId: studentId,
    studentName: studentName,
    date: dateToMark,
    timestamp: new Date().toISOString(),
    isPresent: details.isPresent,
    classId: details.classId || 'MANUAL-ENTRY',
    remarks: `Manual Entry by ${details.markedBy}`,
    method: 'manual',
  };
  sampleAttendanceData.push(newRecord);
  console.log("Added new manual attendance record:", newRecord);
  return { success: true, message: `Attendance manually recorded as ${details.isPresent ? 'Present' : 'Absent'} successfully.` };
}


/**
 * Asynchronously retrieves attendance information for a given student or all.
 * @param studentId The ID of the student. If empty, fetches all records (for admin/faculty).
 * @returns A promise that resolves to an array of AttendanceRecord objects.
 */
export async function getStudentAttendance(studentId?: string): Promise<AttendanceRecord[]> {
  console.log(`Fetching attendance for student: ${studentId || 'ALL'}`);
  await new Promise(resolve => setTimeout(resolve, 50));
  if (studentId) {
    return sampleAttendanceData.filter(record => record.studentId === studentId);
  }
  return [...sampleAttendanceData]; // For admin/faculty view
}

/**
 * Calculates attendance summary statistics.
 * @param records An array of attendance records.
 * @returns An AttendanceSummary object.
 */
export function calculateAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const totalDays = records.length;
  const presentDays = records.filter(att => att.isPresent).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 0.0;
  return { totalDays, presentDays, absentDays, attendancePercentage };
}

/**
 * Gets today's attendance status for a student.
 */
export async function getTodayAttendanceStatus(studentId: string): Promise<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string; method?: string }> {
    const today = new Date().toISOString().split('T')[0];
    const allAttendance = await getStudentAttendance(studentId);
    const todayRecord = allAttendance.find(record => record.date === today);

    if (todayRecord) {
        return {
            status: todayRecord.isPresent ? 'Present' : 'Absent',
            time: todayRecord.timestamp ? new Date(todayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            method: todayRecord.method
        };
    }
    return { status: 'Not Marked' };
}

// Mock data (replace with actual DB calls)
const mockStudents = [
    { id: 'student123', name: 'Alice Smith', department: 'Computer Science' },
    { id: 'student456', name: 'Bob Johnson', department: 'Physics' },
    { id: 'student789', name: 'Charlie Brown', department: 'Mathematics' },
];

let sampleAttendanceData: AttendanceRecord[] = [
  { id: 'att1', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-22', timestamp: '2024-07-22T09:05:00Z', isPresent: true, classId: 'CS101', remarks: 'Code Challenge', method: 'code_challenge' },
  { id: 'att3', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-24', timestamp: '2024-07-24T09:15:00Z', isPresent: false, classId: 'CS101', remarks: 'Sick leave', method: 'other' },
  { id: 'att5', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-22', timestamp: '2024-07-22T09:03:00Z', isPresent: true, classId: 'CS101', remarks: 'Manual Entry by faculty999', method: 'manual' },
];
