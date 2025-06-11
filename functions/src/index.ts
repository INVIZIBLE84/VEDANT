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

interface StartAttendanceSessionData {
  class_code: string;
}

export const startAttendanceSession = functions.https.onCall(
  async (data: StartAttendanceSessionData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // TODO: Add role check for faculty/admin if roles are stored in Firestore or custom claims
    // const userDoc = await db.collection("users").doc(context.auth.uid).get();
    // const userRole = userDoc.data()?.role;
    // if (!["faculty", "admin"].includes(userRole)) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "User does not have permission to start an attendance session."
    //   );
    // }

    const { class_code } = data;
    if (!class_code || typeof class_code !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid 'class_code'."
      );
    }

    const validCodes = generateUnique2DigitCodes();
    const correctCode = validCodes[Math.floor(Math.random() * validCodes.length)];
    const startTime = admin.firestore.FieldValue.serverTimestamp();
    // Calculate end time based on server timestamp once it's set, or approximate for now
    // For a more precise end_time based on server's start_time, you might need a second step
    // or rely on client-side calculation for the window and server re-validation.
    // This example uses a server-approximated end time for simplicity in one step.
    const now = new Date();
    const endTime = new Date(now.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);


    try {
      const sessionRef = await db.collection("attendance_sessions").add({
        class_code,
        valid_codes: validCodes,
        correct_code: correctCode,
        start_time: startTime,
        end_time: admin.firestore.Timestamp.fromDate(endTime),
        created_by: context.auth.uid,
      });

      return {
        success: true,
        message: "Attendance session started successfully.",
        session_id: sessionRef.id,
        valid_codes: validCodes, // Send codes to faculty to announce one
        // DO NOT send correct_code to client when starting session for faculty
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

interface SubmitAttendanceChallengeData {
  selected_code: string;
  session_id: string;
}

export const submitAttendanceChallenge = functions.https.onCall(
  async (data: SubmitAttendanceChallengeData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const studentId = context.auth.uid;

    const { selected_code, session_id } = data;
    if (
      !selected_code ||
      typeof selected_code !== "string" ||
      selected_code.length !== 2
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid 'selected_code'."
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
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Session not found.");
      }
      const sessionData = sessionDoc.data()!;

      // Validate session timing
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

      // Check for duplicate submission
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

      // Validate code and record attendance
      const isCorrect = selected_code === sessionData.correct_code;
      const status = isCorrect ? "present" : "invalid_code_selection";

      await attendanceRef.add({
        student_id: studentId,
        session_id: session_id,
        class_code: sessionData.class_code, // Store class_code for easier querying
        selected_code: selected_code,
        is_correct: isCorrect, // Store if the selection was correct
        status: status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        device_id: context.instanceIdToken || null, // Optional: device ID if available
      });

      return {
        success: true,
        message: isCorrect ?
          "Attendance marked successfully." :
          "Submission received. Code was incorrect.",
        status: status,
      };
    } catch (error: any) {
      console.error("Error submitting attendance:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to submit attendance."
      );
    }
  }
);
