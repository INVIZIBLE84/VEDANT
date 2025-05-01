
import { format } from 'date-fns';
import type { AttendanceRecord } from './attendance';
import type { FeeDetails } from './fee-management';
import type { ClearanceRequest } from './clearance';

// --- Interfaces ---

export interface AnalyticsFilters {
    startDate?: string; // ISO Date string
    endDate?: string; // ISO Date string
    department?: string;
    semester?: string;
}

export interface AttendanceAnalytics {
    overallPercentage: number;
    atRiskCount: number; // Based on ML classification
    criticalCount: number; // Based on ML classification
    trendData: { date: string; present: number; absent: number }[]; // For line/bar chart
}

export interface FeeAnalytics {
    totalCollected: number;
    totalDueCurrent: number; // Balance due across all students matching filters
    overdueCount: number;
    collectionTrend: { period: string; collected: number; due: number }[]; // e.g., monthly
}

export interface ClearanceAnalytics {
    averageCompletionDays: number;
    bottleneckDepartment: string | null; // Department with longest avg pending time
    completionRate: number; // Percentage of submitted requests now approved
    statusCounts: Record<ClearanceRequest['overallStatus'], number>;
}

export type StudentBehaviorClassification = 'Regular' | 'At Risk' | 'Critical';

export interface StudentBehaviorAnalytics {
    studentId: string;
    studentName: string;
    department?: string;
    classification: StudentBehaviorClassification;
    dropoutPrediction?: number; // Probability 0-1
    engagementScore?: number; // Score 0-100
    suggestions?: string[];
}

export type ReportType = 'attendance' | 'fees' | 'clearance' | 'behavior';

// --- Mock Data Simulation ---

// Helper to generate random dates within a range
const randomDate = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generateMockAttendanceTrend = (startDate: Date, endDate: Date): { date: string; present: number; absent: number }[] => {
    const trend = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const total = 50 + Math.floor(Math.random() * 50); // 50-100 students
        const present = Math.floor(total * (0.7 + Math.random() * 0.25)); // 70-95% present
        trend.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            present: present,
            absent: total - present,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return trend;
};

const generateMockFeeTrend = (numPeriods: number): { period: string; collected: number; due: number }[] => {
    const trend = [];
    const now = new Date();
    for (let i = numPeriods - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = format(date, 'MMM yyyy');
        const due = 40000 + Math.random() * 20000;
        const collected = due * (0.6 + Math.random() * 0.35);
        trend.push({
            period,
            collected: Math.round(collected),
            due: Math.round(due),
        });
    }
    return trend;
};

// --- Service Functions ---

export async function getAttendanceAnalytics(filters?: AnalyticsFilters): Promise<AttendanceAnalytics> {
    console.log("Fetching attendance analytics with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate()); // Default 1 month back

    const trendData = generateMockAttendanceTrend(startDate, endDate);
    const totalPresent = trendData.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = trendData.reduce((sum, d) => sum + d.absent, 0);
    const total = totalPresent + totalAbsent;

    return {
        overallPercentage: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
        atRiskCount: 15 + Math.floor(Math.random() * 10), // Mock ML result
        criticalCount: 5 + Math.floor(Math.random() * 5), // Mock ML result
        trendData: trendData,
    };
}

export async function getFeeAnalytics(filters?: AnalyticsFilters): Promise<FeeAnalytics> {
    console.log("Fetching fee analytics with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 250));

    return {
        totalCollected: 55000 + Math.random() * 10000,
        totalDueCurrent: 12000 + Math.random() * 5000,
        overdueCount: 8 + Math.floor(Math.random() * 5),
        collectionTrend: generateMockFeeTrend(6), // Last 6 months
    };
}

export async function getClearanceAnalytics(filters?: AnalyticsFilters): Promise<ClearanceAnalytics> {
    console.log("Fetching clearance analytics with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate calculation
    const statuses: Record<ClearanceRequest['overallStatus'], number> = {
        Pending: 5 + Math.floor(Math.random() * 5),
        'In Progress': 10 + Math.floor(Math.random() * 10),
        Approved: 70 + Math.floor(Math.random() * 10),
        Rejected: 2 + Math.floor(Math.random() * 3),
    };
    const totalSubmitted = Object.values(statuses).reduce((a, b) => a + b, 0);

    return {
        averageCompletionDays: 4 + Math.random() * 3,
        bottleneckDepartment: ['Library', 'Finance', 'HoD'][Math.floor(Math.random() * 3)],
        completionRate: totalSubmitted > 0 ? Math.round((statuses.Approved / totalSubmitted) * 100) : 0,
        statusCounts: statuses,
    };
}

export async function getStudentBehaviorAnalytics(filters?: AnalyticsFilters): Promise<StudentBehaviorAnalytics[]> {
    console.log("Fetching student behavior analytics with filters:", filters);
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate ML prediction time

    const classifications: StudentBehaviorClassification[] = ['Regular', 'At Risk', 'Critical'];
    const departments = ['Computer Science', 'Physics', 'Mathematics'];
    const mockStudents: StudentBehaviorAnalytics[] = Array.from({ length: 15 }).map((_, i) => ({
        studentId: `S${1000 + i}`,
        studentName: `Student ${String.fromCharCode(65 + i)}`,
        department: departments[i % departments.length],
        classification: classifications[Math.floor(Math.random() * 3)],
        dropoutPrediction: Math.random() * 0.4, // Lower probability for demo
        engagementScore: 50 + Math.random() * 50,
        suggestions: Math.random() > 0.7 ? ['Recommend counseling session'] : undefined,
    }));

    // Apply filters server-side simulation
    let results = mockStudents;
     if (filters?.department) {
        results = results.filter(s => s.department === filters.department);
     }
     // Add search query filter if needed

    return results.sort((a, b) => (b.dropoutPrediction ?? 0) - (a.dropoutPrediction ?? 0)); // Sort by risk
}


export async function exportAnalyticsReport(type: ReportType, filters?: AnalyticsFilters): Promise<string> {
    console.log(`Exporting ${type} report with filters:`, filters);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate report generation

    // In a real app, fetch data based on type and generate CSV/Excel content
    let csvContent = "";
    const headers: string[] = [];
    const rows: string[][] = [];

    if (type === 'attendance') {
        const data = await getAttendanceAnalytics(filters);
        headers.push("Date", "Present", "Absent");
        data.trendData.forEach(d => rows.push([d.date, d.present.toString(), d.absent.toString()]));
        csvContent = `Overall Percentage,${data.overallPercentage}\nAt Risk Count,${data.atRiskCount}\nCritical Count,${data.criticalCount}\n\n`;
    } else if (type === 'fees') {
        const data = await getFeeAnalytics(filters);
        headers.push("Period", "Collected", "Due");
        data.collectionTrend.forEach(d => rows.push([d.period, d.collected.toString(), d.due.toString()]));
        csvContent = `Total Collected,${data.totalCollected}\nCurrent Balance Due,${data.totalDueCurrent}\nOverdue Count,${data.overdueCount}\n\n`;
    } else if (type === 'clearance') {
        const data = await getClearanceAnalytics(filters);
        headers.push("Status", "Count");
        Object.entries(data.statusCounts).forEach(([status, count]) => rows.push([status, count.toString()]));
        csvContent = `Average Completion (Days),${data.averageCompletionDays.toFixed(1)}\nBottleneck Dept,${data.bottleneckDepartment || 'N/A'}\nCompletion Rate,${data.completionRate}%\n\n`;
    } else if (type === 'behavior') {
        const data = await getStudentBehaviorAnalytics(filters);
        headers.push("Student ID", "Name", "Department", "Classification", "Dropout Risk (%)", "Engagement (%)", "Suggestions");
        data.forEach(s => rows.push([
            s.studentId,
            s.studentName,
            s.department || 'N/A',
            s.classification,
            s.dropoutPrediction ? (s.dropoutPrediction * 100).toFixed(1) : 'N/A',
            s.engagementScore ? s.engagementScore.toFixed(0) : 'N/A',
            s.suggestions?.join('; ') || '',
        ]));
    } else {
        return "Error: Invalid report type.";
    }

    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    csvContent += rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    return csvContent;
}
