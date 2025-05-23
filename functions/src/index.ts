import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface AttendanceData {
  student_id: string; // This will be derived from context.auth.uid
  class_code: string;
  session_code: string;
  frequency_detected: number;
  device_id?: string;
}

/**
 * Validates and marks student attendance.
 * - Checks ultrasonic frequency range (18.5 kHz - 20.5 kHz).
 * - Enforces an attendance window (e.g., first 10 minutes of the hour).
 * - Prevents duplicate submissions for the same student and session.
 * - Requires user authentication.
 */
export const markAttendance = functions.https.onCall(
  async (data: AttendanceData, context) => {
    // 1. Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const studentId = context.auth.uid;

    // 2. Input Validation
    const {class_code, session_code, frequency_detected, device_id} = data;
    if (!class_code || !session_code || frequency_detected === undefined) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: class_code, session_code, or frequency_detected."
      );
    }

    // 3. Frequency Validation
    if (frequency_detected < 18.5 || frequency_detected > 20.5) {
      throw new functions.https.HttpsError(
        "out-of-range",
        `Frequency detected (${frequency_detected}kHz) is out of the acceptable range (18.5kHz - 20.5kHz).`
      );
    }

    // 4. Attendance Window Validation
    // For this example, we'll allow attendance within the first 10 minutes of any hour.
    // In a real app, this would be based on actual class/session start times from a schedule.
    const now = new Date();
    const currentMinute = now.getMinutes();
    // const currentHour = now.getHours(); // Could be used for specific hour checks

    // Example: Class "CS101" is at 9 AM, window 9:00 - 9:10 AM UTC
    // This is a simplified example. A real system would fetch session times.
    const ATTENDANCE_WINDOW_START_MINUTE = 0; // Start of the hour
    const ATTENDANCE_WINDOW_END_MINUTE = 10; // 10 minutes past the hour

    // A more specific check for a hypothetical 9 AM class:
    // if (class_code === "CS101_MONDAY_9AM") {
    //   if (currentHour !== 9 || currentMinute < 0 || currentMinute > 10) {
    //      throw new functions.https.HttpsError(
    //       "failed-precondition",
    //       "Attendance marking is outside the allowed window for this session (e.g. 9:00-9:10 AM)."
    //      );
    //   }
    // } else
    if (
      currentMinute < ATTENDANCE_WINDOW_START_MINUTE ||
      currentMinute > ATTENDANCE_WINDOW_END_MINUTE
    ) {
      functions.logger.warn(
        `Attendance attempt outside window. Student: ${studentId}, Session: ${session_code}, Time: ${now.toISOString()}`
      );
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Attendance marking is outside the allowed window (first 10 minutes of the hour)."
      );
    }

    // 5. Duplicate Submission Check
    const attendanceCollection = db.collection("attendance");
    const querySnapshot = await attendanceCollection
      .where("student_id", "==", studentId)
      .where("session_code", "==", session_code)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Attendance has already been marked for this session."
      );
    }

    // 6. Store Attendance Record
    const newAttendanceRecord = {
      student_id: studentId,
      class_code,
      session_code,
      frequency_detected,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...(device_id && {device_id}), // Add device_id if provided
    };

    try {
      await attendanceCollection.add(newAttendanceRecord);
      functions.logger.info(
        `Attendance marked successfully for student ${studentId}, session ${session_code}`
      );
      return {
        success: true,
        message: "Attendance marked successfully.",
        timestamp: new Date().toISOString(), // Return current server time for confirmation
      };
    } catch (error) {
      functions.logger.error(
        `Error storing attendance for student ${studentId}:`,
        error
      );
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while saving attendance.",
        error
      );
    }
  }
);
