import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

// TODO: Replace with actual data fetching from a service
interface Document {
  id: string;
  name: string;
  type: string; // e.g., 'Exam Paper', 'Notice', 'Application Form'
  uploadedBy: string; // Faculty/Admin name
  uploadDate: string;
  fileUrl: string; // URL to download the file
}

const sampleDocuments: Document[] = [
  { id: 'doc1', name: 'Midterm Exam Schedule - Fall 2024', type: 'Notice', uploadedBy: 'Admin Office', uploadDate: '2024-07-20', fileUrl: '#' },
  { id: 'doc2', name: 'Physics 101 - Sample Questions', type: 'Exam Paper', uploadedBy: 'Prof. Einstein', uploadDate: '2024-07-18', fileUrl: '#' },
  { id: 'doc3', name: 'Library Clearance Form', type: 'Application Form', uploadedBy: 'Library Dept', uploadDate: '2024-07-15', fileUrl: '#' },
  { id: 'doc4', name: 'Holiday Calendar 2024-2025', type: 'Notice', uploadedBy: 'Admin Office', uploadDate: '2024-07-10', fileUrl: '#' },
];

export default async function DocumentsPage() {
  // In a real app, fetch documents based on user role and permissions
  const documents: Document[] = sampleDocuments;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Documents</h1>

      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Shared Documents</CardTitle>
          <CardDescription>Access important documents shared by faculty and administration.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] hidden sm:table-cell">Type</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded By</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                     <TableCell className="hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {doc.type}
                        </span>
                     </TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{doc.uploadedBy}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} download={doc.name} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1">Download</span>
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
               ) : (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No documents available.
                  </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
