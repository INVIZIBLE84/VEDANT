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
            fd.studentId.toLowerCase().includes(query) /* || fd.studentName.toLowerCase().includes(query) */
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


// --- Sample Data (In-memory placeholder) ---

const sampleFeeDetailsData: Omit<FeeDetails, 'totalPaid' | 'balanceDue' | 'status'>[] = [
  {
    studentId: 'student123', // Alice Smith
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
    totalDue: 1900, // Calculated
    dueDate: '2024-08-15',
    breakdown: [
      { description: 'Tuition Fee - Sem 5', amount: 1800 },
      { description: 'Association Fee', amount: 100 },
    ],
  },
];

const sampleFeePaymentsData: { [studentId: string]: FeePayment[] } = {
  'student123': [
    { id: 'pay1', paymentDate: '2024-07-10', amount: 1000, method: 'Online', transactionId: 'txn_abc123' },
    { id: 'pay2', paymentDate: '2024-07-25', amount: 1000, method: 'Bank Transfer', transactionId: 'txn_def456' }, // Paid in full
  ],
  'student456': [
    { id: 'pay3', paymentDate: '2024-07-15', amount: 1000, method: 'Manual Entry', recordedBy: 'admin001' }, // Partially paid
  ],
  // student789 has no payments yet
};
