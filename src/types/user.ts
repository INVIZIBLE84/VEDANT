/**
 * Defines the possible roles a user can have within the application.
 */
export type UserRole = "student" | "faculty" | "admin";

/**
 * Represents the profile information for a user.
 */
export interface UserProfile {
  id: string; // Unique user identifier (could be Firebase UID, database ID, etc.)
  name: string;
  email: string;
  role: UserRole;
  studentId?: string; // Specific to students
  facultyId?: string; // Specific to faculty
  department?: string; // Department affiliation (faculty or student)
  avatarUrl?: string; // URL for profile picture
  phone?: string; // Optional contact phone number
  address?: string; // Optional address
  // Add other relevant fields as needed
}

/**
 * Represents the currently authenticated user's session data.
 * This might include the profile and additional auth-related info.
 */
export interface AuthUser extends UserProfile {
  // Add any authentication specific fields if necessary, e.g., token expiry
  isAuthenticated: boolean;
}

// Mock function to simulate fetching the current user
// In a real app, this would interact with your authentication provider (e.g., Firebase Auth)
export async function getCurrentUser(): Promise<AuthUser | null> {
   // Simulate fetching based on a mock role
   const MOCK_ROLE: UserRole = "student"; // Change this to 'faculty' or 'admin' for testing
   const MOCK_ID_MAP = {
       student: "student123",
       faculty: "faculty999",
       admin: "admin001"
   };

   await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch

    if (MOCK_ROLE === 'student') {
        return {
            id: MOCK_ID_MAP.student,
            name: "Alice Smith",
            email: "alice.smith@campusconnect.edu",
            role: "student",
            studentId: "S12345",
            department: "Computer Science",
            avatarUrl: "https://picsum.photos/seed/alice/100/100",
            isAuthenticated: true,
        };
    } else if (MOCK_ROLE === 'faculty') {
         return {
             id: MOCK_ID_MAP.faculty,
             name: "Dr. Turing",
             email: "alan.turing@campusconnect.edu",
             role: "faculty",
             facultyId: "F999",
             department: "Computer Science",
             avatarUrl: "https://picsum.photos/seed/turing/100/100",
             isAuthenticated: true,
         };
    } else if (MOCK_ROLE === 'admin') {
         return {
             id: MOCK_ID_MAP.admin,
             name: "Admin User",
             email: "admin@campusconnect.edu",
             role: "admin",
             avatarUrl: "https://picsum.photos/seed/admin/100/100",
             isAuthenticated: true,
         };
    }

  // Simulate not logged in
  return null;
}
