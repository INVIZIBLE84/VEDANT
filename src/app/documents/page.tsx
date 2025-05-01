 "use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Upload, Search, Filter, Archive, Printer, History, FileUp, Loader2, AlertTriangle, Info, Check, X, FileType, FileSpreadsheet, FilePresentation, ImageIcon, FileArchive, FileQuestion } from "lucide-react"; // Import specific icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { useToast } from "@/hooks/use-toast";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import {
    Document, DocumentFilters, DocumentMetadata, DocumentStatus, DocumentType, PrintRequest, AuditLogEntry,
    uploadDocument, getDocuments, getDocumentById, updateDocument, requestPrint, getPrintRequests, actionPrintRequest, markAsPrinted, getAuditLog,
    formatBytes, getFileIconType, FileIconType, getStatusBadgeVariant
} from "@/services/documents";

// Map file icon types to Lucide icons
const FileIconMap: Record<FileIconType, React.ReactNode> = {
    pdf: <FileType className="text-red-500" />,
    word: <FileType className="text-blue-500" />,
    excel: <FileSpreadsheet className="text-green-500" />,
    powerpoint: <FilePresentation className="text-orange-500" />,
    image: <ImageIcon className="text-purple-500" />,
    zip: <FileArchive className="text-yellow-600" />,
    text: <FileType className="text-gray-500" />,
    file: <FileQuestion className="text-muted-foreground" />, // Default
};


export default function DocumentsPage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<string>("documents"); // 'documents', 'printRequests'

    // State for Documents Tab
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [docFilters, setDocFilters] = React.useState<DocumentFilters>({ isArchived: false }); // Default to non-archived
    const [isUploading, setIsUploading] = React.useState(false);
    const [showUploadDialog, setShowUploadDialog] = React.useState(false);

    // State for Print Requests Tab
    const [printRequests, setPrintRequests] = React.useState<PrintRequest[]>([]);
    const [printFilters, setPrintFilters] = React.useState<Partial<Pick<PrintRequest, 'status'>>>({}); // Simplified filters for now
    const [showPrintRequestDialog, setShowPrintRequestDialog] = React.useState(false);
    const [selectedDocForPrint, setSelectedDocForPrint] = React.useState<Document | null>(null);
    const [isRequestingPrint, setIsRequestingPrint] = React.useState(false);
    const [isActioningPrint, setIsActioningPrint] = React.useState<Record<string, boolean>>({}); // Loading state per request ID

     // State for Audit Log Viewer
     const [selectedDocForAudit, setSelectedDocForAudit] = React.useState<Document | null>(null);
     const [auditLog, setAuditLog] = React.useState<AuditLogEntry[]>([]);
     const [isLoadingAudit, setIsLoadingAudit] = React.useState(false);
     const [showAuditDialog, setShowAuditDialog] = React.useState(false);

    // Fetch initial data based on user role
    React.useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (!currentUser) {
                setError("User not authenticated.");
                setIsLoading(false);
                return;
            }

            try {
                 await fetchDocuments(docFilters, currentUser.role);
                 if (currentUser.role === 'admin' || currentUser.role === 'faculty' || currentUser.role === 'print_cell') {
                    await fetchPrintRequests(printFilters, currentUser.role);
                 }
            } catch (err) {
                console.error("Error fetching initial data:", err);
                setError("Failed to load document data. Please try again.");
                toast({ variant: "destructive", title: "Error", description: "Could not fetch documents." });
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [toast]); // Run only once

    // Refetch documents when filters change
    React.useEffect(() => {
         if (user) { // Only fetch if user is loaded
             fetchDocuments(docFilters, user.role);
         }
     }, [docFilters, user]); // Refetch on filter or user change

     // Refetch print requests when filters change
     React.useEffect(() => {
         if (user && (user.role === 'admin' || user.role === 'faculty' || user.role === 'print_cell')) {
             fetchPrintRequests(printFilters, user.role);
         }
     }, [printFilters, user]); // Refetch on filter or user change

    const fetchDocuments = async (filters: DocumentFilters, role?: UserRole) => {
         console.log("Fetching docs with filters:", filters);
         // setIsLoading(true); // Avoid global loading flicker for filter changes
         try {
             const fetchedDocs = await getDocuments(filters, role);
             setDocuments(fetchedDocs);
         } catch (err) {
             console.error("Error fetching documents:", err);
             // Keep existing data but show error
             toast({ variant: "destructive", title: "Filter Error", description: "Could not apply filters." });
         } finally {
             // setIsLoading(false);
         }
     };

    const fetchPrintRequests = async (filters: Partial<Pick<PrintRequest, 'status'>>, role: UserRole) => {
         console.log("Fetching print requests with filters:", filters);
         // setIsLoading(true); // Avoid global loading flicker
         try {
             const fetchedRequests = await getPrintRequests(filters, role);
             setPrintRequests(fetchedRequests);
         } catch (err) {
             console.error("Error fetching print requests:", err);
              toast({ variant: "destructive", title: "Filter Error", description: "Could not fetch print requests." });
         } finally {
             // setIsLoading(false);
         }
    };

     const fetchAuditLogData = async (documentId: string) => {
        if (!user) return;
        setIsLoadingAudit(true);
        try {
            const logData = await getAuditLog(documentId, user.role);
            setAuditLog(logData);
        } catch (err) {
            console.error("Error fetching audit log:", err);
            toast({ variant: "destructive", title: "Error", description: `Could not fetch audit log for document ${documentId}.` });
            setAuditLog([]);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    const handleDocFilterChange = (key: keyof DocumentFilters, value: string | boolean | undefined) => {
        setDocFilters(prev => ({ ...prev, [key]: value === 'all' || value === '' ? undefined : value }));
    };

    const handlePrintFilterChange = (key: keyof PrintRequest, value: string | undefined) => {
        setPrintFilters(prev => ({ ...prev, [key]: value === 'all' || value === '' ? undefined : value } as Partial<Pick<PrintRequest, 'status'>>));
    };

    const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) return;
        const formData = new FormData(event.currentTarget);
        const file = formData.get('documentFile') as File;
        const type = formData.get('documentType') as DocumentType;
        const department = user.department || 'Unknown'; // Get department from user or default

        // Construct metadata - TODO: Make form more dynamic based on type
        const metadata: DocumentMetadata = {
            department: department,
            subjectName: formData.get('subjectName') as string || undefined,
            course: formData.get('course') as string || undefined,
            semester: formData.get('semester') as string || undefined,
            paperType: formData.get('paperType') as DocumentMetadata['paperType'] || undefined,
            examDate: formData.get('examDate') as string || undefined,
            tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(t => t) || undefined,
        };

        if (!file || file.size === 0) {
            toast({ variant: "destructive", title: "Error", description: "Please select a file to upload." });
            return;
        }
        if (!type) {
             toast({ variant: "destructive", title: "Error", description: "Please select a document type." });
             return;
        }
        // Basic Max File Size Check (e.g., 20MB) - Backend should enforce this too
         if (file.size > 20 * 1024 * 1024) {
             toast({ variant: "destructive", title: "File Too Large", description: "Maximum upload size is 20MB." });
             return;
         }


        setIsUploading(true);
        try {
            const result = await uploadDocument(file, metadata, { id: user.id, name: user.name, role: user.role }, type);
            if ('error' in result) {
                 toast({ variant: "destructive", title: "Upload Failed", description: result.error });
            } else {
                toast({ title: "Success", description: `Document "${result.name}" uploaded successfully.` });
                setShowUploadDialog(false);
                fetchDocuments(docFilters, user.role); // Refresh list
            }
        } catch (err) {
            console.error("Error uploading document:", err);
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred during upload." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRequestPrintSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
         event.preventDefault();
         if (!user || !selectedDocForPrint) return;
         const formData = new FormData(event.currentTarget);
         const copies = parseInt(formData.get('copies') as string, 10);
         const paperSize = formData.get('paperSize') as string;
         const deadline = formData.get('deadline') as string || undefined;

         if (isNaN(copies) || copies <= 0) {
             toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number of copies." });
             return;
         }

         setIsRequestingPrint(true);
         try {
             const result = await requestPrint(selectedDocForPrint.id, copies, paperSize, { id: user.id, name: user.name }, deadline);
             if ('error' in result) {
                 toast({ variant: "destructive", title: "Request Failed", description: result.error });
             } else {
                  toast({ title: "Success", description: `Print request submitted for "${selectedDocForPrint.name}".` });
                  setShowPrintRequestDialog(false);
                  setSelectedDocForPrint(null);
                  fetchPrintRequests(printFilters, user.role); // Refresh print request list
                  // Optimistically update document status in the main list
                  setDocuments(prevDocs => prevDocs.map(doc => doc.id === selectedDocForPrint.id ? { ...doc, status: 'Pending Approval' } : doc));
             }
         } catch (err) {
             console.error("Error requesting print:", err);
             toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
         } finally {
             setIsRequestingPrint(false);
         }
    };

    const handleActionPrint = async (requestId: string, action: 'Approve' | 'Reject') => {
         if (!user || user.role !== 'admin') return; // Ensure only admin can action
         setIsActioningPrint(prev => ({ ...prev, [requestId]: true }));
         // TODO: Add comments dialog for rejection
         const comments = action === 'Reject' ? prompt("Enter reason for rejection (optional but recommended):") : undefined;
          if (action === 'Reject' && comments === null) { // User cancelled prompt
               setIsActioningPrint(prev => ({ ...prev, [requestId]: false }));
               return;
           }

         try {
            const result = await actionPrintRequest(requestId, action, { id: user.id, name: user.name }, comments || undefined);
             if (result.success) {
                 toast({ title: "Success", description: result.message });
                 fetchPrintRequests(printFilters, user.role); // Refresh list
                 // Update related document status by refetching or optimistic update
                  const updatedReq = printRequests.find(pr => pr.id === requestId);
                  if (updatedReq) {
                      const statusUpdate: DocumentStatus = action === 'Approve' ? 'Approved for Print' : 'Rejected';
                      setDocuments(prevDocs => prevDocs.map(doc => doc.id === updatedReq.documentId ? { ...doc, status: statusUpdate } : doc));
                  }

             } else {
                 toast({ variant: "destructive", title: "Action Failed", description: result.message });
             }
         } catch (err) {
             console.error(`Error ${action.toLowerCase()}ing print request:`, err);
             toast({ variant: "destructive", title: "Error", description: `Could not ${action.toLowerCase()} print request.` });
         } finally {
            setIsActioningPrint(prev => ({ ...prev, [requestId]: false }));
         }
    };

     const handleMarkPrinted = async (requestId: string) => {
         if (!user || user.role !== 'print_cell') return; // Ensure only print cell can mark
         setIsActioningPrint(prev => ({ ...prev, [requestId]: true }));
         try {
             const result = await markAsPrinted(requestId, { id: user.id, name: user.name });
             if (result.success) {
                 toast({ title: "Success", description: result.message });
                 fetchPrintRequests(printFilters, user.role); // Refresh list
                  const updatedReq = printRequests.find(pr => pr.id === requestId);
                   if (updatedReq) {
                      setDocuments(prevDocs => prevDocs.map(doc => doc.id === updatedReq.documentId ? { ...doc, status: 'Printed' } : doc));
                  }
             } else {
                 toast({ variant: "destructive", title: "Action Failed", description: result.message });
             }
         } catch (err) {
              console.error("Error marking as printed:", err);
             toast({ variant: "destructive", title: "Error", description: "Could not mark as printed." });
         } finally {
            setIsActioningPrint(prev => ({ ...prev, [requestId]: false }));
         }
     };

    const handleArchiveToggle = async (doc: Document) => {
        if (!user || user.role !== 'admin') return; // Only admin can archive/unarchive

        const actionText = doc.isArchived ? "Unarchive" : "Archive";
        if (!confirm(`Are you sure you want to ${actionText.toLowerCase()} "${doc.name}"?`)) return;

        // setIsLoading(true); // Use a more specific loading state if possible
        try {
            const result = await updateDocument(doc.id, { isArchived: !doc.isArchived }, { id: user.id, name: user.name, role: user.role });
            if (result.success) {
                 toast({ title: "Success", description: `Document ${actionText.toLowerCase()}d successfully.` });
                 fetchDocuments(docFilters, user.role); // Refresh list
            } else {
                 toast({ variant: "destructive", title: "Error", description: result.message });
            }
        } catch (err) {
             console.error(`Error ${actionText.toLowerCase()}ing document:`, err);
             toast({ variant: "destructive", title: "Error", description: `Could not ${actionText.toLowerCase()} document.` });
        } finally {
            // setIsLoading(false);
        }
    };

     // --- Render Functions ---

    const renderFilters = () => (
        <div className="flex flex-wrap items-center gap-2 pt-4 pb-4 border-b">
            <div className="relative flex-grow max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search name, subject, course..."
                    className="pl-8"
                    value={docFilters.searchQuery || ''}
                    onChange={(e) => handleDocFilterChange('searchQuery', e.target.value)}
                />
            </div>
             {/* Document Type Filter */}
             <Select value={docFilters.type} onValueChange={(value) => handleDocFilterChange('type', value as DocumentType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                    <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Exam Paper">Exam Paper</SelectItem>
                    <SelectItem value="Notice">Notice</SelectItem>
                    <SelectItem value="Application Form">Application Form</SelectItem>
                    <SelectItem value="Circular">Circular</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                     <SelectItem value="Schedule">Schedule</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
            {/* Status Filter */}
             <Select value={docFilters.status} onValueChange={(value) => handleDocFilterChange('status', value as DocumentStatus)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                     <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Uploaded">Uploaded</SelectItem>
                    <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                    <SelectItem value="Approved for Print">Approved for Print</SelectItem>
                    <SelectItem value="Printing">Printing</SelectItem>
                    <SelectItem value="Printed">Printed</SelectItem>
                    {/* <SelectItem value="Archived">Archived</SelectItem> */} {/* Handled by toggle */}
                     <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
             {/* Archived Filter Toggle (Admin Only) */}
             { user?.role === 'admin' &&
                <Button
                    variant={docFilters.isArchived ? "secondary" : "outline"}
                    onClick={() => handleDocFilterChange('isArchived', !docFilters.isArchived)}
                    title={docFilters.isArchived ? "Showing Archived" : "Show Archived"}
                >
                    <Archive className="mr-2 h-4 w-4"/> {docFilters.isArchived ? "Archived" : "Active"}
                </Button>
             }
            <Button variant="outline" onClick={() => setDocFilters({ isArchived: false })}>Clear Filters</Button>
        </div>
    );

    const renderDocumentTable = () => (
        <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] px-2 text-center">Type</TableHead>
                        <TableHead>Name &amp; Info</TableHead>
                        <TableHead className="hidden md:table-cell">Uploaded By</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && !documents.length ? (
                        <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto my-4" /></TableCell></TableRow>
                    ) : documents.length > 0 ? (
                        documents.map((doc) => {
                            const statusStyle = getStatusBadgeVariant(doc.status);
                            const iconType = getFileIconType(doc.fileMimeType);
                            const canRequestPrint = (user?.role === 'faculty' || user?.role === 'admin') && !doc.isArchived && !['Approved for Print', 'Printing', 'Archived'].includes(doc.status);
                            const canDownload = (user?.role === 'admin' || user?.id === doc.uploadedBy.id || (user?.role === 'print_cell' && ['Approved for Print', 'Printing'].includes(doc.status)));
                            const canArchive = user?.role === 'admin';

                            return (
                                <TableRow key={doc.id}>
                                    <TableCell className="px-2 text-center">
                                         <Tooltip>
                                             <TooltipTrigger>{FileIconMap[iconType] || <FileQuestion />}</TooltipTrigger>
                                             <TooltipContent>{doc.type}</TooltipContent>
                                         </Tooltip>
                                    </TableCell>
                                    <TableCell className="font-medium align-top">
                                        <span className="block">{doc.name}</span>
                                        <span className="text-xs text-muted-foreground block">
                                            {doc.metadata.course}{doc.metadata.semester ? ` (${doc.metadata.semester})` : ''} | {formatBytes(doc.fileSize)} | v{doc.version}
                                        </span>
                                        <span className="text-xs text-muted-foreground block">{doc.metadata.department}</span>
                                        {doc.metadata.tags && doc.metadata.tags.length > 0 && (
                                            <div className="mt-1 space-x-1">
                                                 {doc.metadata.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground align-top">
                                        {doc.uploadedBy.name} <span className="text-xs block">({doc.uploadedBy.role})</span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground align-top">{format(new Date(doc.uploadDate), 'PP pp')}</TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant={statusStyle.variant} className={cn("text-xs whitespace-nowrap", statusStyle.className)}>{doc.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-0.5 align-top">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 {/* Audit Log Button */}
                                                 <Dialog open={showAuditDialog && selectedDocForAudit?.id === doc.id} onOpenChange={open => {if (!open) setSelectedDocForAudit(null); setShowAuditDialog(open);}}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => {setSelectedDocForAudit(doc); fetchAuditLogData(doc.id);}}>
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Audit Log: {selectedDocForAudit?.name}</DialogTitle>
                                                            <DialogDescription>History of actions performed on this document.</DialogDescription>
                                                        </DialogHeader>
                                                        {isLoadingAudit ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
                                                            <div className="max-h-[60vh] overflow-y-auto pr-4 mt-4 border-t pt-4">
                                                                {auditLog.length > 0 ? (
                                                                    <ul className="space-y-4">
                                                                        {auditLog.map((entry, index) => (
                                                                            <li key={index} className="text-sm border-b pb-2 last:border-b-0">
                                                                                <p><span className="font-semibold">{entry.action}</span> by <span className="text-primary">{entry.userName}</span></p>
                                                                                <p className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), 'PPpp')}</p>
                                                                                {entry.details && <p className="text-xs text-muted-foreground mt-1">Details: {entry.details}</p>}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : <p className="text-muted-foreground text-center py-4">No audit log entries found.</p>}
                                                            </div>
                                                        }
                                                    </DialogContent>
                                                </Dialog>
                                            </TooltipTrigger>
                                            <TooltipContent>View Audit Log</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {/* Download Button (conditional) */}
                                                <Button variant="ghost" size="icon" asChild disabled={!canDownload}>
                                                    <a href={canDownload ? doc.fileUrl : undefined} download={doc.name} target="_blank" rel="noopener noreferrer" aria-disabled={!canDownload}>
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{canDownload ? "Download" : "Download restricted"}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {/* Print Request Button (conditional) */}
                                                <Dialog open={showPrintRequestDialog && selectedDocForPrint?.id === doc.id} onOpenChange={(open) => { if(!open) setSelectedDocForPrint(null); setShowPrintRequestDialog(open); }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={!canRequestPrint} onClick={() => setSelectedDocForPrint(doc)}>
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Request Print: {selectedDocForPrint?.name}</DialogTitle>
                                                            <DialogDescription>Specify print details for "{selectedDocForPrint?.type}"</DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handleRequestPrintSubmit} className="space-y-4 pt-4">
                                                            <div><Label htmlFor="copies">Number of Copies</Label><Input id="copies" name="copies" type="number" required min="1" defaultValue="1" /></div>
                                                            <div><Label htmlFor="paperSize">Paper Size</Label>
                                                                <Select name="paperSize" defaultValue="A4">
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent><SelectItem value="A4">A4</SelectItem><SelectItem value="Letter">Letter</SelectItem></SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div><Label htmlFor="deadline">Deadline (Optional)</Label><Input id="deadline" name="deadline" type="date" /></div>
                                                            <DialogFooter>
                                                                <Button type="button" variant="ghost" onClick={() => {setShowPrintRequestDialog(false); setSelectedDocForPrint(null);}}>Cancel</Button>
                                                                <Button type="submit" disabled={isRequestingPrint}>
                                                                    {isRequestingPrint ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Submit Request
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </TooltipTrigger>
                                            <TooltipContent>{canRequestPrint ? "Request Print" : `Cannot request print (Status: ${doc.status})`}</TooltipContent>
                                        </Tooltip>

                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                 {/* Archive/Unarchive Button (Admin only) */}
                                                <Button variant="ghost" size="icon" disabled={!canArchive} onClick={() => handleArchiveToggle(doc)}>
                                                    <Archive className={cn("h-4 w-4", doc.isArchived && 'text-accent')} />
                                                </Button>
                                            </TooltipTrigger>
                                             <TooltipContent>{canArchive ? (doc.isArchived ? "Unarchive" : "Archive") : "Archive restricted"}</TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No documents found matching filters.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TooltipProvider>
    );

     const renderPrintRequestTable = () => (
         <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && !printRequests.length ? (
                        <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto my-4" /></TableCell></TableRow>
                    ): printRequests.length > 0 ? (
                        printRequests.map((req) => {
                            const statusStyle = getStatusBadgeVariant(req.status);
                            const isLoadingAction = isActioningPrint[req.id];
                            return (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium align-top">{req.documentName}</TableCell>
                                    <TableCell className="text-muted-foreground align-top">{req.requestedBy.name}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground align-top">{format(new Date(req.requestDate), 'PP p')}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground align-top">
                                        Copies: {req.copies} <br/> Size: {req.paperSize}
                                        {req.deadline && <span className="block">Deadline: {format(new Date(req.deadline), 'PP')}</span>}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant={statusStyle.variant} className={cn("text-xs whitespace-nowrap", statusStyle.className)}>{req.status}</Badge>
                                        {req.comments &&
                                            <Tooltip>
                                                <TooltipTrigger asChild><Info className="inline-block ml-1 h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                <TooltipContent side="top">{req.status === 'Rejected' ? 'Rejection Reason' : 'Comment'}: {req.comments}</TooltipContent>
                                            </Tooltip>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right space-x-1 align-top">
                                        {/* Admin Actions */}
                                        { user?.role === 'admin' && req.status === 'Pending' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleActionPrint(req.id, 'Approve')} disabled={isLoadingAction}>
                                                    {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}<span className="ml-1 hidden sm:inline">Approve</span>
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleActionPrint(req.id, 'Reject')} disabled={isLoadingAction}>
                                                    {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}<span className="ml-1 hidden sm:inline">Reject</span>
                                                </Button>
                                            </>
                                        )}
                                        {/* Print Cell Action */}
                                        { user?.role === 'print_cell' && (req.status === 'Approved' || req.status === 'Printing') && (
                                            <Button size="sm" variant="default" onClick={() => handleMarkPrinted(req.id)} disabled={isLoadingAction}>
                                                {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin"/> : <Printer className="h-4 w-4"/>}<span className="ml-1 hidden sm:inline">Mark Printed</span>
                                            </Button>
                                        )}
                                        {/* View Document Link (if permitted) */}
                                         {/* TODO: Implement secure view link */}
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={() => alert(`Viewing document: ${req.documentName}`)}>View</Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View Document</TooltipContent>
                                         </Tooltip>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No print requests found.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
         </TooltipProvider>
     );

    // --- Main Return ---
    if (!user && !isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><FileText className="h-7 w-7" /> Documents</h1>
                 <Alert variant="destructive">
                     <AlertTriangle className="h-4 w-4" />
                     <AlertTitle>Not Authenticated</AlertTitle>
                     <AlertDescription>Please log in to access the documents module.</AlertDescription>
                 </Alert>
             </div>
        );
    }

    const canUpload = user?.role === 'faculty' || user?.role === 'admin';
    const canViewPrintRequests = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'print_cell';

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <FileText className="h-7 w-7" /> Document Workflow <span className="text-sm font-normal text-muted-foreground">({user?.role})</span>
                </h1>
                 {/* Upload Button - Visible to Faculty/Admin */}
                 { canUpload &&
                     <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                         <DialogTrigger asChild>
                             <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                 <Upload className="mr-2 h-4 w-4" /> Upload Document
                             </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-lg">
                             <DialogHeader>
                                 <DialogTitle>Upload New Document</DialogTitle>
                                 <DialogDescription>Select file and provide details. Max 20MB.</DialogDescription>
                             </DialogHeader>
                             {/* Upload Form */}
                             <form onSubmit={handleFileUpload} className="space-y-4 pt-4">
                                 <div><Label htmlFor="documentFile">File *</Label><Input id="documentFile" name="documentFile" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip" /></div>
                                 <div><Label htmlFor="documentType">Document Type *</Label>
                                    <Select name="documentType" required>
                                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="Exam Paper">Exam Paper</SelectItem>
                                             <SelectItem value="Notice">Notice</SelectItem>
                                             <SelectItem value="Application Form">Application Form</SelectItem>
                                             <SelectItem value="Circular">Circular</SelectItem>
                                              <SelectItem value="Letter">Letter</SelectItem>
                                               <SelectItem value="Schedule">Schedule</SelectItem>
                                             <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                                 {/* TODO: Conditionally show metadata fields based on type */}
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><Label htmlFor="subjectName">Subject Name</Label><Input id="subjectName" name="subjectName" /></div>
                                     <div><Label htmlFor="course">Course Code</Label><Input id="course" name="course" /></div>
                                     <div><Label htmlFor="semester">Semester</Label><Input id="semester" name="semester" /></div>
                                     <div><Label htmlFor="paperType">Paper Type</Label>
                                        <Select name="paperType">
                                             <SelectTrigger><SelectValue placeholder="Select if exam..." /></SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="Midterm">Midterm</SelectItem>
                                                  <SelectItem value="Final">Final</SelectItem>
                                                  <SelectItem value="Internal">Internal</SelectItem>
                                                   <SelectItem value="Quiz">Quiz</SelectItem>
                                                   <SelectItem value="Assignment">Assignment</SelectItem>
                                             </SelectContent>
                                         </Select>
                                     </div>
                                      <div><Label htmlFor="examDate">Exam Date</Label><Input id="examDate" name="examDate" type="date" /></div>
                                 </div>
                                  <div><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" name="tags" placeholder="e.g., urgent, schedule, safety"/></div>

                                 <DialogFooter>
                                     <Button type="button" variant="ghost" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                                     <Button type="submit" disabled={isUploading}>
                                         {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                         Upload
                                     </Button>
                                 </DialogFooter>
                             </form>
                         </DialogContent>
                     </Dialog>
                 }
            </div>

             {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                 </Alert>
             )}

            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="documents">
                 <TabsList className={cn(
                      "grid w-full grid-cols-1", // Default: 1 column for mobile
                      canViewPrintRequests ? "sm:grid-cols-2 sm:w-fit" : "sm:w-auto" // Adjust grid cols based on whether print tab is visible
                      )}>
                    <TabsTrigger value="documents">
                         <FileText className="mr-1 h-4 w-4"/> Documents ({documents.length})
                    </TabsTrigger>
                     { canViewPrintRequests &&
                         <TabsTrigger value="printRequests">
                             <Printer className="mr-1 h-4 w-4"/> Print Requests ({printRequests.length})
                         </TabsTrigger>
                     }
                 </TabsList>

                 {/* Documents Tab */}
                 <TabsContent value="documents">
                     <Card>
                        <CardHeader>
                            <CardTitle>Document Library</CardTitle>
                            <CardDescription>Manage and access uploaded documents based on your role.</CardDescription>
                            {renderFilters()}
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6"> {/* Remove horizontal padding on mobile for table */}
                            {renderDocumentTable()}
                        </CardContent>
                     </Card>
                 </TabsContent>

                 {/* Print Requests Tab */}
                 {canViewPrintRequests &&
                     <TabsContent value="printRequests">
                         <Card>
                             <CardHeader>
                                <CardTitle>Print Requests</CardTitle>
                                <CardDescription>Track the status of document print requests.</CardDescription>
                                  <div className="flex flex-wrap gap-2 pt-4 pb-4 border-b">
                                      <Select value={printFilters.status} onValueChange={(value) => handlePrintFilterChange('status', value)}>
                                          <SelectTrigger className="w-full sm:w-[180px]">
                                              <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                                              <SelectValue placeholder="Filter by Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="all">All Statuses</SelectItem>
                                              <SelectItem value="Pending">Pending</SelectItem>
                                              <SelectItem value="Approved">Approved</SelectItem>
                                              <SelectItem value="Rejected">Rejected</SelectItem>
                                              <SelectItem value="Printed">Printed</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      {/* Add more filters (requester, date range) if needed */}
                                      <Button variant="outline" onClick={() => setPrintFilters({})}>Clear Filters</Button>
                                  </div>
                             </CardHeader>
                             <CardContent className="px-0 sm:px-6">
                                 {renderPrintRequestTable()}
                             </CardContent>
                         </Card>
                     </TabsContent>
                 }
             </Tabs>

        </div>
    );
}

