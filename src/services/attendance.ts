/**
 * Represents a student's attendance status for a specific date.
 */
export interface AttendanceRecord {
  /** Unique identifier for the record */
  id: string;
  /** ID of the student */
  studentId: string;
  /** Student's Name */
  studentName?: string; // Optional: Useful for Faculty/Admin views
  /** Date of attendance */
  date: string; // ISO Date string (e.g., "2024-07-26")
  /** Time attendance was marked (optional) */
  timestamp?: string; // ISO DateTime string
  /** Status */
  isPresent: boolean;
  /** Class/Course ID (optional) */
  classId?: string;
  /** Remarks (e.g., "Late", "Manual Override") */
  remarks?: string;
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

/**
 * Represents filters for querying attendance data.
 */
export interface AttendanceFilters {
  /** Filter by specific student ID */
  studentId?: string;
  /** Filter by specific class/course ID */
  classId?: string;
  /** Start date for filtering (inclusive) */
  startDate?: string; // ISO Date string
  /** End date for filtering (inclusive) */
  endDate?: string; // ISO Date string
}

/**
 * Represents data needed for attendance analytics charts.
 */
export interface AttendanceChartData {
  labels: string[]; // E.g., Dates, Months
  datasets: {
    label: string; // E.g., 'Present', 'Absent'
    data: number[];
    backgroundColor?: string; // Optional: for charts
    borderColor?: string; // Optional: for charts
  }[];
}

/** Mock user roles */
export type UserRole = "student" | "faculty" | "admin";

/**
 * Asynchronously retrieves attendance information for a given student.
 * (Specific for student view)
 * @param studentId The ID of the student.
 * @returns A promise that resolves to an array of AttendanceRecord objects for the student.
 */
export async function getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  console.log(`Fetching attendance for student: ${studentId}`);
  // TODO: Replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  // Return sample data relevant to a single student
  return sampleAttendanceData.filter(record => record.studentId === studentId);
}

/**
 * Asynchronously retrieves attendance for a class, typically for faculty view.
 * @param facultyId The ID of the faculty member.
 * @param classId The ID of the class.
 * @param filters Optional filters for date range, etc.
 * @returns A promise that resolves to an array of AttendanceRecord objects for the class.
 */
export async function getAttendanceForFaculty(facultyId: string, classId: string, filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
  console.log(`Fetching attendance for faculty: ${facultyId}, class: ${classId}, filters:`, filters);
  // TODO: Replace with actual API call, applying filters server-side
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  let results = sampleAttendanceData.filter(record => record.classId === classId);
  if (filters?.startDate) {
    results = results.filter(r => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter(r => r.date <= filters.endDate!);
  }
  return results;
}

/**
 * Asynchronously retrieves attendance across multiple classes/students, for admin view.
 * @param filters Optional filters for date range, student, class, etc.
 * @returns A promise that resolves to an array of AttendanceRecord objects based on filters.
 */
export async function getAttendanceForAdmin(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
  console.log(`Fetching attendance for admin, filters:`, filters);
  // TODO: Replace with actual API call, applying filters server-side
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay
  let results = [...sampleAttendanceData];
  if (filters?.studentId) {
    results = results.filter(r => r.studentId === filters.studentId);
  }
  if (filters?.classId) {
    results = results.filter(r => r.classId === filters.classId);
  }
  if (filters?.startDate) {
    results = results.filter(r => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter(r => r.date <= filters.endDate!);
  }
  return results;
}


/**
 * Marks attendance for a student. Includes basic location validation simulation.
 * @param studentId The ID of the student.
 * @param locationData Simulated location data (e.g., { wifiSsid: 'Campus-WiFi', coordinates: {...} }).
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function markAttendance(studentId: string, locationData: { wifiSsid?: string }): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to mark attendance for student: ${studentId} with location:`, locationData);
  // TODO: Replace with actual API call to backend which performs robust validation
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay & validation

  // Simulate basic validation
  const isValidLocation = locationData.wifiSsid === 'Campus-WiFi'; // Example validation
  const today = new Date().toISOString().split('T')[0];

  if (isValidLocation) {
    // Check if already marked today
    const existingRecord = sampleAttendanceData.find(r => r.studentId === studentId && r.date === today);
    if (existingRecord) {
      return { success: false, message: `Attendance already marked as ${existingRecord.isPresent ? 'Present' : 'Absent'} today.` };
    }

    // Simulate successful marking - In reality, the backend would create/update the record
    const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        studentId: studentId,
        studentName: `Student ${studentId.slice(-3)}`, // Add name for consistency
        date: today,
        timestamp: new Date().toISOString(),
        isPresent: true,
        classId: 'CS101', // Assuming a default class for simplicity
        remarks: 'Auto-Marked'
    };
    sampleAttendanceData.push(newRecord); // Add to mock data
     console.log("Added new attendance record:", newRecord); // Log the new record
    return { success: true, message: `Attendance recorded successfully at ${new Date().toLocaleTimeString()}.` };
  } else {
    return { success: false, message: "Failed: You must be within the designated campus area (e.g., connected to Campus-WiFi)." };
  }
}

/**
 * Manually overrides attendance, typically by an admin.
 * @param recordId The ID of the attendance record to update.
 * @param newStatus The new presence status (true for present, false for absent).
 * @param remarks Reason for the override.
 * @param adminId ID of the admin performing the action.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function manualAttendanceOverride(recordId: string, newStatus: boolean, remarks: string, adminId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Admin ${adminId} overriding attendance record ${recordId} to ${newStatus ? 'Present' : 'Absent'} with remarks: ${remarks}`);
  // TODO: Replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 100));
   const recordIndex = sampleAttendanceData.findIndex(r => r.id === recordId);
   if (recordIndex > -1) {
       sampleAttendanceData[recordIndex].isPresent = newStatus;
       sampleAttendanceData[recordIndex].remarks = `Manual Override: ${remarks}`;
       sampleAttendanceData[recordIndex].timestamp = new Date().toISOString();
       return { success: true, message: "Attendance updated successfully." };
   } else {
       return { success: false, message: "Record not found." };
   }
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
 * Generates sample data for attendance charts (e.g., monthly trend).
 * @param records An array of attendance records.
 * @returns AttendanceChartData object.
 */
export async function getAttendanceChartData(records: AttendanceRecord[]): Promise<AttendanceChartData> {
    // TODO: Implement more sophisticated aggregation based on dates/months
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing
    const summary = calculateAttendanceSummary(records);
    return {
        labels: ['Present', 'Absent'],
        datasets: [{
            label: 'Attendance Distribution',
            data: [summary.presentDays, summary.absentDays],
            backgroundColor: ['hsl(var(--chart-1))', 'hsl(var(--chart-4))'], // Example colors
        }]
    };
}

/**
 * Generates a CSV string from attendance data.
 * @param records An array of attendance records.
 * @returns A string in CSV format.
 */
export async function exportAttendanceToCSV(records: AttendanceRecord[]): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
    if (!records || records.length === 0) return "ID,Student ID,Student Name,Date,Timestamp,Status,Class ID,Remarks\n";

    const header = "ID,Student ID,Student Name,Date,Timestamp,Status,Class ID,Remarks";
    const rows = records.map(r =>
        [
            r.id,
            r.studentId,
            r.studentName || '',
            r.date,
            r.timestamp || '',
            r.isPresent ? 'Present' : 'Absent',
            r.classId || '',
            r.remarks || ''
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',') // Escape quotes and handle nulls
    );

    return `${header}\n${rows.join('\n')}`;
}


// --- Sample Data (In-memory placeholder) ---
// In a real app, this data would come from a database via API calls.
let sampleAttendanceData: AttendanceRecord[] = [
  { id: 'att1', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-22', timestamp: '2024-07-22T09:05:00Z', isPresent: true, classId: 'CS101', remarks: '' },
  { id: 'att2', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-23', timestamp: '2024-07-23T09:02:00Z', isPresent: true, classId: 'CS101', remarks: '' },
  { id: 'att3', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-24', timestamp: '2024-07-24T09:15:00Z', isPresent: false, classId: 'CS101', remarks: 'Sick leave' },
  { id: 'att4', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-25', timestamp: '2024-07-25T09:08:00Z', isPresent: true, classId: 'CS101', remarks: '' },
   { id: 'att5', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-22', timestamp: '2024-07-22T09:03:00Z', isPresent: true, classId: 'CS101', remarks: '' },
   { id: 'att6', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-23', timestamp: '2024-07-23T09:10:00Z', isPresent: true, classId: 'CS101', remarks: 'Late' },
   { id: 'att7', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-24', timestamp: '2024-07-24T00:00:00Z', isPresent: false, classId: 'CS101', remarks: '' }, // No timestamp might mean not marked / absent
   { id: 'att8', studentId: 'student789', studentName: 'Charlie Brown', date: '2024-07-22', timestamp: '2024-07-22T09:00:00Z', isPresent: true, classId: 'MA202', remarks: '' },
   { id: 'att9', studentId: 'student789', studentName: 'Charlie Brown', date: '2024-07-24', timestamp: '2024-07-24T11:05:00Z', isPresent: true, classId: 'MA202', remarks: '' },
];

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Function to get today's attendance status for a student
export async function getTodayAttendanceStatus(studentId: string): Promise<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string }> {
    const today = getTodayDateString();
    // Force fetch the latest data - adjust if caching is used elsewhere
    const allAttendance = await getStudentAttendance(studentId);
    const todayRecord = allAttendance.find(record => record.date === today);

    if (todayRecord) {
        return {
            status: todayRecord.isPresent ? 'Present' : 'Absent',
            time: todayRecord.timestamp ? new Date(todayRecord.timestamp).toLocaleTimeString() : undefined
        };
    }
    return { status: 'Not Marked' };
}
