import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Replace with actual data fetching from a service
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error'; // Controls styling/icon
  timestamp: string;
  isRead: boolean;
}

// Sample data
const sampleNotifications: Notification[] = [
  { id: 'n1', title: 'Fee Payment Reminder', message: 'Your semester fee payment is due next week.', type: 'warning', timestamp: '2024-07-23 10:00:00', isRead: false },
  { id: 'n2', title: 'Library Book Overdue', message: 'The book "Intro to Algorithms" is overdue. Please return it soon.', type: 'error', timestamp: '2024-07-22 15:30:00', isRead: false },
  { id: 'n3', title: 'Class Rescheduled', message: 'CS101 class on Wednesday is rescheduled to 14:00.', type: 'info', timestamp: '2024-07-22 09:00:00', isRead: true },
  { id: 'n4', title: 'Clearance Approved', message: 'Your library clearance has been approved.', type: 'success', timestamp: '2024-07-21 11:00:00', isRead: true },
  { id: 'n5', title: 'Campus Event', message: 'Join the annual tech fest this weekend!', type: 'info', timestamp: '2024-07-20 16:00:00', isRead: true },
];

const getNotificationStyle = (type: Notification['type']) => {
  switch (type) {
    case 'warning': return { icon: <AlertTriangle className="text-yellow-500" />, borderClass: "border-l-yellow-500" };
    case 'error': return { icon: <AlertTriangle className="text-red-500" />, borderClass: "border-l-red-500" };
    case 'success': return { icon: <CheckCircle className="text-green-500" />, borderClass: "border-l-green-500" };
    case 'info':
    default: return { icon: <Info className="text-blue-500" />, borderClass: "border-l-blue-500" };
  }
};

export default async function NotificationsPage() {
  // In a real app, fetch notifications for the logged-in user
  const notifications: Notification[] = sampleNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                 {unreadCount} New
             </span>
          )}
       </div>


      <Card className="transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Updates and alerts from the college.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const style = getNotificationStyle(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 rounded-md border border-l-4 p-4 transition-colors hover:bg-muted/50",
                    style.borderClass,
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                   <div className="flex-shrink-0 pt-0.5">{style.icon}</div>
                  <div className="flex-1">
                    <p className={cn("font-semibold", !notification.isRead && "text-primary")}>{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                   {/* TODO: Add mark as read/unread functionality */}
                   {/* {!notification.isRead && <button className="text-xs text-blue-600 hover:underline">Mark as read</button>} */}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
               <Bell className="h-12 w-12 mb-4 text-gray-400" />
               <p>No notifications yet.</p>
               <p className="text-sm">Check back later for updates.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
