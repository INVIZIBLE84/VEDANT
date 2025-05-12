
/**
 * Defines the possible roles a user can have within the application.
 */
export type UserRole = "student" | "faculty" | "admin" | "print_cell" | "clearance_officer"; // Added clearance_officer

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
  isLocked?: boolean; // Added isLocked status
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

// --- Mock Authentication State Simulation ---
// In a real app, this state would be managed by your auth provider context or global state management.
let isUserLoggedInGlobally = false;
let currentMockRole: UserRole | null = null;

/**
 * Simulates logging in a user by setting the global mock state.
 * @param role The role of the user logging in.
 */
export async function loginUser(role: UserRole) {
  console.log(`Simulating login for role: ${role}`);
  isUserLoggedInGlobally = true;
  currentMockRole = role;
  // In a real app, you'd store tokens/session info here.
}

/**
 * Simulates logging out a user by clearing the global mock state.
 */
export async function logoutUser() {
  console.log("Simulating logout");
  isUserLoggedInGlobally = false;
  currentMockRole = null;
   // In a real app, you'd clear tokens/session info here and potentially call the auth provider's logout.
}
// --- End Mock Authentication State Simulation ---


// Mock function to simulate fetching the current user
// In a real app, this would interact with your authentication provider (e.g., Firebase Auth)
export async function getCurrentUser(): Promise<AuthUser | null> {
   console.log(`getCurrentUser called. Logged in: ${isUserLoggedInGlobally}, Role: ${currentMockRole}`);
   // If not logged in (based on our simulation), return null immediately.
   if (!isUserLoggedInGlobally || !currentMockRole) {
     console.log("Returning null (not logged in).");
     return null;
   }

   const MOCK_ID_MAP = {
       student: "student123",
       faculty: "faculty999",
       admin: "admin001",
       print_cell: "printcell007",
       clearance_officer: "clearance01"
   };

   await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async fetch

    // Return user data based on the simulated logged-in role
    switch (currentMockRole) {
        case 'student':
            return {
                id: MOCK_ID_MAP.student,
                name: "Alice Smith",
                email: "alice.smith@example.edu",
                role: "student",
                studentId: "S12345",
                department: "Computer Science",
                avatarUrl: "https://picsum.photos/seed/alice/100/100",
                isAuthenticated: true,
                isLocked: false,
            };
        case 'faculty':
             return {
                 id: MOCK_ID_MAP.faculty,
                 name: "Dr. Alan Turing",
                 email: "alan.turing@example.edu",
                 role: "faculty",
                 facultyId: "F999",
                 department: "Computer Science",
                 avatarUrl: "https://picsum.photos/seed/turing/100/100",
                 isAuthenticated: true,
                 isLocked: false,
             };
        case 'admin':
             return {
                 id: MOCK_ID_MAP.admin,
                 name: "Admin User",
                 email: "admin@example.edu",
                 role: "admin",
                 department: "Administration",
                 avatarUrl: "https://picsum.photos/seed/admin/100/100",
                 isAuthenticated: true,
                 isLocked: false,
             };
        case 'print_cell':
             return {
                id: MOCK_ID_MAP.print_cell,
                name: "Print Operator",
                email: "print.cell@example.edu",
                role: "print_cell",
                department: "Printing Services",
                avatarUrl: "https://picsum.photos/seed/print/100/100",
                isAuthenticated: true,
                isLocked: false,
             };
        case 'clearance_officer':
             return {
                id: MOCK_ID_MAP.clearance_officer,
                name: "Clearance Officer Lib",
                email: "library.clear@example.edu",
                role: "clearance_officer",
                department: "Library",
                avatarUrl: "https://picsum.photos/seed/library/100/100",
                isAuthenticated: true,
                isLocked: false,
             };
        default:
          // Should not happen if currentMockRole is set, but handle defensively
          console.log("Returning null (unknown role or state inconsistency).");
          return null;
    }
}
