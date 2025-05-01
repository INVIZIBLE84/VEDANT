import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { getFeePayments, type FeePayment } from "@/services/fee-management"; // Assuming service exists

export default async function FeesPage() {
  // TODO: Replace 'student123' with actual logged-in student ID
  const studentId = 'student123';
  const feePayments: FeePayment[] = await getFeePayments(studentId);

  // TODO: Fetch total due and calculate balance from an API
  const totalFeesDue = 2000;
  const totalPaid = feePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = totalFeesDue - totalPaid;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Fee Management</h1>

      {/* Fee Status Summary */}
       <Card className="transform transition-transform duration-300 hover:shadow-lg">
         <CardHeader>
           <CardTitle>Fee Status</CardTitle>
           <CardDescription>Your current fee balance and payment overview.</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-secondary/10 rounded-lg">
                <span className="text-2xl font-bold text-secondary">${totalFeesDue.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">Total Due</span>
            </div>
             <div className="flex flex-col items-center p-4 bg-green-500/10 rounded-lg">
                <span className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">Total Paid</span>
            </div>
             <div className="flex flex-col items-center p-4 bg-red-500/10 rounded-lg">
                <span className={`text-2xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${balanceDue.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">Balance Due</span>
            </div>
         </CardContent>
          <CardContent className="flex justify-end pt-4">
            {/* TODO: Link to actual payment gateway or process */}
             <Button disabled={balanceDue <= 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                 <DollarSign className="mr-2 h-4 w-4" /> Pay Now
             </Button>
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
                <TableHead className="text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feePayments.length > 0 ? (
                feePayments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No payment history found.
                  </TableCell>
                </TableRow>
              )}
                {/* Footer for Total Paid */}
                {feePayments.length > 0 && (
                    <TableRow className="border-t border-dashed">
                        <TableCell className="font-semibold">Total Paid</TableCell>
                        <TableCell className="text-right font-bold">${totalPaid.toFixed(2)}</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
