
'use server';

import { AuthUser, UserRole } from '@/types/user';
import { getStudentAttendance, calculateAttendanceSummary, AttendanceSummary, AttendanceRecord } from './attendance';
import { getFeeDetails, FeeDetails } from './fee-management';
import { getStudentClearanceStatus, ClearanceRequest, calculateProgress as calculateClearanceProgress } from './clearance';
import { getUserById } from './admin';
import { getStudentBehaviorProfile, StudentBehaviorAnalytics } from './analytics'; // Assuming this function exists
import { format } from 'date-fns';

export interface IndividualStudentReportData {
    studentProfile: AuthUser | null;
    attendanceSummary: AttendanceSummary | null;
    recentAttendanceRecords: AttendanceRecord[]; // A limited number of recent records
    feeDetails: FeeDetails | null;
    clearanceRequest: ClearanceRequest | null;
    clearanceProgressPercentage: number;
    behavioralAnalysis: StudentBehaviorAnalytics | null;
    generatedDate: string;
    reportTitle: string;
}

export async function generateIndividualStudentReport(studentId: string): Promise<IndividualStudentReportData | null> {
    console.log(`Generating individual report for student ID: ${studentId}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate data aggregation time

    try {
        const studentProfile = await getUserById(studentId);
        if (!studentProfile) {
            console.error(`Student profile not found for ID: ${studentId}`);
            return null;
        }

        const [
            attendanceRecords,
            feeDetails,
            clearanceRequest,
            // Assuming getStudentBehaviorProfile takes studentId, name, and department
            behavioralAnalysis
        ] = await Promise.all([
            getStudentAttendance(studentProfile.studentId || studentProfile.id), // Use studentId if available, else id
            getFeeDetails(studentProfile.studentId || studentProfile.id),
            getStudentClearanceStatus(studentProfile.studentId || studentProfile.id),
            getStudentBehaviorProfile(studentProfile.studentId || studentProfile.id, studentProfile.name, studentProfile.department)
        ]);

        const attendanceSummary = attendanceRecords.length > 0 ? calculateAttendanceSummary(attendanceRecords) : null;
        const recentAttendanceRecords = attendanceRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10); // Last 10 records
        
        const clearanceProgressPercentage = clearanceRequest ? calculateClearanceProgress(clearanceRequest.steps) : 0;


        return {
            studentProfile,
            attendanceSummary,
            recentAttendanceRecords,
            feeDetails,
            clearanceRequest,
            clearanceProgressPercentage,
            behavioralAnalysis,
            generatedDate: format(new Date(), 'PPP p'),
            reportTitle: `Comprehensive Report for ${studentProfile.name} (${studentProfile.studentId || studentProfile.id})`,
        };

    } catch (error) {
        console.error(`Error generating report for student ${studentId}:`, error);
        return null;
    }
}

    