"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, FileText, Send, Loader2, AlertTriangle, Search, Filter } from "lucide-react";
import {
  getStudentClearanceStatus,
  submitClearanceRequest,
  getPendingClearanceActions, // Faculty/Admin
  getAllClearanceRequests, // Admin
  actionClearanceStep, // Faculty/Admin
  type ClearanceRequest,
  type ClearanceStep,
  type ClearanceFilters
} from "@/services/clearance";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function ClearancePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clearanceRequest, setClearanceRequest] = useState<ClearanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Faculty/Admin specific state
  const [pendingActions, setPendingActions] = useState<ClearanceRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ClearanceRequest[]>([]); // Admin only
  const [filters, setFilters] = useState<ClearanceFilters>({});
  const [isActioning, setIsActioning] = useState(false);
  const [actionDetails, setActionDetails] = useState<{ requestId: string; stepId: string; action: 'Approve' | 'Reject'; comments: string } | null>(null);


  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
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
        if (currentUser.role === 'student') {
          const status = await getStudentClearanceStatus(currentUser.id);
          setClearanceRequest(status);
        } else if (currentUser.role === 'faculty' && currentUser.department) {
          const actions = await getPendingClearanceActions(currentUser.id, currentUser.role, currentUser.department);
          setPendingActions(actions);
        } else if (currentUser.role === 'admin') {
          const allData = await getAllClearanceRequests(filters);
          setAllRequests(allData);
           // Also fetch pending actions for admin (e.g., Finance)
           const adminActions = await getPendingClearanceActions(currentUser.id, currentUser.role, 'Finance'); // Assuming admin handles finance
           setPendingActions(adminActions);
        }
      } catch (err) {
        console.error("Error fetching clearance data:", err);
        setError("Failed to load clearance information. Please try again.");
        toast({ variant: "destructive", title: "Error", description: "Could not fetch clearance data." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]); // Initial fetch

  // --- Admin: Fetch All Requests based on Filters ---
  useEffect(() => {
    if (user?.role === 'admin') {
        const fetchAdminData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const allData = await getAllClearanceRequests(filters);
                setAllRequests(allData);
            } catch (err) {
                console.error("Error fetching filtered admin clearance data:", err);
                setError("Failed to load filtered clearance information.");
                toast({ variant: "destructive", title: "Error", description: "Could not fetch filtered data." });
            } finally {
                setIsLoading(false);
            }
        };
         // Debounce or add a button to trigger fetch? For now, fetch on filter change.
         const timer = setTimeout(() => fetchAdminData(), 300); // Simple debounce
         return () => clearTimeout(timer);
    }
  }, [filters, user?.role, toast]);


  // --- Handle Submit Clearance Request ---
  const handleSubmitRequest = async () => {
    if (!user || user.role !== 'student' || !user.department || !user.studentId) {
        toast({ variant: "destructive", title: "Error", description: "Cannot submit request. Invalid user data." });
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitClearanceRequest(user.id, { name: user.name, department: user.department, rollNo: user.studentId }); // Assuming studentId is rollNo
      if ('error' in result) {
          setError(result.error);
          toast({ variant: "destructive", title: "Submission Failed", description: result.error });
      } else {
          setClearanceRequest(result);
          toast({ title: "Success", description: "Clearance request submitted successfully." });
      }
    } catch (err) {
      console.error("Error submitting clearance request:", err);
      setError("An unexpected error occurred during submission.");
      toast({ variant: "destructive", title: "Error", description: "Could not submit request." });
    } finally {
      setIsSubmitting(false);
    }
  };


    // --- Handle Faculty/Admin Action ---
    const handleActionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!actionDetails || !user || (user.role !== 'faculty' && user.role !== 'admin')) return;

        const { requestId, stepId, action } = actionDetails;
        const formData = new FormData(event.currentTarget);
        const comments = formData.get('comments') as string || undefined;

        setIsActioning(true);
        try {
            const result = await actionClearanceStep(requestId, stepId, action, user.id, user.name, comments);
            if (result.success && result.request) {
                toast({ title: "Success", description: result.message });
                // Update the state
                 if(user.role === 'faculty' || user.role === 'admin') {
                    setPendingActions(prev => prev.filter(req => {
                        // Remove request if the specific step actioned was the last one for this user
                        // Or update the request within the list if other steps remain
                        const updatedReq = req.requestId === result.request?.requestId ? result.request : req;
                        // Check if any *other* pending steps exist for *this* user in the updated request
                        const hasMorePendingForUser = updatedReq.steps.some(step =>
                            step.status === 'Pending' &&
                            step.approverRole === user.role &&
                            (step.department === user.department || (user.role === 'admin' && step.department === 'Finance')) &&
                            step.stepId !== stepId // Exclude the one just actioned
                        );
                        return hasMorePendingForUser; // Keep if more actions needed by this user
                    }));

                     // Update admin's "all requests" view
                     if (user.role === 'admin') {
                        setAllRequests(prev => prev.map(req => req.requestId === result.request?.requestId ? result.request! : req));
                     }
                 }
                 setActionDetails(null); // Close dialog implicitly

            } else {
                 toast({ variant: "destructive", title: "Action Failed", description: result.message });
            }
        } catch (err) {
            console.error("Error actioning clearance step:", err);
            toast({ variant: "destructive", title: "Error", description: "Could not process the action." });
        } finally {
            setIsActioning(false);
        }
    };


  // --- Loading / Error States ---
  if (isLoading) {
    return <ClearanceSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Clearance Status</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Helper to get status style ---
    const getStatusStyle = (status: ClearanceStep['status'] | ClearanceRequest['overallStatus']): { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode, className: string } => {
        switch (status) {
            case 'Approved': return { variant: 'default', icon: <CheckCircle className="h-4 w-4 text-green-500" />, className: "bg-green-100 text-green-800 border-green-300" };
            case 'Pending': return { variant: 'secondary', icon: <Clock className="h-4 w-4 text-yellow-500" />, className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
             case 'In Progress': return { variant: 'secondary', icon: <Clock className="h-4 w-4 text-blue-500" />, className: "bg-blue-100 text-blue-800 border-blue-300" };
            case 'Rejected': return { variant: 'destructive', icon: <XCircle className="h-4 w-4 text-red-500" />, className: "bg-red-100 text-red-800 border-red-300" };
            default: return { variant: 'outline', icon: null, className: "" };
        }
    };

  // --- Calculate Progress ---
  const calculateProgress = (steps: ClearanceStep[]): number => {
    if (!steps || steps.length === 0) return 0;
    const approvedCount = steps.filter(s => s.status === 'Approved').length;
    return Math.round((approvedCount / steps.length) * 100);
  };

  // --- Render Student View ---
  const renderStudentView = () => {
    if (!clearanceRequest) {
      return (
        <Card className="transform transition-transform duration-300 hover:shadow-lg text-center">
          <CardHeader>
            <CardTitle>Submit Clearance</CardTitle>
            <CardDescription>Start your clearance process here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You haven't submitted your clearance request yet.</p>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Clearance Request
            </Button>
          </CardContent>
        </Card>
      );
    }

    const progress = calculateProgress(clearanceRequest.steps);
    const overallStyle = getStatusStyle(clearanceRequest.overallStatus);

    return (
      <>
        {/* Overall Status & Progress */}
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
               <span>Overall Clearance Status</span>
               <Badge variant={overallStyle.variant} className={cn("text-sm px-3 py-1", overallStyle.className)}>
                   {React.cloneElement(overallStyle.icon as React.ReactElement, { className: "mr-1 h-4 w-4" })}
                   {clearanceRequest.overallStatus}
               </Badge>
            </CardTitle>
            <CardDescription>Track the approval progress of your clearance request.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full h-3 mb-2" />
            <p className="text-sm text-muted-foreground text-center">{progress}% Complete</p>
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
              Submitted on: {format(new Date(clearanceRequest.submissionDate), 'PPP p')}
           </CardFooter>
        </Card>

        {/* Department-wise Steps */}
        <Card className="transform transition-transform duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Approval Steps</CardTitle>
            <CardDescription>Status from each required department/faculty.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Action By</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                   <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clearanceRequest.steps.length > 0 ? (
                  clearanceRequest.steps.map((step) => {
                    const style = getStatusStyle(step.status);
                    return (
                      <TableRow key={step.stepId}>
                        <TableCell className="font-medium">{step.department}</TableCell>
                        <TableCell>
                          <Badge variant={style.variant} className={cn("text-xs", style.className)}>
                             {React.cloneElement(style.icon as React.ReactElement, { className: "mr-1 h-3 w-3" })}
                            {step.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{step.approverName || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {step.approvalDate ? format(new Date(step.approvalDate), 'PP') : '-'}
                        </TableCell>
                         <TableCell className="text-xs text-muted-foreground">{step.comments || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No approval steps defined yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  };

   // --- Render Faculty/Admin Pending Actions View ---
   const renderPendingActionsView = () => {
       if (pendingActions.length === 0) {
            return (
                <Card>
                    <CardHeader><CardTitle>Pending Actions</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">No clearance requests require your action at this time.</p></CardContent>
                </Card>
            );
       }

        return (
            <Card className="transform transition-transform duration-300 hover:shadow-lg">
                <CardHeader>
                    <CardTitle>Clearance Requests Requiring Action ({pendingActions.length})</CardTitle>
                    <CardDescription>Approve or reject pending clearance steps assigned to you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pendingActions.map(request => (
                        <Card key={request.requestId} className="border-l-4 border-secondary">
                            <CardHeader>
                                 <CardTitle className="text-lg flex justify-between items-center">
                                     <span>{request.studentName} ({request.studentRollNo || request.studentId})</span>
                                     <span className="text-sm font-normal text-muted-foreground">{request.studentDepartment}</span>
                                 </CardTitle>
                                 <CardDescription>Submitted: {format(new Date(request.submissionDate), 'PPP p')}</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <h4 className="font-semibold mb-2">Pending Steps for Your Action:</h4>
                                <ul className="space-y-2">
                                     {request.steps
                                         .filter(step =>
                                             step.status === 'Pending' &&
                                             step.approverRole === user?.role &&
                                             (step.department === user?.department || (user?.role === 'admin' && step.department === 'Finance'))
                                         )
                                         .map(step => (
                                             <li key={step.stepId} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                                 <span className="font-medium">{step.department} Clearance</span>
                                                 {/* Action Dialog Trigger */}
                                                 <Dialog>
                                                      <DialogTrigger asChild>
                                                        <div className="flex gap-2">
                                                          <Button size="sm" variant="outline" className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300" onClick={() => setActionDetails({ requestId: request.requestId, stepId: step.stepId, action: 'Approve', comments: '' })}>
                                                            <CheckCircle className="h-4 w-4 mr-1"/> Approve
                                                          </Button>
                                                           <Button size="sm" variant="outline" className="bg-red-100 hover:bg-red-200 text-red-800 border-red-300" onClick={() => setActionDetails({ requestId: request.requestId, stepId: step.stepId, action: 'Reject', comments: '' })}>
                                                            <XCircle className="h-4 w-4 mr-1"/> Reject
                                                           </Button>
                                                        </div>
                                                      </DialogTrigger>
                                                      <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>{actionDetails?.action} Clearance for {request.studentName} ({step.department})</DialogTitle>
                                                                <DialogDescription>
                                                                    Please provide any comments (optional for approval, recommended for rejection).
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <form onSubmit={handleActionSubmit} className="space-y-4">
                                                                <Textarea
                                                                    name="comments"
                                                                    placeholder={`Reason for ${actionDetails?.action.toLowerCase()}ing...`}
                                                                    rows={3}
                                                                />
                                                                <DialogFooter>
                                                                    <Button type="button" variant="ghost" onClick={() => setActionDetails(null)}>Cancel</Button>
                                                                    <Button type="submit" disabled={isActioning} variant={actionDetails?.action === 'Reject' ? 'destructive' : 'default'}>
                                                                        {isActioning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                        Confirm {actionDetails?.action}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </form>
                                                      </DialogContent>
                                                 </Dialog>
                                             </li>
                                     ))}
                                </ul>
                             </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        );
   };

   // --- Render Admin All Requests View ---
   const renderAdminAllRequestsView = () => {
        const handleFilterChange = (key: keyof ClearanceFilters, value: string | undefined) => {
            setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
        };

        return (
             <Card className="transform transition-transform duration-300 hover:shadow-lg">
                 <CardHeader>
                    <CardTitle>All Clearance Requests</CardTitle>
                    <CardDescription>Overview and management of all submitted clearance requests.</CardDescription>
                     {/* Filters */}
                     <div className="flex flex-wrap gap-2 pt-4">
                         <div className="relative flex-grow max-w-xs">
                             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                 type="search"
                                 placeholder="Search Student ID/Name/Roll..."
                                 className="pl-8"
                                 value={filters.searchQuery || ''}
                                 onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                             />
                         </div>
                         <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                             <SelectTrigger className="w-full sm:w-[180px]">
                                 <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                                 <SelectValue placeholder="Filter by Status" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="all">All Statuses</SelectItem>
                                 <SelectItem value="Pending">Pending</SelectItem>
                                 <SelectItem value="In Progress">In Progress</SelectItem>
                                 <SelectItem value="Approved">Approved</SelectItem>
                                 <SelectItem value="Rejected">Rejected</SelectItem>
                             </SelectContent>
                         </Select>
                          {/* Add Department Filter if needed */}
                         <Button variant="outline" onClick={() => setFilters({})}>Clear Filters</Button>
                     </div>
                 </CardHeader>
                 <CardContent>
                    {isLoading && !allRequests.length ? <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-10"/> :
                    <Table>
                         <TableHeader>
                            <TableRow>
                                 <TableHead>Student</TableHead>
                                 <TableHead>Department</TableHead>
                                 <TableHead>Submitted</TableHead>
                                 <TableHead>Overall Status</TableHead>
                                 <TableHead className="text-center">Progress</TableHead>
                                 <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {allRequests.length > 0 ? (
                                allRequests.map(request => {
                                    const style = getStatusStyle(request.overallStatus);
                                    const progress = calculateProgress(request.steps);
                                    return (
                                        <TableRow key={request.requestId}>
                                            <TableCell className="font-medium">
                                                {request.studentName} <span className="text-xs text-muted-foreground block">{request.studentRollNo || request.studentId}</span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{request.studentDepartment}</TableCell>
                                            <TableCell className="text-muted-foreground">{format(new Date(request.submissionDate), 'PP')}</TableCell>
                                            <TableCell>
                                                <Badge variant={style.variant} className={cn("text-xs", style.className)}>
                                                    {React.cloneElement(style.icon as React.ReactElement, { className: "mr-1 h-3 w-3" })}
                                                    {request.overallStatus}
                                                </Badge>
                                            </TableCell>
                                             <TableCell className="text-center">
                                                <Progress value={progress} className="h-2 w-16 inline-block" title={`${progress}%`}/>
                                             </TableCell>
                                            <TableCell className="text-right">
                                                {/* TODO: Add View Details Button/Modal */}
                                                <Button variant="ghost" size="sm">View Details</Button>
                                                {/* Optional: Override/Force Action Button */}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No clearance requests found matching filters.</TableCell>
                                </TableRow>
                            )}
                         </TableBody>
                    </Table>
                    }
                 </CardContent>
             </Card>
        );
   };


  // --- Main Return ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <FileText className="h-7 w-7" /> Clearance Tracker
        <span className="text-sm font-normal text-muted-foreground">({user?.role})</span>
      </h1>

       {user?.role === 'student' && renderStudentView()}
       {(user?.role === 'faculty' || user?.role === 'admin') && renderPendingActionsView()}
       {user?.role === 'admin' && renderAdminAllRequestsView()}

       {/* Display appropriate view if no user or unexpected role */}
       {!user && !isLoading && <Alert variant="destructive"><AlertDescription>Not logged in.</AlertDescription></Alert>}
       {/* {user && user.role === 'faculty' && !user.department && <Alert><AlertDescription>Faculty department not set.</AlertDescription></Alert>} */}

    </div>
  );
}

// --- Skeleton Loader ---
function ClearanceSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3"></div> {/* Title */}
             {/* Card 1 */}
             <Card>
                 <CardHeader><div className="h-6 bg-muted rounded w-1/4"></div></CardHeader>
                 <CardContent className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                 </CardContent>
                 <CardFooter><div className="h-10 bg-muted rounded w-24"></div></CardFooter>
            </Card>
            {/* Card 2 */}
             <Card>
                 <CardHeader><div className="h-6 bg-muted rounded w-1/3"></div></CardHeader>
                 <CardContent>
                     <div className="h-4 bg-muted rounded w-full mb-2"></div>
                     <div className="h-4 bg-muted rounded w-full mb-2"></div>
                     <div className="h-4 bg-muted rounded w-3/4"></div>
                 </CardContent>
            </Card>
        </div>
    );
}
