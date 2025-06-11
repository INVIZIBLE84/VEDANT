
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const SESSION_DURATION_MINUTES = 2;

/**
 * Generates three unique 2-digit random codes as strings (e.g., "07", "19", "23").
 * @return {string[]} An array of three unique 2-digit codes.
 */
function generateUnique2DigitCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < 3) {
    const num = Math.floor(Math.random() * 100);
    codes.add(num.toString().padStart(2, "0"));
  }
  return Array.from(codes);
}

interface StartAttendanceSessionInput {
  class_code: string;
}

// Callable Function to start an attendance session
export const startAttendanceSession = functions.https.onCall(
  async (data: StartAttendanceSessionInput, context) => {
    // 1. Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // 2. Role Check (Optional but recommended: Ensure caller is faculty/admin)
    // This requires storing user roles in Firestore or custom claims
    // const userDoc = await db.collection("users").doc(context.auth.uid).get();
    // const userRole = userDoc.data()?.role;
    // if (!["faculty", "admin"].includes(userRole)) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "User does not have permission to start an attendance session."
    //   );
    // }

    // 3. Input Validation
    const { class_code } = data;
    if (!class_code || typeof class_code !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid 'class_code' (string)."
      );
    }

    // 4. Generate Codes and Session Details
    const generatedCodes = generateUnique2DigitCodes();
    const correctCode = generatedCodes[Math.floor(Math.random() * generatedCodes.length)];
    const startTime = admin.firestore.FieldValue.serverTimestamp();
    // For end_time, we use serverTimestamp for start and calculate offset.
    // Client should ideally also manage a local timer based on this window.
    const now = new Date();
    const endTime = new Date(now.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);


    try {
      // 5. Store Session in Firestore
      const sessionRef = await db.collection("attendance_sessions").add({
        class_code,
        generated_codes: generatedCodes,
        correct_code: correctCode,
        start_time: startTime, // Server timestamp for reliable start
        end_time: admin.firestore.Timestamp.fromDate(endTime), // Calculated end time
        created_by: context.auth.uid,
      });

      console.log(`Attendance session ${sessionRef.id} started for class ${class_code} by ${context.auth.uid}. Codes: ${generatedCodes.join(", ")}, Correct: ${correctCode}`);

      // 6. Return Session ID and Codes (Faculty announces one as correct)
      return {
        success: true,
        message: "Attendance session started successfully.",
        session_id: sessionRef.id,
        generated_codes: generatedCodes, // Send all codes to faculty/client to display
        // DO NOT send correct_code to the client that starts the session
      };
    } catch (error) {
      console.error("Error starting attendance session:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to start attendance session."
      );
    }
  }
);

interface SubmitAttendanceInput {
  student_id: string; // Though for security, we should use context.auth.uid
  session_id: string;
  selected_code: string;
}

// Callable Function for students to submit their attendance
export const submitAttendance = functions.https.onCall(
  async (data: SubmitAttendanceInput, context) => {
    // 1. Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const studentId = context.auth.uid; // Use authenticated user's ID

    // 2. Input Validation
    const { session_id, selected_code } = data;
    if (
      !selected_code ||
      typeof selected_code !== "string" ||
      selected_code.length !== 2 // Assuming 2-digit codes
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid 'selected_code'. Must be a 2-digit string."
      );
    }
    if (!session_id || typeof session_id !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid 'session_id'."
      );
    }

    const sessionRef = db.collection("attendance_sessions").doc(session_id);
    const attendanceRef = db.collection("attendance");

    try {
      // 3. Fetch Session Details
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Attendance session not found.");
      }
      const sessionData = sessionDoc.data()!;

      // 4. Time Window Validation
      const now = admin.firestore.Timestamp.now();
      const sessionStartTime = sessionData.start_time as admin.firestore.Timestamp;
      const sessionEndTime = sessionData.end_time as admin.firestore.Timestamp;

      if (now.toMillis() < sessionStartTime.toMillis()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Attendance session has not started yet."
        );
      }
      if (now.toMillis() > sessionEndTime.toMillis()) {
        throw new functions.https.HttpsError(
          "deadline-exceeded",
          "Attendance session has ended."
        );
      }

      // 5. Prevent Duplicate Submissions
      const existingSubmissionQuery = await attendanceRef
        .where("student_id", "==", studentId)
        .where("session_id", "==", session_id)
        .limit(1)
        .get();

      if (!existingSubmissionQuery.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Attendance already submitted for this session."
        );
      }

      // 6. Validate Code and Record Attendance
      const isCorrect = selected_code === sessionData.correct_code;
      const status = isCorrect ? "present" : "invalid";

      await attendanceRef.add({
        student_id: studentId,
        session_id: session_id,
        class_code: sessionData.class_code, // Store class_code for easier querying later
        selected_code: selected_code,
        status: status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        device_id: context.instanceIdToken || null, // Optional: device ID if available through app check
      });

      console.log(`Attendance submitted for student ${studentId} in session ${session_id}. Selected: ${selected_code}, Correct: ${sessionData.correct_code}, Status: ${status}`);

      return {
        success: true,
        message: isCorrect ?
          "Attendance marked successfully as present." :
          "Submission received. Unfortunately, the selected code was incorrect.",
        status: status,
      };
    } catch (error: any) {
      console.error("Error submitting attendance:", error);
      if (error instanceof functions.https.HttpsError) {
        // Re-throw HttpsError to be caught by the client correctly
        throw error;
      }
      // For other errors, throw a generic internal error
      throw new functions.https.HttpsError(
        "internal",
        "Failed to submit attendance. An unexpected error occurred."
      );
    }
  }
);

    