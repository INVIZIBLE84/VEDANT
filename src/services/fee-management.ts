
import { format } from 'date-fns';

/**
 * Represents a single item within the fee breakdown.
 */
export interface FeeBreakdownItem {
  description: string; // e.g., "Tuition Fee", "Exam Fee", "Late Fine"
  amount: number;
}

/**
 * Represents the overall fee details for a student.
 */
export interface FeeDetails {
  studentId: string;
  studentName?: string; // Added for easier display in admin exports
  totalDue: number;
  totalPaid: number;
  balanceDue: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  dueDate?: string; // Optional: ISO Date string
  breakdown: FeeBreakdownItem[];
}

/**
 * Represents a fee payment record.
 */
export interface FeePayment {
  id: string; // Unique ID for the payment
  paymentDate: string; // ISO Date string
  amount: number;
  method?: string; // e.g., "Online", "Bank Transfer", "Manual Entry"
  transactionId?: string; // Optional transaction reference
  recordedBy?: string; // User ID of admin who recorded manual payment
}

/**
 * Represents filters for querying fee data (mainly for admin).
 */
export interface FeeFilters {
    status?: 'Paid' | 'Unpaid' | 'Partially Paid';
    department?: string;
    searchQuery?: string; // For student name or ID
}

/**
 * Asynchronously retrieves detailed fee status for a given student.
 *
 * @param studentId The ID of the student.
 * @returns A promise that resolves to the FeeDetails object or null if not found.
 */
export async function getFeeDetails(studentId: string): Promise<FeeDetails | null> {
  console.log(`Fetching fee details for student: ${studentId}`);
  // TODO: Implement this by calling an API.
  await new Promise(resolve => setTimeout(resolve, 75)); // Simulate network delay

  const studentData = sampleFeeDetailsData.find(fd => fd.studentId === studentId);
  if (!studentData) return null;

  // Recalculate totals based on current payments
  const payments = sampleFeePaymentsData[studentId] || [];
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalDue = studentData.breakdown.reduce((sum, item) => sum + item.amount, 0);
  const balanceDue = totalDue - totalPaid;
  let status: FeeDetails['status'] = 'Unpaid';
  if (balanceDue <= 0 && totalDue > 0) {
      status = 'Paid';
  } else if (totalPaid > 0 && balanceDue > 0) {
      status = 'Partially Paid';
  }


  return {
    ...studentData,
    totalDue,
    totalPaid,
    balanceDue,
    status,
  };
}

/**
 * Asynchronously retrieves fee payment history for a given student.
 *
 * @param studentId The ID of the student.
 * @returns A promise that resolves to an array of FeePayment objects.
 */
export async function getFeePayments(studentId: string): Promise<FeePayment[]> {
   console.log(`Fetching fee payments for student: ${studentId}`);
  // TODO: Implement this by calling an API.
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return sampleFeePaymentsData[studentId] || [];
}


// --- Admin Functions ---

/**
 * Asynchronously retrieves a list of fee details for all students, with filtering.
 * (Admin view)
 * @param filters Optional filters for status, department, search query.
 * @returns A promise that resolves to an array of FeeDetails objects.
 */
export async function getAllFeeDetails(filters?: FeeFilters): Promise<FeeDetails[]> {
    console.log("Fetching all fee details for admin with filters:", filters);
    // TODO: Implement API call with filtering
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulate fetching all and then applying filters client-side (inefficient, do on backend)
    let results = await Promise.all(sampleFeeDetailsData.map(fd => getFeeDetails(fd.studentId)));
    results = results.filter(fd => fd !== null) as FeeDetails[];

    if (filters?.status) {
        results = results.filter(fd => fd.status === filters.status);
    }
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        // Assuming student details are available or fetched separately
        results = results.filter(fd =>
            fd.studentId.toLowerCase().includes(query) || 
            (fd.studentName && fd.studentName.toLowerCase().includes(query))
        );
    }
    // Add department filter if student data includes department

    return results;
}

/**
 * Asynchronously updates the fee status manually (e.g., overrides).
 * Only for demonstration, actual status should derive from payments.
 * In a real scenario, this might adjust 'totalDue' or add specific items.
 * @param studentId The ID of the student.
 * @param newStatus The new status.
 * @param adminId The ID of the admin performing the action.
 * @returns Promise indicating success.
 */
export async function updateFeeStatus(studentId: string, newStatus: FeeDetails['status'], adminId: string): Promise<{ success: boolean, message: string }> {
    console.log(`Admin ${adminId} attempting to manually set fee status for ${studentId} to ${newStatus}`);
    // NOTE: This is generally bad practice. Status should be derived.
    // This function might be used to add a "waiver" or adjust totalDue instead.
    await new Promise(resolve => setTimeout(resolve, 100));
    const studentFeeDetails = sampleFeeDetailsData.find(fd => fd.studentId === studentId);
     if (!studentFeeDetails) return { success: false, message: "Student not found." };

     // Simulate update (again, not recommended for status directly)
     console.warn("Manually updating fee status is generally derived from payments. Simulating for demo.");
     // studentFeeDetails.status = newStatus; // Don't directly modify mock data's status like this

    return { success: true, message: `Fee status update simulated for ${studentId}. Status is derived.` };
}

/**
 * Asynchronously adds a new fee payment record for a student.
 * (Admin manual entry)
 * @param studentId The ID of the student.
 * @param payment The new payment details.
 * @param adminId The ID of the admin recording the payment.
 * @returns Promise indicating success and the newly added payment record.
 */
export async function addFeePayment(studentId: string, payment: Omit<FeePayment, 'id' | 'recordedBy'>, adminId: string): Promise<{ success: boolean, message: string, payment?: FeePayment }> {
    console.log(`Admin ${adminId} adding payment for ${studentId}:`, payment);
     // TODO: Implement API call to add payment
    await new Promise(resolve => setTimeout(resolve, 120));

    const newPayment: FeePayment = {
        ...payment,
        id: `pay-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
        recordedBy: adminId,
        paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0] // Default to today if not provided
    };

    if (!sampleFeePaymentsData[studentId]) {
        sampleFeePaymentsData[studentId] = [];
    }
    sampleFeePaymentsData[studentId].push(newPayment);

    return { success: true, message: "Payment added successfully.", payment: newPayment };
}

/**
 * Simulates importing fee data from a file (CSV/XLSX).
 * In a real app, this would involve file parsing and robust error handling.
 * @param file The file object to import.
 * @param adminId The ID of the admin performing the import.
 * @returns Promise indicating success, with counts of imported/skipped records.
 */
export async function importFeeDataFromFile(file: File, adminId: string): Promise<{ success: boolean; message: string; importedCount?: number; skippedCount?: number }> {
    console.log(`Admin ${adminId} importing fee data from file: ${file.name}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate file processing

    // Mock file parsing and data processing
    // For demonstration, let's assume the file contains a few records
    // and we'll update/add them to our mock data.
    // A real implementation would use a library like papaparse for CSV or xlsx for Excel files.

    let importedCount = 0;
    let skippedCount = 0;

    // Example: Simulate parsing 3 records from the file
    const mockFileRecords = [
        { studentId: 'student123', studentName: 'Alice Smith Import', tuition: 1800, library: 100, exam: 100, paid: 2000, paymentDate: '2024-08-01', paymentMethod: 'File Import' },
        { studentId: 'student456', studentName: 'Bob Johnson Import', tuition: 1800, lab: 250, sports: 100, paid: 1500, paymentDate: '2024-08-02', paymentMethod: 'File Import' },
        { studentId: 'newStudent001', studentName: 'New Student Import', tuition: 1900, library: 50, exam: 50, paid: 0, paymentDate: '', paymentMethod: '' }, // New student, no payment yet
        { studentId: 'errorStudent', tuition: 'invalid', paid: 500 }, // Example of a record that might be skipped
    ];

    for (const record of mockFileRecords) {
        if (!record.studentId || typeof record.tuition !== 'number') {
            skippedCount++;
            continue;
        }

        let studentFeeDetail = sampleFeeDetailsData.find(fd => fd.studentId === record.studentId);
        const breakdown: FeeBreakdownItem[] = [];
        if (record.tuition) breakdown.push({ description: 'Tuition Fee', amount: record.tuition });
        if (record.library) breakdown.push({ description: 'Library Fee', amount: record.library });
        if (record.exam) breakdown.push({ description: 'Exam Fee', amount: record.exam });
        if (record.lab) breakdown.push({ description: 'Lab Fee', amount: record.lab });
        if (record.sports) breakdown.push({ description: 'Sports Fee', amount: record.sports });
        
        const totalDueFromFile = breakdown.reduce((sum, item) => sum + item.amount, 0);

        if (studentFeeDetail) {
            // Update existing student's fee details
            studentFeeDetail.breakdown = breakdown; // Overwrite breakdown for simplicity
            studentFeeDetail.studentName = record.studentName || studentFeeDetail.studentName;
            studentFeeDetail.dueDate = studentFeeDetail.dueDate || new Date(new Date().getFullYear(), 7, 15).toISOString().split('T')[0]; // Default due date if not set
        } else {
            // Add new student's fee details
            studentFeeDetail = {
                studentId: record.studentId,
                studentName: record.studentName || `Student ${record.studentId}`,
                totalDue: 0, // Will be recalculated
                dueDate: new Date(new Date().getFullYear(), 7, 15).toISOString().split('T')[0], // Default due date
                breakdown: breakdown,
            };
            sampleFeeDetailsData.push(studentFeeDetail);
        }

        // Add payment if provided
        if (record.paid > 0 && record.paymentDate && record.paymentMethod) {
            if (!sampleFeePaymentsData[record.studentId]) {
                sampleFeePaymentsData[record.studentId] = [];
            }
            sampleFeePaymentsData[record.studentId].push({
                id: `pay-import-${Date.now()}-${importedCount}`,
                paymentDate: record.paymentDate,
                amount: record.paid,
                method: record.paymentMethod,
                recordedBy: adminId,
            });
        }
        importedCount++;
    }

    // Log this admin action - In a real app, use a centralized audit logger
    // logAdminAudit(adminId, 'Admin User', 'Fee Data Imported', `Imported ${importedCount} records, skipped ${skippedCount} from file ${file.name}`);


    if (importedCount > 0) {
        return { success: true, message: `Successfully imported ${importedCount} fee records. ${skippedCount} records were skipped due to errors.`, importedCount, skippedCount };
    } else if (skippedCount > 0) {
        return { success: false, message: `Import failed. All ${skippedCount} records had errors. Please check the file format.`, importedCount, skippedCount };
    } else {
        return { success: false, message: "No valid records found in the file to import.", importedCount, skippedCount };
    }
}

/**
 * Simulates exporting fee data to CSV.
 * @param filters Optional filters for status, department, search query.
 * @returns A promise resolving to a CSV string.
 */
export async function exportFeeDataToCSV(filters?: FeeFilters): Promise<string> {
    console.log("Exporting fee data to CSV with filters:", filters);
    const feeDetailsList = await getAllFeeDetails(filters); // Reuse fetching logic
    await new Promise(res => setTimeout(res, 100)); // Simulate CSV generation

    if (!feeDetailsList || feeDetailsList.length === 0) {
        return "Student ID,Student Name,Total Due,Total Paid,Balance Due,Status,Due Date,Breakdown,Payment ID,Payment Date,Payment Amount,Payment Method,Transaction ID,Recorded By\n";
    }

    const headers = [
        "Student ID", "Student Name", "Total Due", "Total Paid", "Balance Due", "Status", "Due Date",
        "Breakdown Description", "Breakdown Amount",
        "Payment ID", "Payment Date", "Payment Amount", "Payment Method", "Transaction ID", "Recorded By"
    ];
    
    const csvRows: string[] = [headers.map(h => `"${h}"`).join(',')];

    for (const fd of feeDetailsList) {
        const studentPayments = sampleFeePaymentsData[fd.studentId] || [];
        const mainRow = [
            fd.studentId,
            fd.studentName || '',
            fd.totalDue.toFixed(2),
            fd.totalPaid.toFixed(2),
            fd.balanceDue.toFixed(2),
            fd.status,
            fd.dueDate ? format(new Date(fd.dueDate), 'yyyy-MM-dd') : '',
        ];

        if (fd.breakdown.length > 0 || studentPayments.length > 0) {
            const maxSubRows = Math.max(fd.breakdown.length, studentPayments.length, 1); // Ensure at least one row for student info
            for (let i = 0; i < maxSubRows; i++) {
                const breakdownItem = fd.breakdown[i];
                const paymentItem = studentPayments[i];
                
                const subRow = [
                    i === 0 ? mainRow[0] : '', // Student ID only on first sub-row
                    i === 0 ? mainRow[1] : '', // Student Name only on first sub-row
                    i === 0 ? mainRow[2] : '', // Total Due only on first sub-row
                    i === 0 ? mainRow[3] : '', // Total Paid only on first sub-row
                    i === 0 ? mainRow[4] : '', // Balance Due only on first sub-row
                    i === 0 ? mainRow[5] : '', // Status only on first sub-row
                    i === 0 ? mainRow[6] : '', // Due Date only on first sub-row
                    breakdownItem ? breakdownItem.description : '',
                    breakdownItem ? breakdownItem.amount.toFixed(2) : '',
                    paymentItem ? paymentItem.id : '',
                    paymentItem ? format(new Date(paymentItem.paymentDate), 'yyyy-MM-dd') : '',
                    paymentItem ? paymentItem.amount.toFixed(2) : '',
                    paymentItem ? paymentItem.method || '' : '',
                    paymentItem ? paymentItem.transactionId || '' : '',
                    paymentItem ? paymentItem.recordedBy || '' : '',
                ];
                csvRows.push(subRow.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));
            }
        } else {
             // Student has no breakdown or payments, just list main details
             const emptySubRow = Array(headers.length - mainRow.length).fill('');
             csvRows.push([...mainRow, ...emptySubRow].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));
        }
    }
    
    return csvRows.join('\n');
}


// --- Sample Data (In-memory placeholder) ---

let sampleFeeDetailsData: Omit<FeeDetails, 'totalPaid' | 'balanceDue' | 'status'>[] = [
  {
    studentId: 'student123', // Alice Smith
    studentName: 'Alice Smith',
    totalDue: 2000, // This will be calculated from breakdown
    dueDate: '2024-08-15',
    breakdown: [
      { description: 'Tuition Fee - Sem 1', amount: 1800 },
      { description: 'Library Fee', amount: 100 },
      { description: 'Exam Fee', amount: 100 },
    ],
  },
  {
    studentId: 'student456', // Bob Johnson
    studentName: 'Bob Johnson',
    totalDue: 2150, // Calculated
    dueDate: '2024-08-15',
    breakdown: [
      { description: 'Tuition Fee - Sem 3', amount: 1800 },
      { description: 'Lab Fee', amount: 250 },
      { description: 'Sports Fee', amount: 100 },
      { description: 'Late Fine - Library', amount: 50 }, // Example fine
    ],
  },
   {
    studentId: 'student789', // Charlie Brown
    studentName: 'Charlie Brown',
    totalDue: 1900, // Calculated
    dueDate: '2024-08-15',
    breakdown: [
      { description: 'Tuition Fee - Sem 5', amount: 1800 },
      { description: 'Association Fee', amount: 100 },
    ],
  },
];

let sampleFeePaymentsData: { [studentId: string]: FeePayment[] } = {
  'student123': [
    { id: 'pay1', paymentDate: '2024-07-10', amount: 1000, method: 'Online', transactionId: 'txn_abc123' },
    { id: 'pay2', paymentDate: '2024-07-25', amount: 1000, method: 'Bank Transfer', transactionId: 'txn_def456' }, // Paid in full
  ],
  'student456': [
    { id: 'pay3', paymentDate: '2024-07-15', amount: 1000, method: 'Manual Entry', recordedBy: 'admin001' }, // Partially paid
  ],
  // student789 has no payments yet
};

```
  </change>
  <change>
    <file>src/app/(requiresAuth)/fees/page.tsx</file>
    <description>Add "Export CSV" button and functionality to the admin view for exporting fee data.</description>
    <content><![CDATA[
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, AlertTriangle, Download, PlusCircle, Edit, Loader2, Search, Filter, Upload } from "lucide-react"; // Added Upload and Download
import {
    getFeeDetails,
    getFeePayments,
    getAllFeeDetails, // For admin
    addFeePayment, // For admin
    importFeeDataFromFile, // New import function
    exportFeeDataToCSV, // New export function
    type FeeDetails,
    type FeePayment,
    type FeeBreakdownItem,
    type FeeFilters
} from "@/services/fee-management";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // For Add Payment Modal
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';


export default function FeesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin specific state
  const [allFeeDetails, setAllFeeDetails] = useState<FeeDetails[]>([]);
  const [isAdminView, setIsAdminView] = useState(false);
  const [filters, setFilters] = useState<FeeFilters>({});
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<string | null>(null);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = React.useState(false); // Control dialog
  const [isImportingFees, setIsImportingFees] = React.useState(false);
  const [isExportingFees, setIsExportingFees] = React.useState(false);


  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (!currentUser) {
        // Handled by layout, set state for consistency
        setError("User not authenticated.");
        setIsLoading(false);
        return;
      }

      setIsAdminView(currentUser.role === 'admin');

      try {
        if (currentUser.role === 'student') {
          const details = await getFeeDetails(currentUser.id);
          const history = await getFeePayments(currentUser.id);
          setFeeDetails(details);
          setPaymentHistory(history);
        } else if (currentUser.role === 'admin') {
          // Fetch initial list for admin
          const allDetails = await getAllFeeDetails(filters);
          setAllFeeDetails(allDetails);
           // Also fetch details for the admin user themselves if needed? Optional.
            // const adminOwnDetails = await getFeeDetails(currentUser.id);
            // setFeeDetails(adminOwnDetails);
        } else {
            // Faculty view - might show summary or nothing, depending on requirements
             // Students and Admins are primary users here
            // setError("Faculty view for fees is not currently implemented.");
        }
      } catch (err) {
        console.error("Error fetching fee data:", err);
        setError("Failed to load fee information. Please try again.");
        toast({ variant: "destructive", title: "Error", description: "Could not fetch fee data." });
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

   // --- Admin: Handle Filter Changes ---
  const handleFilterChange = (key: keyof FeeFilters, value: string | undefined) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- Admin: Fetch data based on filters ---
   useEffect(() => {
        if (isAdminView) {
            const fetchAdminData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const allDetails = await getAllFeeDetails(filters);
                    setAllFeeDetails(allDetails);
                } catch (err) {
                    console.error("Error fetching filtered admin fee data:", err);
                    setError("Failed to load filtered fee information.");
                    toast({ variant: "destructive", title: "Error", description: "Could not fetch filtered fee data." });
                } finally {
                    setIsLoading(false);
                }
            };
            // Debounce or add a button to trigger fetch? For now, fetch on filter change.
            const timer = setTimeout(() => fetchAdminData(), 300); // Simple debounce
             return () => clearTimeout(timer);
        }
    }, [filters, isAdminView, toast]); // Re-fetch when filters change


   // --- Admin: Handle Add Payment ---
   const handleAddPaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedStudentForPayment || !user || user.role !== 'admin') return;

        const formData = new FormData(event.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        const paymentDate = formData.get('paymentDate') as string;
        const method = formData.get('method') as string;
        const transactionId = formData.get('transactionId') as string || undefined;

        if (isNaN(amount) || amount <= 0) {
             toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive amount." });
             return;
        }
        if (!paymentDate) {
            toast({ variant: "destructive", title: "Invalid Date", description: "Please select a payment date." });
            return;
        }

        setIsAddingPayment(true);
        try {
            const result = await addFeePayment(selectedStudentForPayment, { amount, paymentDate, method, transactionId }, user.id);
            if (result.success && result.payment) {
                toast({ title: "Success", description: result.message });
                // Update the specific student's details in the admin list (or re-fetch all)
                 setAllFeeDetails(prev => prev.map(fd => {
                    if (fd.studentId === selectedStudentForPayment) {
                        const newTotalPaid = fd.totalPaid + result.payment!.amount;
                        const newBalanceDue = fd.totalDue - newTotalPaid;
                        let newStatus: FeeDetails['status'] = 'Unpaid';
                         if (newBalanceDue <= 0) newStatus = 'Paid';
                         else if (newTotalPaid > 0) newStatus = 'Partially Paid';
                        return { ...fd, totalPaid: newTotalPaid, balanceDue: newBalanceDue, status: newStatus };
                    }
                    return fd;
                 }));
                 setShowAddPaymentDialog(false); // Close the dialog
                 setSelectedStudentForPayment(null); // Reset selected student
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        } catch (err) {
             console.error("Error adding payment:", err);
             toast({ variant: "destructive", title: "Error", description: "Could not add payment." });
        } finally {
            setIsAddingPayment(false);
        }
   };

   const handleFeeDataImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || user.role !== 'admin') return;
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingFees(true);
        try {
            const result = await importFeeDataFromFile(file, user.id);
            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: result.message,
                });
                // Refresh the list of all fee details
                const updatedDetails = await getAllFeeDetails(filters);
                setAllFeeDetails(updatedDetails);
            } else {
                toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: result.message,
                });
            }
        } catch (err: any) {
            console.error("Error importing fee data:", err);
            toast({
                variant: "destructive",
                title: "Import Error",
                description: err.message || "An unexpected error occurred during import.",
            });
        } finally {
            setIsImportingFees(false);
            event.target.value = ''; // Reset file input to allow re-upload of same file
        }
    };

    const handleExportFeeData = async () => {
        if (!user || user.role !== 'admin') return;
        setIsExportingFees(true);
        toast({ title: "Exporting...", description: "Generating fee data CSV." });
        try {
            const csvData = await exportFeeDataToCSV(filters);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `fee_data_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Success", description: "Fee data CSV exported." });
            } else {
                toast({ variant: "destructive", title: "Export Failed", description: "Browser does not support automatic downloads." });
            }
        } catch (err: any) {
            console.error("Error exporting fee data:", err);
            toast({ variant: "destructive", title: "Export Error", description: err.message || "Could not export fee data." });
        } finally {
            setIsExportingFees(false);
        }
    };


  // --- Loading / Error States ---
  if (isLoading && (!feeDetails && !isAdminView || isAdminView && !allFeeDetails.length)) {
    return <FeeSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Fee Management</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

   // --- Get Status Style Helper ---
    const getStatusStyle = (status: FeeDetails['status']): { variant: "default" | "secondary" | "destructive" | "outline", className: string } => {
        switch (status) {
            case 'Paid': return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' };
            case 'Unpaid': return { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' };
            case 'Partially Paid': return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
            default: return { variant: 'outline', className: '' };
        }
    };

    const statusIcon = (status: FeeDetails['status']) => {
        switch(status) {
            case 'Paid': return <CheckCircle className="h-4 w-4 mr-1 text-green-600" />;
            case 'Unpaid': return <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />;
            case 'Partially Paid': return <Clock className="h-4 w-4 mr-1 text-yellow-600" />;
            default: return null;
        }
    }

  // --- Render Student View ---
  const renderStudentView = () => {
    if (!feeDetails) {
       return <Alert><AlertDescription>No fee details found for your account.</AlertDescription></Alert>;
    }
    const statusStyle = getStatusStyle(feeDetails.status);

    return (
        <>
            {/* Fee Status Summary */}
            <Card className="transform transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center justify-between">
                   <span>Fee Status</span>
                   <Badge variant={statusStyle.variant} className={cn("text-sm", statusStyle.className)}>
                       {statusIcon(feeDetails.status)} {feeDetails.status}
                   </Badge>
                </CardTitle>
                <CardDescription>
                    Your current fee balance overview.
                    {feeDetails.dueDate && ` Due Date: ${format(new Date(feeDetails.dueDate), 'PPP')}`}
                </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <SummaryBox label="Total Due" value={feeDetails.totalDue} />
                     <SummaryBox label="Total Paid" value={feeDetails.totalPaid} color="green" />
                     <SummaryBox label="Balance Due" value={feeDetails.balanceDue} color={feeDetails.balanceDue > 0 ? 'red' : 'green'} />
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4">
                    <p className="text-xs text-muted-foreground">Contact finance for payment queries.</p>
                    {/* TODO: Link to actual payment gateway */}
                    <Button disabled={feeDetails.balanceDue <= 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <DollarSign className="mr-2 h-4 w-4" /> Pay Now
                    </Button>
                </CardFooter>
            </Card>

             {/* Fee Breakdown */}
             <Card className="transform transition-transform duration-300 hover:shadow-lg">
                 <CardHeader>
                     <CardTitle>Fee Breakdown</CardTitle>
                     <CardDescription>Detailed structure of your fees.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Table>
                         <TableHeader>
                             <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {feeDetails.breakdown.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                                </TableRow>
                             ))}
                              <TableRow className="border-t font-semibold">
                                <TableCell>Total Due</TableCell>
                                <TableCell className="text-right">${feeDetails.totalDue.toFixed(2)}</TableCell>
                              </TableRow>
                        </TableBody>
                    </Table>
                 </CardContent>
             </Card>

            {/* Payment History */}
            <Card className="transform transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>List of your past fee payments.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead className="hidden sm:table-cell">Method</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Transaction ID</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paymentHistory.length > 0 ? (
                        paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.paymentDate), 'PPP')}</TableCell>
                            <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{payment.method || 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-right">{payment.transactionId || 'N/A'}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No payment history found.
                        </TableCell>
                        </TableRow>
                    )}
                    {/* Footer for Total Paid */}
                    {paymentHistory.length > 0 && (
                        <TableRow className="border-t border-dashed">
                            <TableCell colSpan={3} className="font-semibold">Total Paid</TableCell>
                            <TableCell className="text-right font-bold">${feeDetails.totalPaid.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </>
    );
  };

  // --- Render Admin View ---
  const renderAdminView = () => (
     <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
            <CardTitle>Fee Management Dashboard</CardTitle>
            <CardDescription>View and manage student fee records.</CardDescription>
             {/* Filters & Actions */}
             <div className="flex flex-wrap items-center gap-2 pt-4">
                 <div className="relative flex-grow max-w-xs">
                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                         type="search"
                         placeholder="Search Student ID/Name..."
                         className="pl-8"
                         value={filters.searchQuery || ''}
                         onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                     />
                 </div>
                 <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value as FeeDetails['status'])}>
                     <SelectTrigger className="w-full sm:w-[180px]">
                         <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                         <SelectValue placeholder="Filter by Status" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="all">All Statuses</SelectItem>
                         <SelectItem value="Paid">Paid</SelectItem>
                         <SelectItem value="Unpaid">Unpaid</SelectItem>
                         <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                     </SelectContent>
                 </Select>
                 <Button variant="outline" onClick={() => setFilters({})}>Clear Filters</Button>
                 <Button variant="outline" asChild disabled={isImportingFees}>
                    <Label htmlFor="import-fee-data" className="cursor-pointer">
                        {isImportingFees ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import Fee Data
                        <input id="import-fee-data" type="file" className="sr-only" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFeeDataImport} />
                    </Label>
                 </Button>
                 <Button variant="outline" onClick={handleExportFeeData} disabled={isExportingFees}>
                    {isExportingFees ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export CSV
                 </Button>
             </div>
        </CardHeader>
        <CardContent>
           {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-10"/> :
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student ID</TableHead>
                         <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Total Paid</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Total Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allFeeDetails.length > 0 ? (
                        allFeeDetails.map((fd) => {
                           const statusStyle = getStatusStyle(fd.status);
                           return (
                             <TableRow key={fd.studentId}>
                                <TableCell className="font-medium">{fd.studentId}</TableCell>
                                <TableCell>{fd.studentName || 'N/A'}</TableCell>
                                <TableCell>
                                     <Badge variant={statusStyle.variant} className={cn("text-xs", statusStyle.className)}>
                                       {statusIcon(fd.status)} {fd.status}
                                     </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${fd.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${fd.balanceDue.toFixed(2)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-right text-muted-foreground">${fd.totalPaid.toFixed(2)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-right text-muted-foreground">${fd.totalDue.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    {/* Add Payment Dialog Trigger */}
                                    <Dialog open={showAddPaymentDialog && selectedStudentForPayment === fd.studentId} onOpenChange={(open) => { if (!open) setSelectedStudentForPayment(null); setShowAddPaymentDialog(open); }}>
                                         <DialogTrigger asChild>
                                             <Button variant="outline" size="sm" onClick={() => {setSelectedStudentForPayment(fd.studentId); setShowAddPaymentDialog(true);}}>
                                                 <PlusCircle className="h-4 w-4 mr-1" /> Add Payment
                                             </Button>
                                         </DialogTrigger>
                                         <DialogContent>
                                             <DialogHeader>
                                                 <DialogTitle>Add Payment for {fd.studentId} ({fd.studentName || 'N/A'})</DialogTitle>
                                                 <DialogDescription>Record a new fee payment received for this student.</DialogDescription>
                                             </DialogHeader>
                                             <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                                                <div>
                                                     <Label htmlFor="amount">Amount</Label>
                                                     <Input id="amount" name="amount" type="number" step="0.01" required />
                                                </div>
                                                <div>
                                                     <Label htmlFor="paymentDate">Payment Date</Label>
                                                     <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')}/>
                                                </div>
                                                 <div>
                                                    <Label htmlFor="method">Payment Method</Label>
                                                    <Select name="method" defaultValue="Manual Entry">
                                                         <SelectTrigger id="method">
                                                             <SelectValue placeholder="Select method" />
                                                         </SelectTrigger>
                                                         <SelectContent>
                                                            <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                             <SelectItem value="Online">Online</SelectItem>
                                                             <SelectItem value="Cash">Cash</SelectItem>
                                                             <SelectItem value="Other">Other</SelectItem>
                                                         </SelectContent>
                                                    </Select>
                                                </div>
                                                 <div>
                                                     <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                                                     <Input id="transactionId" name="transactionId" type="text" />
                                                 </div>
                                                 <DialogFooter>
                                                     <Button type="button" variant="ghost" onClick={() => { setShowAddPaymentDialog(false); setSelectedStudentForPayment(null); }}>Cancel</Button>
                                                     <Button type="submit" disabled={isAddingPayment}>
                                                         {isAddingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                         Add Payment
                                                     </Button>
                                                 </DialogFooter>
                                             </form>
                                         </DialogContent>
                                     </Dialog>

                                    {/* TODO: Add Edit/View Details buttons */}
                                     {/* <Button variant="ghost" size="icon" className="ml-1"><Edit className="h-4 w-4" /></Button> */}
                                </TableCell>
                             </TableRow>
                           );
                       })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No fee records found matching filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
           }
        </CardContent>
     </Card>
  );

  // --- Main Return ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <DollarSign className="h-7 w-7" /> Fee Tracker
        <span className="text-sm font-normal text-muted-foreground">({user?.role})</span>
      </h1>

      {isAdminView ? renderAdminView() : renderStudentView()}

      {/* Show message for faculty if they try to access */}
       {!isAdminView && user?.role !== 'student' && (
           <Alert>
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Information</AlertTitle>
             <AlertDescription>Fee details are primarily available for students and administrators.</AlertDescription>
           </Alert>
       )}

    </div>
  );
}


// --- Helper Components ---

// Summary Box
interface SummaryBoxProps {
    label: string;
    value: number;
    color?: 'green' | 'red';
}

function SummaryBox({ label, value, color }: SummaryBoxProps) {
    const colorClass = color === 'green' ? 'bg-green-500/10 text-green-600'
                     : color === 'red' ? 'bg-red-500/10 text-red-600'
                     : 'bg-secondary/10 text-secondary-foreground'; // Default or 'Total Due'
     const valueColor = color === 'green' ? 'text-green-600'
                       : color === 'red' ? 'text-red-600'
                       : 'text-foreground'; // Default

    return (
        <div className={`flex flex-col items-center p-4 rounded-lg ${colorClass}`}>
            <span className={`text-2xl font-bold ${valueColor}`}>${value.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
}

// Skeleton Loader
function FeeSkeleton() {
    return (
         <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3"></div> {/* Title */}
            {/* Summary Card */}
            <Card>
                 <CardHeader><div className="h-6 bg-muted rounded w-1/4"></div></CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-20 bg-muted rounded-lg"></div>
                    <div className="h-20 bg-muted rounded-lg"></div>
                    <div className="h-20 bg-muted rounded-lg"></div>
                 </CardContent>
                 <CardFooter><div className="h-10 bg-muted rounded w-24 ml-auto"></div></CardFooter>
            </Card>
             {/* Details/History Card */}
            <Card>
                 <CardHeader><div className="h-6 bg-muted rounded w-1/3"></div></CardHeader>
                 <CardContent>
                     <div className="h-4 bg-muted rounded w-full mb-2"></div>
                     <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                     <div className="h-4 bg-muted rounded w-full mb-2"></div>
                     <div className="h-4 bg-muted rounded w-3/4"></div>
                 </CardContent>
            </Card>
         </div>
    );
}


