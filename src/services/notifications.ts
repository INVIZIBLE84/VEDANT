/**
 * Type representing different categories or severities of notifications.
 */
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

/**
 * Represents a single notification item.
 */
export interface Notification {
  id: string;
  userId: string; // The user this notification is for
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO DateTime string
  isRead: boolean;
  link?: string; // Optional link to related page (e.g., /fees, /clearance/req-123)
}

// --- Mock Data (In-memory placeholder) ---

let sampleNotifications: Notification[] = [
  { id: 'n1', userId: 'student123', title: 'Fee Payment Reminder', message: 'Your semester fee payment is due on Aug 15, 2024.', type: 'warning', timestamp: '2024-07-28T10:00:00Z', isRead: false, link: '/fees' },
  { id: 'n2', userId: 'student123', title: 'Library Book Overdue', message: 'The book "Intro to Algorithms" is overdue. Fine applicable.', type: 'error', timestamp: '2024-07-27T15:30:00Z', isRead: false },
  { id: 'n3', userId: 'student123', title: 'Class Rescheduled', message: 'CS101 class on Wednesday is rescheduled to 14:00 in Room 302.', type: 'info', timestamp: '2024-07-26T09:00:00Z', isRead: true },
  { id: 'n4', userId: 'student123', title: 'Clearance Approved', message: 'Your library clearance step has been approved.', type: 'success', timestamp: '2024-07-25T11:00:00Z', isRead: true, link: '/clearance' },
  { id: 'n5', userId: 'admin001', title: 'New Print Request', message: 'Dr. Curie requested print for Physics101_Final.', type: 'info', timestamp: '2024-07-28T11:00:00Z', isRead: false, link: '/documents' }, // Example admin notification
   { id: 'n6', userId: 'faculty999', title: 'Low Attendance Warning', message: 'Student Bob Johnson (S67890) has low attendance in CS101.', type: 'warning', timestamp: '2024-07-29T08:00:00Z', isRead: false, link: '/attendance' }, // Example faculty notification
];

// --- Service Functions ---

/**
 * Retrieves notifications for a specific user.
 * @param userId The ID of the user.
 * @returns A promise resolving to an array of Notification objects.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  console.log(`Fetching notifications for user: ${userId}`);
  // TODO: Implement API call to fetch notifications for the user
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

  // Filter mock data for the specific user
  return sampleNotifications.filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Ensure sorted by newest first
}

/**
 * Retrieves the count of unread notifications for a user.
 * @param userId The ID of the user.
 * @returns A promise resolving to the number of unread notifications.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    console.log(`Fetching unread notification count for user: ${userId}`);
    // Optimize: Backend should provide this directly if possible
    await new Promise(resolve => setTimeout(resolve, 50));
    return sampleNotifications.filter(n => n.userId === userId && !n.isRead).length;
}

/**
 * Marks a specific notification as read for a user.
 * @param userId The ID of the user.
 * @param notificationId The ID of the notification to mark as read.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    console.log(`Marking notification ${notificationId} as read for user: ${userId}`);
    // TODO: Implement API call to update notification status
    await new Promise(resolve => setTimeout(resolve, 30));

    const notificationIndex = sampleNotifications.findIndex(n => n.id === notificationId && n.userId === userId);
    if (notificationIndex > -1) {
        sampleNotifications[notificationIndex].isRead = true;
        return true;
    }
    return false; // Notification not found or doesn't belong to user
}

/**
 * Marks all notifications as read for a specific user.
 * @param userId The ID of the user.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
    console.log(`Marking all notifications as read for user: ${userId}`);
    // TODO: Implement API call to update all notifications for the user
    await new Promise(resolve => setTimeout(resolve, 80));

    let changed = false;
    sampleNotifications.forEach(n => {
        if (n.userId === userId && !n.isRead) {
            n.isRead = true;
            changed = true;
        }
    });
    return changed; // Return true if any notification was actually marked read
}


/**
 * Deletes a specific notification for a user.
 * @param userId The ID of the user.
 * @param notificationId The ID of the notification to delete.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    console.log(`Deleting notification ${notificationId} for user: ${userId}`);
    // TODO: Implement API call to delete the notification
    await new Promise(resolve => setTimeout(resolve, 50));

    const initialLength = sampleNotifications.length;
    sampleNotifications = sampleNotifications.filter(n => !(n.id === notificationId && n.userId === userId));

    return sampleNotifications.length < initialLength; // Return true if a notification was removed
}


/**
 * Simulates sending a notification (used internally by other services).
 * In a real app, the backend would handle pushing notifications.
 * @param notification The notification object to add.
 */
export async function sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<Notification> {
    console.log(`Sending notification to ${notification.userId}: ${notification.title}`);
     // TODO: Backend logic to actually send push/email and save to DB
     await new Promise(resolve => setTimeout(resolve, 20));

     const newNotification: Notification = {
        ...notification,
        id: `n-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
     };
     sampleNotifications.push(newNotification);
     return newNotification;
}


// Example of how another service might use sendNotification:
// import { sendNotification } from './notifications';
// async function approveClearanceStep(...) {
//    ... update step ...
//    await sendNotification({
//        userId: studentId,
//        title: 'Clearance Step Approved',
//        message: `Your ${department} clearance has been approved by ${approverName}.`,
//        type: 'success',
//        link: '/clearance'
//    });
// }
