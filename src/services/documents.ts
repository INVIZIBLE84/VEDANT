import type { UserRole } from "@/types/user";
import { format } from 'date-fns';

/**
 * Types of documents managed by the system.
 */
export type DocumentType = 'Exam Paper' | 'Notice' | 'Application Form' | 'Circular' | 'Letter' | 'Other';

/**
 * Status of a document within the system.
 */
export type DocumentStatus = 'Uploaded' | 'Pending Approval' | 'Approved for Print' | 'Printing' | 'Printed' | 'Archived' | 'Rejected';

/**
 * Metadata associated with a document.
 */
export interface DocumentMetadata {
  subjectName?: string;
  course?: string; // e.g., CS101
  semester?: string; // e.g., Fall 2024
  paperType?: 'Midterm' | 'Final' | 'Internal' | 'Quiz' | 'Assignment';
  examDate?: string; // ISO Date string
  department: string; // Owning department
  tags?: string[]; // Optional tags for searching
}

/**
 * Represents a document stored in the system.
 */
export interface Document {
  id: string; // Unique identifier
  name: string; // File name
  type: DocumentType;
  uploadedBy: { id: string; name: string; role: UserRole };
  uploadDate: string; // ISO DateTime string
  metadata: DocumentMetadata;
  status: DocumentStatus;
  fileUrl: string; // URL to access/download (permissions applied server-side)
  fileSize: number; // Size in bytes
  fileMimeType: string; // e.g., application/pdf
  version: number; // Version number
  isArchived: boolean;
}

/**
 * Represents a print request associated with a document.
 */
export interface PrintRequest {
  id: string;
  documentId: string;
  documentName: string; // For easier display
  requestedBy: { id: string; name: string };
  requestDate: string; // ISO DateTime string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Printed';
  copies: number;
  paperSize: string;
  deadline?: string; // ISO Date string
  approvedBy?: { id: string; name: string };
  approvalDate?: string; // ISO DateTime string
  printedBy?: { id: string; name: string };
  printedDate?: string; // ISO DateTime string
  comments?: string; // From approver or printer
}

/**
 * Represents filters for querying documents.
 */
export interface DocumentFilters {
    type?: DocumentType;
    department?: string;
    semester?: string;
    status?: DocumentStatus;
    uploaderId?: string;
    isArchived?: boolean;
    searchQuery?: string; // Search by name, metadata tags etc.
}

/**
 * Represents an entry in the document's audit log.
 */
export interface AuditLogEntry {
    timestamp: string; // ISO DateTime string
    userId: string;
    userName: string;
    action: string; // e.g., 'Uploaded', 'Viewed', 'Downloaded', 'Print Requested', 'Approved Print', 'Printed', 'Archived'
    details?: string; // Optional details about the action
}

/**
 * Type for the string identifier returned by getFileIconType.
 */
export type FileIconType = 'pdf' | 'word' | 'text' | 'file';


// --- Mock Data (In-memory placeholder) ---

let sampleDocuments: Document[] = [
    {
        id: 'doc-exam-cs101-mid', name: 'CS101_Midterm_Fall24.pdf', type: 'Exam Paper',
        uploadedBy: { id: 'faculty999', name: 'Dr. Turing', role: 'faculty' }, uploadDate: '2024-07-20T10:00:00Z',
        metadata: { department: 'Computer Science', subjectName: 'Intro to CS', course: 'CS101', semester: 'Fall 2024', paperType: 'Midterm', examDate: '2024-08-15' },
        status: 'Pending Approval', fileUrl: '/mock/CS101_Midterm_Fall24.pdf', fileSize: 150 * 1024, fileMimeType: 'application/pdf', version: 1, isArchived: false,
    },
    {
        id: 'doc-notice-holiday', name: 'Holiday Calendar 2024-25.pdf', type: 'Notice',
        uploadedBy: { id: 'admin001', name: 'Admin User', role: 'admin' }, uploadDate: '2024-07-15T14:30:00Z',
        metadata: { department: 'Administration' },
        status: 'Uploaded', fileUrl: '/mock/Holiday_Calendar_2024-25.pdf', fileSize: 80 * 1024, fileMimeType: 'application/pdf', version: 1, isArchived: false,
    },
    {
        id: 'doc-exam-ph101-final', name: 'Physics101_Final_Spring24_v2.docx', type: 'Exam Paper',
        uploadedBy: { id: 'faculty-phys', name: 'Dr. Curie', role: 'faculty' }, uploadDate: '2024-05-10T09:00:00Z',
        metadata: { department: 'Physics', subjectName: 'General Physics', course: 'PH101', semester: 'Spring 2024', paperType: 'Final', examDate: '2024-05-25' },
        status: 'Printed', fileUrl: '/mock/Physics101_Final_Spring24_v2.docx', fileSize: 220 * 1024, fileMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', version: 2, isArchived: false,
    },
     {
        id: 'doc-letter-dept', name: 'Internal Memo - Lab Safety.txt', type: 'Letter',
        uploadedBy: { id: 'admin001', name: 'Admin User', role: 'admin' }, uploadDate: '2024-07-25T11:00:00Z',
        metadata: { department: 'Administration', tags: ['safety', 'lab'] },
        status: 'Uploaded', fileUrl: '/mock/Internal_Memo_Lab_Safety.txt', fileSize: 5 * 1024, fileMimeType: 'text/plain', version: 1, isArchived: false,
    },
     {
        id: 'doc-exam-cs101-mid-old', name: 'CS101_Midterm_Spring24.pdf', type: 'Exam Paper',
        uploadedBy: { id: 'faculty999', name: 'Dr. Turing', role: 'faculty' }, uploadDate: '2024-03-10T10:00:00Z',
        metadata: { department: 'Computer Science', subjectName: 'Intro to CS', course: 'CS101', semester: 'Spring 2024', paperType: 'Midterm' },
        status: 'Archived', fileUrl: '/mock/CS101_Midterm_Spring24.pdf', fileSize: 140 * 1024, fileMimeType: 'application/pdf', version: 1, isArchived: true,
    },
];

let samplePrintRequests: PrintRequest[] = [
    {
        id: 'pr-1', documentId: 'doc-exam-ph101-final', documentName: 'Physics101_Final_Spring24_v2.docx',
        requestedBy: { id: 'faculty-phys', name: 'Dr. Curie' }, requestDate: '2024-05-11T10:00:00Z',
        status: 'Printed', copies: 50, paperSize: 'A4', deadline: '2024-05-20',
        approvedBy: { id: 'admin001', name: 'Admin User' }, approvalDate: '2024-05-11T15:00:00Z',
        printedBy: { id: 'printcell007', name: 'Print Operator' }, printedDate: '2024-05-15T11:00:00Z', comments: 'Printed successfully.'
    },
    // Add more requests as needed
];

let sampleAuditLogs: { [documentId: string]: AuditLogEntry[] } = {
    'doc-exam-ph101-final': [
        { timestamp: '2024-05-10T09:00:00Z', userId: 'faculty-phys', userName: 'Dr. Curie', action: 'Uploaded', details: 'Version 2' },
        { timestamp: '2024-05-11T10:00:00Z', userId: 'faculty-phys', userName: 'Dr. Curie', action: 'Print Requested', details: '50 copies, A4' },
        { timestamp: '2024-05-11T14:55:00Z', userId: 'admin001', userName: 'Admin User', action: 'Viewed' },
        { timestamp: '2024-05-11T15:00:00Z', userId: 'admin001', userName: 'Admin User', action: 'Approved Print' },
        { timestamp: '2024-05-15T10:50:00Z', userId: 'printcell007', userName: 'Print Operator', action: 'Downloaded' },
        { timestamp: '2024-05-15T11:00:00Z', userId: 'printcell007', userName: 'Print Operator', action: 'Printed' },
    ],
    'doc-exam-cs101-mid': [
         { timestamp: '2024-07-20T10:00:00Z', userId: 'faculty999', userName: 'Dr. Turing', action: 'Uploaded', details: 'Version 1' },
    ],
};

// --- Service Functions ---

/**
 * Simulates uploading a document. In reality, this would handle file upload to storage.
 * @param file The file object to upload.
 * @param metadata Document metadata.
 * @param uploader User performing the upload.
 * @returns A promise resolving to the created Document object.
 */
export async function uploadDocument(
    file: File,
    metadata: DocumentMetadata,
    uploader: { id: string; name: string; role: UserRole },
    type: DocumentType = 'Other'
): Promise<Document | { error: string }> {
    console.log(`Uploading document: ${file.name} by ${uploader.name}`, metadata);
    // TODO: Implement actual file upload (e.g., to Firebase Storage) and hash checking
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload time

    // Basic validation
    if (!file) return { error: "No file provided." };
    // Check if exists (simple name check for demo, use hash in real app)
    if (sampleDocuments.some(doc => doc.name === file.name && !doc.isArchived)) {
         // Allow re-upload as new version? For now, return error
         // return { error: "A document with this name already exists." };
    }

    const newDocument: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
        name: file.name,
        type: type,
        uploadedBy: uploader,
        uploadDate: new Date().toISOString(),
        metadata: metadata,
        status: type === 'Exam Paper' ? 'Pending Approval' : 'Uploaded', // Exam papers need approval
        fileUrl: `/mock/${file.name}`, // Placeholder URL
        fileSize: file.size,
        fileMimeType: file.type,
        version: 1, // Assume first version
        isArchived: false,
    };

    sampleDocuments.push(newDocument);
    logAudit(newDocument.id, uploader.id, uploader.name, 'Uploaded', `Version ${newDocument.version}`);

    return newDocument;
}

/**
 * Retrieves documents based on filters and user role.
 * @param filters Filtering criteria.
 * @param userRole Role of the user requesting (for permission simulation).
 * @returns A promise resolving to an array of Document objects.
 */
export async function getDocuments(filters?: DocumentFilters, userRole?: UserRole): Promise<Document[]> {
    console.log("Fetching documents with filters:", filters, "for role:", userRole);
    // TODO: Implement API call with server-side filtering and permission checks
    await new Promise(resolve => setTimeout(resolve, 100));

    let results = sampleDocuments;

    // --- Permission Simulation (Basic) ---
    // Students typically only see Notices/Circulars unless specifically shared?
    if (userRole === 'student') {
         results = results.filter(doc => ['Notice', 'Circular', 'Application Form'].includes(doc.type) && !doc.isArchived);
         // TODO: Add logic for documents shared specifically with students/courses
    }
    // Faculty see their uploads + department docs + general notices
    else if (userRole === 'faculty') {
        // Simplified: show non-archived. Real app needs user ID check.
        results = results.filter(doc => !doc.isArchived);
    }
     // Print cell only sees 'Approved for Print' or 'Printing'
     else if (userRole === 'print_cell') {
         results = results.filter(doc => ['Approved for Print', 'Printing'].includes(doc.status) && !doc.isArchived);
     }
    // Admin sees everything by default (can be filtered)

    // --- Filtering ---
     results = results.filter(doc => filters?.isArchived === undefined ? !doc.isArchived : doc.isArchived === filters.isArchived);

    if (filters?.type) {
        results = results.filter(doc => doc.type === filters.type);
    }
    if (filters?.department) {
        results = results.filter(doc => doc.metadata.department === filters.department);
    }
    if (filters?.semester) {
        results = results.filter(doc => doc.metadata.semester === filters.semester);
    }
    if (filters?.status) {
        results = results.filter(doc => doc.status === filters.status);
    }
     if (filters?.uploaderId) {
        results = results.filter(doc => doc.uploadedBy.id === filters.uploaderId);
    }
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(doc =>
            doc.name.toLowerCase().includes(query) ||
            doc.metadata.subjectName?.toLowerCase().includes(query) ||
            doc.metadata.course?.toLowerCase().includes(query) ||
            doc.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Sort by upload date descending
    results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return results;
}

/**
 * Retrieves a single document by ID (with permission check simulation).
 * @param documentId ID of the document.
 * @param userId ID of the user requesting.
 * @param userRole Role of the user requesting.
 * @returns A promise resolving to the Document object or null.
 */
export async function getDocumentById(documentId: string, userId: string, userRole: UserRole): Promise<Document | null> {
    console.log(`Fetching document ${documentId} for user ${userId} (${userRole})`);
    // TODO: Implement API call with server-side permission checks
    await new Promise(resolve => setTimeout(resolve, 50));
    const document = sampleDocuments.find(doc => doc.id === documentId);

    if (!document) return null;

    // Basic permission simulation
     if (userRole === 'student' && !['Notice', 'Circular', 'Application Form'].includes(document.type)) {
         console.warn(`Access denied for student ${userId} to view document ${documentId}`);
         return null; // Students can only see general docs by default
     }
     if (userRole === 'print_cell' && !['Approved for Print', 'Printing'].includes(document.status)) {
          console.warn(`Access denied for print_cell ${userId} to view document ${documentId} with status ${document.status}`);
          return null;
     }
     // Faculty access check might involve department matching

    // Log view action (if not already logged recently)
     logAudit(documentId, userId, `User ${userId.slice(-3)}`, 'Viewed'); // Use actual username in real app

    return document;
}

/**
 * Updates a document's status or metadata. (Admin/Specific Roles)
 * @param documentId ID of the document to update.
 * @param updates Partial object of updates (e.g., { status: 'Archived', isArchived: true }).
 * @param user Performing the update.
 * @returns Promise indicating success.
 */
export async function updateDocument(documentId: string, updates: Partial<Pick<Document, 'status' | 'metadata' | 'isArchived'>>, user: { id: string; name: string; role: UserRole }): Promise<{ success: boolean; message: string }> {
    console.log(`User ${user.id} updating document ${documentId}:`, updates);
    // TODO: Implement API call with permission checks
    await new Promise(resolve => setTimeout(resolve, 80));

    const docIndex = sampleDocuments.findIndex(d => d.id === documentId);
    if (docIndex === -1) return { success: false, message: "Document not found." };

    // Permission Check (Example: Only admin can archive)
    if (updates.isArchived !== undefined && user.role !== 'admin') {
         return { success: false, message: "Permission denied to archive/unarchive." };
    }
     if (updates.status && user.role === 'faculty' && !['Pending Approval'].includes(sampleDocuments[docIndex].status)) {
         // Faculty might only be able to change status in specific conditions?
         // return { success: false, message: "Faculty cannot change status at this stage." };
     }


    // Apply updates
    if (updates.status) {
        sampleDocuments[docIndex].status = updates.status;
        logAudit(documentId, user.id, user.name, 'Status Changed', `New status: ${updates.status}`);
    }
    if (updates.isArchived !== undefined) {
        sampleDocuments[docIndex].isArchived = updates.isArchived;
         logAudit(documentId, user.id, user.name, updates.isArchived ? 'Archived' : 'Unarchived');
         if (updates.isArchived) {
             sampleDocuments[docIndex].status = 'Archived'; // Ensure status consistency
         } else if (sampleDocuments[docIndex].status === 'Archived') {
             // Revert to a sensible previous state? Or 'Uploaded'? Needs logic.
             sampleDocuments[docIndex].status = 'Uploaded';
         }
    }
    if (updates.metadata) {
        sampleDocuments[docIndex].metadata = { ...sampleDocuments[docIndex].metadata, ...updates.metadata };
         logAudit(documentId, user.id, user.name, 'Metadata Updated');
    }

    return { success: true, message: "Document updated successfully." };
}


// --- Print Workflow Functions ---

/**
 * Requests printing for a document.
 * @param documentId ID of the document.
 * @param copies Number of copies.
 * @param paperSize Paper size preference.
 * @param requester User requesting the print.
 * @param deadline Optional deadline.
 * @returns Promise resolving to the created PrintRequest.
 */
export async function requestPrint(
    documentId: string,
    copies: number,
    paperSize: string,
    requester: { id: string; name: string },
    deadline?: string
): Promise<PrintRequest | { error: string }> {
    console.log(`User ${requester.id} requesting print for ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    const document = sampleDocuments.find(d => d.id === documentId);
    if (!document) return { error: "Document not found." };
    if (document.status !== 'Uploaded' && document.status !== 'Pending Approval') { // Allow requesting print even if pending doc approval? Business logic needed.
       // return { error: `Cannot request print for document with status: ${document.status}` };
    }
     if (samplePrintRequests.some(pr => pr.documentId === documentId && pr.status !== 'Printed' && pr.status !== 'Rejected')) {
        return { error: "A print request for this document is already in progress." };
     }


    const newPrintRequest: PrintRequest = {
        id: `pr-${Date.now()}-${documentId.slice(-4)}`,
        documentId: documentId,
        documentName: document.name,
        requestedBy: requester,
        requestDate: new Date().toISOString(),
        status: 'Pending',
        copies: copies,
        paperSize: paperSize,
        deadline: deadline,
    };

    samplePrintRequests.push(newPrintRequest);
    // Update document status if needed? Maybe not here, wait for admin approval.
     // document.status = 'Pending Approval'; // Or similar?
     logAudit(documentId, requester.id, requester.name, 'Print Requested', `${copies} copies, ${paperSize}`);


    return newPrintRequest;
}

/**
 * Retrieves print requests based on filters.
 * @param filters Filtering criteria (e.g., status, documentId, requesterId).
 * @param userRole Role for permission simulation.
 * @returns Promise resolving to an array of PrintRequest objects.
 */
export async function getPrintRequests(filters?: Partial<PrintRequest>, userRole?: UserRole): Promise<PrintRequest[]> {
    console.log("Fetching print requests with filters:", filters, "for role:", userRole);
     // TODO: Implement API call with server-side filtering and permission checks
    await new Promise(resolve => setTimeout(resolve, 80));

    let results = samplePrintRequests;

     // --- Permission Simulation ---
     if (userRole === 'faculty') {
        // Faculty sees their requests
        // Simplified: assumes filters.requestedBy.id is set if filtering by faculty
        if (filters?.requestedBy?.id) {
             results = results.filter(pr => pr.requestedBy.id === filters.requestedBy?.id);
        } else {
             // If no specific requester filter, maybe show none? Or based on department? Needs clarity.
             // results = []; // Or fetch based on department
        }
     } else if (userRole === 'print_cell') {
         // Print cell sees 'Approved' or 'Printed' requests
         results = results.filter(pr => ['Approved', 'Printed'].includes(pr.status));
     }
     // Admin sees all by default

    // --- Filtering ---
    if (filters?.status) {
        results = results.filter(pr => pr.status === filters.status);
    }
    if (filters?.documentId) {
        results = results.filter(pr => pr.documentId === filters.documentId);
    }

     results.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

    return results;
}

/**
 * Approves or rejects a print request. (Admin Role)
 * @param requestId ID of the print request.
 * @param action 'Approve' or 'Reject'.
 * @param admin User performing the action.
 * @param comments Optional comments.
 * @returns Promise indicating success.
 */
export async function actionPrintRequest(
    requestId: string,
    action: 'Approve' | 'Reject',
    admin: { id: string; name: string },
    comments?: string
): Promise<{ success: boolean; message: string }> {
     console.log(`Admin ${admin.id} ${action}ing print request ${requestId}`);
     // TODO: Implement API call with permission checks
     await new Promise(resolve => setTimeout(resolve, 100));

     const reqIndex = samplePrintRequests.findIndex(pr => pr.id === requestId);
     if (reqIndex === -1) return { success: false, message: "Print request not found." };

     const printRequest = samplePrintRequests[reqIndex];
     if (printRequest.status !== 'Pending') {
         return { success: false, message: `Request already ${printRequest.status}.` };
     }

     const docIndex = sampleDocuments.findIndex(d => d.id === printRequest.documentId);
     if (docIndex === -1) return { success: false, message: "Associated document not found." }; // Should not happen

     if (action === 'Approve') {
         printRequest.status = 'Approved';
         printRequest.approvedBy = admin;
         printRequest.approvalDate = new Date().toISOString();
         sampleDocuments[docIndex].status = 'Approved for Print'; // Update document status
         logAudit(printRequest.documentId, admin.id, admin.name, 'Approved Print');
     } else {
         printRequest.status = 'Rejected';
         printRequest.approvedBy = admin;
         printRequest.approvalDate = new Date().toISOString();
         printRequest.comments = comments;
         sampleDocuments[docIndex].status = 'Rejected'; // Update document status
         logAudit(printRequest.documentId, admin.id, admin.name, 'Rejected Print', comments);
     }
     printRequest.comments = comments;


     return { success: true, message: `Print request ${action.toLowerCase()}d.` };
}

/**
 * Marks a print request as printed. (Print Cell Role)
 * @param requestId ID of the print request.
 * @param printer User performing the action.
 * @returns Promise indicating success.
 */
export async function markAsPrinted(requestId: string, printer: { id: string; name: string }): Promise<{ success: boolean; message: string }> {
     console.log(`Print Cell ${printer.id} marking request ${requestId} as printed`);
      // TODO: Implement API call with permission checks
     await new Promise(resolve => setTimeout(resolve, 90));

     const reqIndex = samplePrintRequests.findIndex(pr => pr.id === requestId);
     if (reqIndex === -1) return { success: false, message: "Print request not found." };

     const printRequest = samplePrintRequests[reqIndex];
     if (printRequest.status !== 'Approved') { // Can only mark approved requests as printed
         return { success: false, message: `Cannot mark request with status ${printRequest.status} as printed.` };
     }

      const docIndex = sampleDocuments.findIndex(d => d.id === printRequest.documentId);
      if (docIndex === -1) return { success: false, message: "Associated document not found." };


     printRequest.status = 'Printed';
     printRequest.printedBy = printer;
     printRequest.printedDate = new Date().toISOString();
     sampleDocuments[docIndex].status = 'Printed'; // Update document status

     logAudit(printRequest.documentId, printer.id, printer.name, 'Printed');

     return { success: true, message: "Request marked as printed." };
}

// --- Audit Log Functions ---

/**
 * Retrieves the audit log for a specific document.
 * @param documentId ID of the document.
 * @param userRole Role for permission simulation.
 * @returns Promise resolving to an array of AuditLogEntry objects.
 */
export async function getAuditLog(documentId: string, userRole: UserRole): Promise<AuditLogEntry[]> {
     console.log(`Fetching audit log for document ${documentId} for role ${userRole}`);
     // TODO: Implement API call with permission checks (e.g., only admin/uploader?)
     await new Promise(resolve => setTimeout(resolve, 50));

     if (userRole !== 'admin' && userRole !== 'faculty') { // Simplified permission
         console.warn(`Audit log access denied for role ${userRole}`);
         return [];
     }

     return sampleAuditLogs[documentId] || [];
}

/** Helper to add entry to mock audit log */
function logAudit(documentId: string, userId: string, userName: string, action: string, details?: string): void {
    if (!sampleAuditLogs[documentId]) {
        sampleAuditLogs[documentId] = [];
    }
    sampleAuditLogs[documentId].push({
        timestamp: new Date().toISOString(),
        userId,
        userName,
        action,
        details
    });
     sampleAuditLogs[documentId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Keep sorted
}


// --- Utility ---

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Returns a string identifier representing the file type icon.
 * Use this identifier in the frontend to map to actual icon components (e.g., Lucide icons).
 * @param mimeType The MIME type of the file.
 * @returns A string identifier ('pdf', 'word', 'text', 'file').
 */
export const getFileIconType = (mimeType: string): FileIconType => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'word';
    if (mimeType.includes('text')) return 'text';
    return 'file'; // Default file icon type
}


export const getStatusBadgeVariant = (status: DocumentStatus | PrintRequest['status']): { variant: "default" | "secondary" | "destructive" | "outline", className: string } => {
  switch (status) {
    case 'Uploaded': return { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'Pending Approval': return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    case 'Approved for Print': return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' };
    case 'Approved': return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' }; // For PrintRequest
    case 'Printing': return { variant: 'secondary', className: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'Printed': return { variant: 'default', className: 'bg-gray-100 text-gray-800 border-gray-300' };
    case 'Archived': return { variant: 'outline', className: 'bg-gray-50 text-gray-500 border-gray-200' };
    case 'Rejected': return { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' };
    case 'Pending': return { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' }; // For PrintRequest
    default: return { variant: 'outline', className: '' };
  }
};

