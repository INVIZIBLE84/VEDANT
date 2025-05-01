import type { UserRole } from "@/types/user";

/**
 * Represents one step in the clearance approval process.
 */
export interface ClearanceStep {
  stepId: string; // Unique identifier for this step instance
  department: string; // Department responsible (e.g., Library, Finance, HoD)
  approverRole: UserRole; // Role required to approve (faculty, admin)
  status: 'Pending' | 'Approved' | 'Rejected';
  approverName?: string; // Name of the person who actioned
  approvalDate?: string; // ISO DateTime string
  comments?: string; // Comments from the approver
}

/**
 * Represents the overall clearance request for a student.
 */
export interface ClearanceRequest {
  requestId: string; // Unique identifier for the request
  studentId: string;
  studentName: string; // Include student name
  submissionDate: string; // ISO DateTime string
  overallStatus: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  steps: ClearanceStep[];
  // Add other student details if needed, e.g., department, roll number
  studentDepartment?: string;
  studentRollNo?: string;
}

/**
 * Represents filters for querying clearance requests.
 */
export interface ClearanceFilters {
    status?: ClearanceRequest['overallStatus'];
    department?: string; // Filter by student department
    approverDepartment?: string; // Filter by department responsible for a step
    searchQuery?: string; // For student name or ID
}


// --- Student Functions ---

/**
 * Asynchronously retrieves the current clearance status for a given student.
 *
 * @param studentId The ID of the student.
 * @returns A promise that resolves to the ClearanceRequest object or null if not found.
 */
export async function getStudentClearanceStatus(studentId: string): Promise<ClearanceRequest | null> {
  console.log(`Fetching clearance status for student: ${studentId}`);
  // TODO: Implement API call
  await new Promise(resolve => setTimeout(resolve, 80)); // Simulate network delay

  const request = sampleClearanceRequests.find(req => req.studentId === studentId);
  return request ? { ...request, overallStatus: calculateOverallStatus(request.steps) } : null;
}

/**
 * Asynchronously submits a new clearance request for a student.
 *
 * @param studentId The ID of the student submitting.
 * @param studentDetails Additional details like name, department, roll number.
 * @returns A promise resolving to the newly created ClearanceRequest.
 */
export async function submitClearanceRequest(studentId: string, studentDetails: { name: string, department: string, rollNo: string }): Promise<ClearanceRequest | { error: string }> {
    console.log(`Student ${studentId} submitting clearance request with details:`, studentDetails);
    // TODO: Implement API call to create request and initial steps
    await new Promise(resolve => setTimeout(resolve, 150));

    // Check if already submitted
    if (sampleClearanceRequests.some(req => req.studentId === studentId)) {
        return { error: "Clearance request already submitted." };
    }

    // Define initial steps (example) - this should likely come from backend config
    const initialSteps: ClearanceStep[] = [
        { stepId: `step-${Date.now()}-lib`, department: 'Library', approverRole: 'faculty', status: 'Pending' },
        { stepId: `step-${Date.now()}-fin`, department: 'Finance', approverRole: 'admin', status: 'Pending' },
        { stepId: `step-${Date.now()}-hod`, department: studentDetails.department, approverRole: 'faculty', status: 'Pending' }, // Assuming HoD is faculty
    ];

    const newRequest: ClearanceRequest = {
        requestId: `req-${Date.now()}-${studentId}`,
        studentId: studentId,
        studentName: studentDetails.name,
        studentDepartment: studentDetails.department,
        studentRollNo: studentDetails.rollNo,
        submissionDate: new Date().toISOString(),
        overallStatus: 'Pending',
        steps: initialSteps,
    };

    sampleClearanceRequests.push(newRequest);
    return newRequest;
}


// --- Faculty/Admin Functions ---

/**
 * Asynchronously retrieves clearance requests needing action by a specific approver.
 *
 * @param approverId The ID of the faculty/admin.
 * @param approverRole The role of the approver.
 * @param approverDepartment The department of the approver (used to match steps).
 * @returns A promise resolving to an array of ClearanceRequest objects needing action.
 */
export async function getPendingClearanceActions(approverId: string, approverRole: UserRole, approverDepartment: string): Promise<ClearanceRequest[]> {
    console.log(`Fetching pending clearance actions for ${approverRole} ${approverId} in department ${approverDepartment}`);
    // TODO: Implement API call
    await new Promise(resolve => setTimeout(resolve, 120));

    const pendingRequests = sampleClearanceRequests.filter(req => {
        // Find steps matching the approver's role and department that are still pending
        return req.steps.some(step =>
            step.status === 'Pending' &&
            step.approverRole === approverRole &&
            (step.department === approverDepartment || (approverRole === 'admin' && step.department === 'Finance')) // Admin handles Finance, Faculty handles their dept (Library might be specific faculty)
            // More complex logic might be needed if specific users are assigned
        );
    });

    return pendingRequests.map(req => ({ ...req, overallStatus: calculateOverallStatus(req.steps) }));
}

/**
 * Asynchronously retrieves all clearance requests (for Admin overview).
 *
 * @param filters Optional filters for status, department, search.
 * @returns A promise resolving to an array of all ClearanceRequest objects.
 */
export async function getAllClearanceRequests(filters?: ClearanceFilters): Promise<ClearanceRequest[]> {
    console.log("Fetching all clearance requests for admin with filters:", filters);
    // TODO: Implement API call with filtering
    await new Promise(resolve => setTimeout(resolve, 200));

    let results = sampleClearanceRequests.map(req => ({ ...req, overallStatus: calculateOverallStatus(req.steps) }));

    if (filters?.status) {
        results = results.filter(req => req.overallStatus === filters.status);
    }
    if (filters?.department) {
        results = results.filter(req => req.studentDepartment === filters.department);
    }
     if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(req =>
            req.studentId.toLowerCase().includes(query) ||
            req.studentName.toLowerCase().includes(query) ||
            (req.studentRollNo && req.studentRollNo.toLowerCase().includes(query))
        );
    }

    return results;
}


/**
 * Asynchronously approves or rejects a specific clearance step.
 *
 * @param requestId The ID of the overall clearance request.
 * @param stepId The ID of the specific step being actioned.
 * @param action 'Approve' or 'Reject'.
 * @param approverId The ID of the faculty/admin taking the action.
 * @param approverName The name of the faculty/admin.
 * @param comments Optional comments.
 * @returns Promise indicating success and the updated request.
 */
export async function actionClearanceStep(
    requestId: string,
    stepId: string,
    action: 'Approve' | 'Reject',
    approverId: string,
    approverName: string,
    comments?: string
): Promise<{ success: boolean; message: string, request?: ClearanceRequest }> {
    console.log(`${approverId} (${approverName}) ${action}ing step ${stepId} for request ${requestId} with comments: ${comments}`);
    // TODO: Implement API call to update the step
    await new Promise(resolve => setTimeout(resolve, 100));

    const requestIndex = sampleClearanceRequests.findIndex(req => req.requestId === requestId);
    if (requestIndex === -1) {
        return { success: false, message: "Clearance request not found." };
    }

    const request = sampleClearanceRequests[requestIndex];
    const stepIndex = request.steps.findIndex(step => step.stepId === stepId);
    if (stepIndex === -1) {
        return { success: false, message: "Clearance step not found." };
    }

     // Basic permission check simulation (Backend should enforce this)
     const step = request.steps[stepIndex];
     // const user = await getCurrentUser(); // Fetch current user performing action
     // if (!user || user.id !== approverId || user.role !== step.approverRole) {
     //    return { success: false, message: "Permission denied." };
     // }


    if (step.status !== 'Pending') {
        return { success: false, message: `Step already ${step.status}.` };
    }

    step.status = action === 'Approve' ? 'Approved' : 'Rejected';
    step.approverName = approverName;
    step.approvalDate = new Date().toISOString();
    step.comments = comments;

    // Recalculate overall status after update
    request.overallStatus = calculateOverallStatus(request.steps);

    return { success: true, message: `Step ${action.toLowerCase()}d successfully.`, request: { ...request } }; // Return copy
}

// Helper function to determine overall status based on steps
function calculateOverallStatus(steps: ClearanceStep[]): ClearanceRequest['overallStatus'] {
    if (steps.some(step => step.status === 'Rejected')) {
        return 'Rejected';
    }
    if (steps.every(step => step.status === 'Approved')) {
        return 'Approved';
    }
    if (steps.some(step => step.status === 'Approved')) {
        return 'In Progress';
    }
    return 'Pending'; // If all are pending
}

// --- Calculate Progress ---
export const calculateProgress = (steps: ClearanceStep[]): number => {
    if (!steps || steps.length === 0) return 0;
    const approvedCount = steps.filter(s => s.status === 'Approved').length;
    return Math.round((approvedCount / steps.length) * 100);
};


// --- Sample Data (In-memory placeholder) ---

let sampleClearanceRequests: ClearanceRequest[] = [
  {
    requestId: 'req1',
    studentId: 'student123', // Alice Smith
    studentName: 'Alice Smith',
    studentDepartment: 'Computer Science',
    studentRollNo: 'S12345',
    submissionDate: '2024-07-20T10:00:00Z',
    overallStatus: 'In Progress', // Calculated
    steps: [
      { stepId: 's1-lib', department: 'Library', approverRole: 'faculty', status: 'Approved', approverName: 'Librarian Joe', approvalDate: '2024-07-21T11:00:00Z' },
      { stepId: 's1-fin', department: 'Finance', approverRole: 'admin', status: 'Pending' },
      { stepId: 's1-hod', department: 'Computer Science', approverRole: 'faculty', status: 'Pending' },
    ],
  },
  {
    requestId: 'req2',
    studentId: 'student456', // Bob Johnson
    studentName: 'Bob Johnson',
    studentDepartment: 'Physics',
    studentRollNo: 'S67890',
    submissionDate: '2024-07-18T14:30:00Z',
    overallStatus: 'Approved', // Calculated
    steps: [
      { stepId: 's2-lib', department: 'Library', approverRole: 'faculty', status: 'Approved', approverName: 'Librarian Joe', approvalDate: '2024-07-19T09:00:00Z' },
      { stepId: 's2-fin', department: 'Finance', approverRole: 'admin', status: 'Approved', approverName: 'Admin User', approvalDate: '2024-07-22T15:00:00Z' },
      { stepId: 's2-hod', department: 'Physics', approverRole: 'faculty', status: 'Approved', approverName: 'Dr. Curie', approvalDate: '2024-07-20T16:00:00Z', comments: 'All clear.' },
    ],
  },
    {
    requestId: 'req3',
    studentId: 'student789', // Charlie Brown
    studentName: 'Charlie Brown',
    studentDepartment: 'Mathematics',
    studentRollNo: 'S11223',
    submissionDate: '2024-07-26T09:00:00Z', // Submitted now
    overallStatus: 'Pending', // Calculated
    steps: [
       { stepId: `step-${Date.now()}-lib`, department: 'Library', approverRole: 'faculty', status: 'Pending' },
       { stepId: `step-${Date.now()}-fin`, department: 'Finance', approverRole: 'admin', status: 'Pending' },
       { stepId: `step-${Date.now()}-hod`, department: 'Mathematics', approverRole: 'faculty', status: 'Pending' },
    ],
  },
];
