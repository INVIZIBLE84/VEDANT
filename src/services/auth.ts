import { AuthUser, UserRole } from "@/types/user";

// Mock user credentials (replace with actual backend call)
const mockCredentials: Record<string, { password: string; role: UserRole, name: string, id: string, department?: string, studentId?: string, facultyId?: string }> = {
  "student": { password: "password", role: "student", name: "Alice Smith", id: "student123", department: "Computer Science", studentId: "S12345" },
  "faculty": { password: "password", role: "faculty", name: "Dr. Alan Turing", id: "faculty999", department: "Computer Science", facultyId: "F999" },
  "admin": { password: "password", role: "admin", name: "Admin User", id: "admin001", department: "Administration" },
  "print": { password: "password", role: "print_cell", name: "Print Operator", id: "printcell007", department: "Printing Services" },
  "clearance": { password: "password", role: "clearance_officer", name: "Clearance Officer Lib", id: "clearance01", department: "Library" },
};

/**
 * Simulates authenticating a user with username and password.
 * In a real app, this would make an API call to the backend.
 * @param username The username entered by the user.
 * @param password The password entered by the user.
 * @returns A promise resolving to an object indicating success and user info, or an error message.
 */
export async function authenticateUser(
  username: string,
  password?: string // Password might be optional if using other methods in future
): Promise<{ success: boolean; message: string; user?: AuthUser }> {
  console.log(`Attempting authentication for username: ${username}`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

  // Basic validation
  if (!username || !password) {
    return { success: false, message: "Username and password are required." };
  }

  // --- Add admin/admin check for testing ---
  if (username.toLowerCase() === "admin" && password === "admin") {
       console.log(`Authentication successful for test admin`);
       const adminUser: AuthUser = {
           id: "admin001",
           name: "Test Admin",
           email: "admin@campusconnect.edu", // Mock email
           role: "admin",
           department: "Administration",
           isAuthenticated: true,
           isLocked: false,
       };
       return { success: true, message: "Login successful!", user: adminUser };
   }
   // --- End admin/admin check ---


  const storedUser = mockCredentials[username.toLowerCase()]; // Case-insensitive username check

  if (storedUser && storedUser.password === password) {
     // Simulate successful login - return user data
     // Note: In a real app, never return the password hash/salt
     const user: AuthUser = {
       id: storedUser.id,
       name: storedUser.name,
       email: `${username}@campusconnect.edu`, // Mock email
       role: storedUser.role,
       department: storedUser.department,
       studentId: storedUser.studentId,
       facultyId: storedUser.facultyId,
       isAuthenticated: true,
       // avatarUrl: `https://picsum.photos/seed/${username}/100/100`, // Consistent avatar
       isLocked: false, // Assume not locked
     };
    console.log(`Authentication successful for ${username}`);
    return { success: true, message: "Login successful!", user: user };
  } else {
    console.log(`Authentication failed for ${username}`);
    return { success: false, message: "Invalid username or password." };
  }
}