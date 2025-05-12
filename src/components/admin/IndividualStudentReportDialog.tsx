
"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer, User, CalendarDays, DollarSign, FileCheck, BrainCircuit, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import type { IndividualStudentReportData } from "@/services/reports";
import type { ClearanceStep, ClearanceRequest } from "@/services/clearance";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IndividualStudentReportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    reportData: IndividualStudentReportData | null;
    isLoading: boolean;
}

const getStatusStyle = (status?: string): { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode, className: string } => {
    switch (status) {
        case 'Paid':
        case 'Approved':
        case 'Present':
            return { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" />, className: "bg-green-100 text-green-800 border-green-300" };
        case 'Unpaid':
        case 'Rejected':
        case 'Absent':
            return { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-800 border-red-300" };
        case 'Partially Paid':
        case 'Pending':
        case 'In Progress':
        case 'Not Marked':
            return { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" />, className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
        case 'Regular':
            return { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" />, className: "bg-blue-100 text-blue-800 border-blue-300" };
        case 'At Risk':
            return { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3 mr-1" />, className: "bg-orange-100 text-orange-800 border-orange-300" };
        case 'Critical':
            return { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3 mr-1" />, className: "bg-red-100 text-red-800 border-red-300" };
        default: return { variant: 'outline', icon: null, className: "" };
    }
};


export default function IndividualStudentReportDialog({ isOpen, onOpenChange, reportData, isLoading }: IndividualStudentReportDialogProps) {
    
    const handlePrint = () => {
        // Basic print functionality
        // For better PDF generation, a library like jsPDF or a server-side PDF generation would be needed.
        const printContents = document.getElementById("student-report-content")?.innerHTML;
        const originalContents = document.body.innerHTML;
        if (printContents) {
            document.body.innerHTML = `<div class="p-4">${printContents}</div>`;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore original event listeners, scripts etc.
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{reportData?.reportTitle || "Student Report"}</DialogTitle>
                    <DialogDescription>
                        Generated on: {reportData?.generatedDate || "Loading..."}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="ml-2 text-muted-foreground">Generating report...</p>
                    </div>
                )}

                {!isLoading && !reportData && (
                     <div className="flex items-center justify-center py-20">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <p className="ml-2 text-muted-foreground">Could not load report data.</p>
                    </div>
                )}

                {!isLoading && reportData && (
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div id="student-report-content" className="space-y-6 pr-4">
                            {/* Student Profile Section */}
                            <section>
                                <h2 className="text-xl font-semibold mb-2 pb-1 border-b flex items-center gap-2"><User /> Student Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p><strong>Name:</strong> {reportData.studentProfile?.name}</p>
                                    <p><strong>ID:</strong> {reportData.studentProfile?.studentId || reportData.studentProfile?.id}</p>
                                    <p><strong>Email:</strong> {reportData.studentProfile?.email}</p>
                                    <p><strong>Department:</strong> {reportData.studentProfile?.department || "N/A"}</p>
                                    <p><strong>Role:</strong> <span className="capitalize">{reportData.studentProfile?.role}</span></p>
                                </div>
                            </section>

                            {/* Attendance Section */}
                            <section>
                                <h2 className="text-xl font-semibold mb-2 pb-1 border-b flex items-center gap-2"><CalendarDays /> Attendance Summary</h2>
                                {reportData.attendanceSummary ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        <p><strong>Overall:</strong> {reportData.attendanceSummary.attendancePercentage}%</p>
                                        <p><strong>Present:</strong> {reportData.attendanceSummary.presentDays} days</p>
                                        <p><strong>Absent:</strong> {reportData.attendanceSummary.absentDays} days</p>
                                        <p><strong>Total:</strong> {reportData.attendanceSummary.totalDays} days</p>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No attendance summary available.</p>}
                                {reportData.recentAttendanceRecords.length > 0 && (
                                    <>
                                        <h3 className="text-md font-medium mt-3 mb-1">Recent Records (last 10):</h3>
                                        <Table className="text-xs">
                                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {reportData.recentAttendanceRecords.map(r => (
                                                    <TableRow key={r.id}>
                                                        <TableCell>{format(new Date(r.date), 'PP')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusStyle(r.isPresent ? 'Present' : 'Absent').variant} className={getStatusStyle(r.isPresent ? 'Present' : 'Absent').className}>
                                                               {r.isPresent ? 'Present' : 'Absent'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{r.timestamp ? format(new Date(r.timestamp), 'p') : '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </section>

                            {/* Fee Details Section */}
                            <section>
                                <h2 className="text-xl font-semibold mb-2 pb-1 border-b flex items-center gap-2"><DollarSign /> Fee Details</h2>
                                {reportData.feeDetails ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        <p><strong>Status:</strong> <Badge variant={getStatusStyle(reportData.feeDetails.status).variant} className={getStatusStyle(reportData.feeDetails.status).className}>{reportData.feeDetails.status}</Badge></p>
                                        <p><strong>Balance Due:</strong> ${reportData.feeDetails.balanceDue.toFixed(2)}</p>
                                        <p><strong>Total Due:</strong> ${reportData.feeDetails.totalDue.toFixed(2)}</p>
                                        <p><strong>Total Paid:</strong> ${reportData.feeDetails.totalPaid.toFixed(2)}</p>
                                        {reportData.feeDetails.dueDate && <p><strong>Due Date:</strong> {format(new Date(reportData.feeDetails.dueDate), 'PP')}</p>}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No fee details available.</p>}
                            </section>

                            {/* Clearance Section */}
                            <section>
                                <h2 className="text-xl font-semibold mb-2 pb-1 border-b flex items-center gap-2"><FileCheck /> Clearance Status</h2>
                                {reportData.clearanceRequest ? (
                                    <>
                                        <div className="flex items-center gap-4 mb-2">
                                            <p className="text-sm"><strong>Overall:</strong> <Badge variant={getStatusStyle(reportData.clearanceRequest.overallStatus).variant} className={getStatusStyle(reportData.clearanceRequest.overallStatus).className}>{reportData.clearanceRequest.overallStatus}</Badge></p>
                                            <div className="flex-1"><Progress value={reportData.clearanceProgressPercentage} className="h-2.5" /></div>
                                            <p className="text-sm font-medium">{reportData.clearanceProgressPercentage}%</p>
                                        </div>
                                        <Table className="text-xs">
                                            <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Approver</TableHead><TableHead>Date</TableHead><TableHead>Comments</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {reportData.clearanceRequest.steps.map(step => (
                                                    <TableRow key={step.stepId}>
                                                        <TableCell>{step.department}</TableCell>
                                                        <TableCell><Badge variant={getStatusStyle(step.status).variant} className={getStatusStyle(step.status).className}>{step.status}</Badge></TableCell>
                                                        <TableCell>{step.approverName || '-'}</TableCell>
                                                        <TableCell>{step.approvalDate ? format(new Date(step.approvalDate), 'PP') : '-'}</TableCell>
                                                        <TableCell className="truncate max-w-[150px]">{step.comments || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                ) : <p className="text-sm text-muted-foreground">No clearance request submitted or found.</p>}
                            </section>

                            {/* Behavioral Analysis Section */}
                            <section>
                                <h2 className="text-xl font-semibold mb-2 pb-1 border-b flex items-center gap-2"><BrainCircuit /> Behavioral Analysis (Simulated ML)</h2>
                                {reportData.behavioralAnalysis ? (
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Classification:</strong> <Badge variant={getStatusStyle(reportData.behavioralAnalysis.classification).variant} className={getStatusStyle(reportData.behavioralAnalysis.classification).className}>{reportData.behavioralAnalysis.classification}</Badge></p>
                                        <p><strong>Engagement Score:</strong> {reportData.behavioralAnalysis.engagementScore?.toFixed(0) ?? 'N/A'} / 100</p>
                                        <p><strong>Predicted Dropout Risk:</strong> {reportData.behavioralAnalysis.dropoutPrediction ? (reportData.behavioralAnalysis.dropoutPrediction * 100).toFixed(1) + '%' : 'N/A'}</p>
                                        {reportData.behavioralAnalysis.suggestions && reportData.behavioralAnalysis.suggestions.length > 0 && (
                                            <div>
                                                <strong>Suggestions:</strong>
                                                <ul className="list-disc list-inside ml-4 text-muted-foreground">
                                                    {reportData.behavioralAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">Behavioral analysis not available.</p>}
                            </section>
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handlePrint} disabled={isLoading || !reportData}>
                        <Printer className="mr-2 h-4 w-4" /> Print Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


    