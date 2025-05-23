
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
  /** Remarks (e.g., "Late", "Manual Override", "Ultrasonic") */
  remarks?: string;
  /** Method of attendance marking */
  method?: 'ultrasonic' | 'manual' | 'other'; // Added method
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
 * Asynchronously retrieves attendance information for a given student.
 * (Specific for student view or fetching all if studentId is empty for admin)
 * @param studentId The ID of the student. If empty or null, might fetch all (needs adjustment based on backend).
 * @returns A promise that resolves to an array of AttendanceRecord objects for the student.
 */
export async function getStudentAttendance(studentId?: string): Promise<AttendanceRecord[]> {
  console.log(`Fetching attendance for student: ${studentId || 'ALL'}`);
  await new Promise(resolve => setTimeout(resolve, 50));
  if (studentId) {
    return sampleAttendanceData.filter(record => record.studentId === studentId);
  }
  // For admin/faculty "View Records" tab, return all for now.
  // This should ideally be a separate function or have role-based filtering.
  return [...sampleAttendanceData];
}


/**
 * Marks attendance for a student. Includes basic location validation simulation.
 * @param studentId The ID of the student.
 * @param details Details about the marking method and context.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function markAttendance(
  studentId: string,
  details: {
    method: 'ultrasonic' | 'manual';
    classId?: string;
    markedBy?: string; // UserID of faculty/admin for manual marking
    isPresentOverride?: boolean; // Explicitly set presence for manual/ultrasonic
    dateOverride?: string; // For manual marking on a specific date (YYYY-MM-DD)
  }
): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to mark attendance for student: ${studentId} via ${details.method}:`, details);
  await new Promise(resolve => setTimeout(resolve, 300));

  const dateToMark = details.dateOverride || new Date().toISOString().split('T')[0];
  const studentName = `Student ${studentId.slice(-3)}`; // Mock name

  // Prevent duplicate marking for the same student, date, and class (if provided)
  const existingRecord = sampleAttendanceData.find(r =>
    r.studentId === studentId &&
    r.date === dateToMark &&
    (details.classId ? r.classId === details.classId : true) // Check classId if provided
  );

  if (existingRecord) {
    return { success: false, message: `Attendance already marked as ${existingRecord.isPresent ? 'Present' : 'Absent'} for ${dateToMark}${details.classId ? ` in class ${details.classId}`: ''}.` };
  }

  let isPresent = false;
  let remarks = "";

  if (details.method === 'ultrasonic') {
    // Simulate ultrasonic detection validation (always successful for demo)
    isPresent = details.isPresentOverride !== undefined ? details.isPresentOverride : true; // Assume present if detected
    remarks = "Ultrasonic Detection";
  } else if (details.method === 'manual') {
    if (!details.markedBy) {
      return { success: false, message: "Manual marking requires an admin/faculty ID." };
    }
    isPresent = details.isPresentOverride !== undefined ? details.isPresentOverride : true; // Faculty marks present
    remarks = `Manual Entry by ${details.markedBy}`;
  } else {
    return { success: false, message: "Invalid attendance method." };
  }

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    studentId: studentId,
    studentName: studentName,
    date: dateToMark,
    timestamp: new Date().toISOString(),
    isPresent: isPresent,
    classId: details.classId || 'UNKNOWN',
    remarks: remarks,
    method: details.method,
  };
  sampleAttendanceData.push(newRecord);
  console.log("Added new attendance record:", newRecord);
  return { success: true, message: `Attendance recorded as ${isPresent ? 'Present' : 'Absent'} successfully at ${new Date(newRecord.timestamp).toLocaleTimeString()}.` };
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
  await new Promise(resolve => setTimeout(resolve, 100));
   const recordIndex = sampleAttendanceData.findIndex(r => r.id === recordId);
   if (recordIndex > -1) {
       sampleAttendanceData[recordIndex].isPresent = newStatus;
       sampleAttendanceData[recordIndex].remarks = `Manual Override: ${remarks}`;
       sampleAttendanceData[recordIndex].timestamp = new Date().toISOString();
       sampleAttendanceData[recordIndex].method = 'manual'; // Explicitly set method if overridden
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
  const totalDays = records.length; // This might need to be distinct days if student has multiple classes
  const presentDays = records.filter(att => att.isPresent).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(1)) : 0.0;
  return { totalDays, presentDays, absentDays, attendancePercentage };
}


/**
 * Generates a CSV string from attendance data.
 * @param records An array of attendance records.
 * @returns A string in CSV format.
 */
export async function exportAttendanceToCSV(records: AttendanceRecord[]): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!records || records.length === 0) return "ID,Student ID,Student Name,Date,Timestamp,Status,Class ID,Method,Remarks\n";

    const header = "ID,Student ID,Student Name,Date,Timestamp,Status,Class ID,Method,Remarks";
    const rows = records.map(r =>
        [
            r.id,
            r.studentId,
            r.studentName || '',
            r.date,
            r.timestamp || '',
            r.isPresent ? 'Present' : 'Absent',
            r.classId || '',
            r.method || '',
            r.remarks || ''
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
    );

    return `${header}\n${rows.join('\n')}`;
}


let sampleAttendanceData: AttendanceRecord[] = [
  { id: 'att1', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-22', timestamp: '2024-07-22T09:05:00Z', isPresent: true, classId: 'CS101', remarks: 'Ultrasonic', method: 'ultrasonic' },
  { id: 'att2', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-23', timestamp: '2024-07-23T09:02:00Z', isPresent: true, classId: 'CS101', remarks: 'Manual Entry by faculty999', method: 'manual' },
  { id: 'att3', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-24', timestamp: '2024-07-24T09:15:00Z', isPresent: false, classId: 'CS101', remarks: 'Sick leave', method: 'other' },
  { id: 'att4', studentId: 'student123', studentName: 'Alice Smith', date: '2024-07-25', timestamp: '2024-07-25T09:08:00Z', isPresent: true, classId: 'CS101', remarks: 'Ultrasonic', method: 'ultrasonic' },
  { id: 'att5', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-22', timestamp: '2024-07-22T09:03:00Z', isPresent: true, classId: 'CS101', remarks: 'Ultrasonic', method: 'ultrasonic' },
  { id: 'att6', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-23', timestamp: '2024-07-23T09:10:00Z', isPresent: true, classId: 'CS101', remarks: 'Late', method: 'manual' },
  { id: 'att7', studentId: 'student456', studentName: 'Bob Johnson', date: '2024-07-24', isPresent: false, classId: 'CS101', remarks: '', method: 'other' },
  { id: 'att8', studentId: 'student789', studentName: 'Charlie Brown', date: '2024-07-22', timestamp: '2024-07-22T09:00:00Z', isPresent: true, classId: 'MA202', remarks: 'Ultrasonic', method: 'ultrasonic' },
  { id: 'att9', studentId: 'student789', studentName: 'Charlie Brown', date: '2024-07-24', timestamp: '2024-07-24T11:05:00Z', isPresent: true, classId: 'MA202', remarks: 'Ultrasonic', method: 'ultrasonic' },
];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export async function getTodayAttendanceStatus(studentId: string): Promise<{ status: 'Present' | 'Absent' | 'Not Marked'; time?: string }> {
    const today = getTodayDateString();
    const allAttendance = await getStudentAttendance(studentId); // This now correctly calls the modified function
    const todayRecord = allAttendance.find(record => record.date === today);

    if (todayRecord) {
        return {
            status: todayRecord.isPresent ? 'Present' : 'Absent',
            time: todayRecord.timestamp ? new Date(todayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
    }
    return { status: 'Not Marked' };
}
