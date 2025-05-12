
import { AuthUser, UserRole, UserProfile } from "@/types/user";
import { format } from 'date-fns';

// --- User Management ---

export interface AdminUserFilters {
    role?: UserRole;
    status?: 'active' | 'locked';
    department?: string;
    searchQuery?: string;
    studentId?: string; // Added to support fetching a single user by studentId more directly
}

export interface UserUpdateData extends Omit<Partial<UserProfile>, 'id' | 'role' | 'isAuthenticated' | 'avatarUrl'> {
    role?: UserRole; // Allow role update potentially
}

/** Simulates fetching a list of users based on filters */
export async function getUsers(filters?: AdminUserFilters): Promise<AuthUser[]> {
    console.log("Admin fetching users with filters:", filters);
    await new Promise(res => setTimeout(res, 200)); // Simulate API call

    let results = [...mockUsers]; // Use a copy of the mock data

    if (filters?.studentId) {
        results = results.filter(u => u.studentId === filters.studentId || u.id === filters.studentId);
        return results; // Return early if fetching by specific ID
    }

    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.id.toLowerCase().includes(query) ||
            u.studentId?.toLowerCase().includes(query) ||
            u.facultyId?.toLowerCase().includes(query)
        );
    }
    if (filters?.role) {
        results = results.filter(u => u.role === filters.role);
    }
    if (filters?.status) {
        results = results.filter(u => (u.isLocked ? 'locked' : 'active') === filters.status);
    }
     if (filters?.department) {
         results = results.filter(u => u.department === filters.department);
     }

    return results.sort((a, b) => a.name.localeCompare(b.name));
}

/** Simulates fetching a single user by their ID */
export async function getUserById(userId: string): Promise<AuthUser | null> {
    console.log("Admin fetching user by ID:", userId);
    await new Promise(res => setTimeout(res, 50)); // Simulate API call
    const user = mockUsers.find(u => u.id === userId || u.studentId === userId || u.facultyId === userId);
    return user || null;
}


/** Simulates adding a new user */
export async function addUser(userData: UserUpdateData & { password?: string }): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    console.log("Admin adding user:", userData);
    await new Promise(res => setTimeout(res, 150));

    if (!userData.email || !userData.name || !userData.role || !userData.password) {
        return { success: false, message: "Missing required fields (Name, Email, Role, Password)." };
    }
    if (mockUsers.some(u => u.email === userData.email)) {
        return { success: false, message: "User with this email already exists." };
    }
    // Simulate ID generation
    const newId = `${userData.role.substring(0, 3)}${Date.now() % 10000}`;
    const newUser: AuthUser = {
        id: newId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        studentId: userData.studentId,
        facultyId: userData.facultyId,
        isAuthenticated: true, // Assume active on creation
        isLocked: false,
         avatarUrl: `https://picsum.photos/seed/${newId}/100/100`, // Generate avatar
        // Password would be hashed and stored securely on backend
    };
    mockUsers.push(newUser);
    logAdminAudit('admin001', 'Admin User', 'User Added', `Added user ${newUser.name} (${newUser.id}) with role ${newUser.role}`);
    return { success: true, message: "User added successfully.", user: newUser };
}

/** Simulates updating an existing user */
export async function updateUser(userId: string, updates: UserUpdateData): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    console.log(`Admin updating user ${userId}:`, updates);
    await new Promise(res => setTimeout(res, 100));

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: "User not found." };
    }
    // Prevent email change if necessary? Or handle verification
    if (updates.email && mockUsers.some(u => u.email === updates.email && u.id !== userId)) {
         return { success: false, message: "Email already in use by another user." };
    }

    // Apply updates (excluding sensitive fields like password)
    const updatedUser = { ...mockUsers[userIndex], ...updates };
    mockUsers[userIndex] = updatedUser;
    logAdminAudit('admin001', 'Admin User', 'User Updated', `Updated details for user ${updatedUser.name} (${userId}). Fields: ${Object.keys(updates).join(', ')}`);
    return { success: true, message: "User updated successfully.", user: updatedUser };
}

/** Simulates deleting a user */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Admin deleting user ${userId}`);
    await new Promise(res => setTimeout(res, 100));

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: "User not found." };
    }
     if (mockUsers[userIndex].role === 'admin' && mockUsers.filter(u => u.role === 'admin').length <= 1) {
         return { success: false, message: "Cannot delete the last admin account." };
     }

    const deletedUserName = mockUsers[userIndex].name;
    mockUsers.splice(userIndex, 1);
     logAdminAudit('admin001', 'Admin User', 'User Deleted', `Deleted user ${deletedUserName} (${userId})`);
    return { success: true, message: "User deleted successfully." };
}

/** Simulates resetting a user's password */
export async function resetPassword(userId: string): Promise<{ success: boolean; message: string; newPassword?: string }> {
    console.log(`Admin resetting password for user ${userId}`);
    await new Promise(res => setTimeout(res, 120));

     if (!mockUsers.some(u => u.id === userId)) {
        return { success: false, message: "User not found." };
    }
    // Simulate generating a new password (backend responsibility)
    const newPassword = `Temp${Math.random().toString(36).substring(2, 8)}`;
    // In backend: hash newPassword, update user record, maybe email user
     logAdminAudit('admin001', 'Admin User', 'Password Reset', `Reset password for user ${userId}`);
    return { success: true, message: "Password reset successfully.", newPassword: newPassword }; // Return temporary password ONLY if necessary and secure
}

/** Simulates locking/unlocking a user account */
export async function toggleUserLock(userId: string, lock: boolean): Promise<{ success: boolean; message: string }> {
    console.log(`Admin ${lock ? 'locking' : 'unlocking'} user ${userId}`);
    await new Promise(res => setTimeout(res, 80));

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: "User not found." };
    }
     if (mockUsers[userIndex].id === 'admin001' && lock) { // Prevent self-lock for demo admin
         return { success: false, message: "Cannot lock the primary admin account." };
     }

    mockUsers[userIndex].isLocked = lock;
     logAdminAudit('admin001', 'Admin User', lock ? 'User Locked' : 'User Unlocked', `${lock ? 'Locked' : 'Unlocked'} account for user ${userId}`);
    return { success: true, message: `User account ${lock ? 'locked' : 'unlocked'} successfully.` };
}

/** Simulates importing users from a file */
export async function importUsers(file: File): Promise<{ success: boolean; message: string; importedCount?: number; skippedCount?: number }> {
    console.log(`Admin importing users from file: ${file.name}`);
    await new Promise(res => setTimeout(res, 500)); // Simulate processing time

    // TODO: Implement file parsing (e.g., using papaparse for CSV)
    // Simulate results
    const importedCount = 50;
    const skippedCount = 3; // e.g., due to existing emails or invalid data
     logAdminAudit('admin001', 'Admin User', 'Users Imported', `Imported ${importedCount} users, skipped ${skippedCount} from file ${file.name}`);

    return { success: true, message: `Successfully imported ${importedCount} users, skipped ${skippedCount}.`, importedCount, skippedCount };
}


// --- Role Management ---

export interface Permission {
    id: string; // e.g., 'attendance:view:all'
    description: string;
}

export interface Role {
    id: string; // Unique role identifier (e.g., 'admin', 'hod_cs')
    name: string; // Display name (e.g., 'Administrator', 'HOD Computer Science')
    permissions: string[]; // Array of permission IDs
}

/** Simulates fetching all roles */
export async function getRoles(): Promise<Role[]> {
    console.log("Admin fetching roles");
    await new Promise(res => setTimeout(res, 80));
    return [...mockRoles]; // Return a copy
}

/** Simulates adding a new role */
export async function addRole(roleData: Omit<Role, 'permissions'> & { permissions: string[] }): Promise<{ success: boolean; message: string; role?: Role }> {
    console.log("Admin adding role:", roleData);
    await new Promise(res => setTimeout(res, 100));

    if (mockRoles.some(r => r.id === roleData.id)) {
        return { success: false, message: "Role with this ID already exists." };
    }
    const newRole: Role = { ...roleData };
    mockRoles.push(newRole);
     logAdminAudit('admin001', 'Admin User', 'Role Added', `Added role ${newRole.name} (${newRole.id})`);
    return { success: true, message: "Role added successfully.", role: newRole };
}

/** Simulates updating permissions for a role */
export async function updateRolePermissions(roleId: string, permissions: string[]): Promise<{ success: boolean; message: string; role?: Role }> {
    console.log(`Admin updating permissions for role ${roleId}`);
    await new Promise(res => setTimeout(res, 90));

    const roleIndex = mockRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
        return { success: false, message: "Role not found." };
    }
    mockRoles[roleIndex].permissions = permissions;
    logAdminAudit('admin001', 'Admin User', 'Role Permissions Updated', `Updated permissions for role ${roleId}`);
    return { success: true, message: "Role permissions updated successfully.", role: mockRoles[roleIndex] };
}

/** Simulates deleting a role */
export async function deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Admin deleting role ${roleId}`);
    await new Promise(res => setTimeout(res, 100));

    const roleIndex = mockRoles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
        return { success: false, message: "Role not found." };
    }
    // Check if any user has this role - prevent deletion if in use?
    if (mockUsers.some(u => u.role === roleId)) {
         return { success: false, message: "Cannot delete role as it is assigned to users." };
    }

     const deletedRoleName = mockRoles[roleIndex].name;
    mockRoles.splice(roleIndex, 1);
     logAdminAudit('admin001', 'Admin User', 'Role Deleted', `Deleted role ${deletedRoleName} (${roleId})`);
    return { success: true, message: "Role deleted successfully." };
}


// --- Module Configuration ---

export type AttendanceMethod = 'manual' | 'wifi' | 'geo-fence' | 'ultrasonic';

export interface ModuleConfig {
    id: string; // e.g., 'attendance', 'fees'
    name: string; // Display name
    description: string;
    enabled: boolean;
    locked?: boolean; // Added for emergency controls
    icon?: React.ReactNode; // For UI
    settings?: Record<string, any>; // Module-specific settings
}

/** Simulates fetching module configurations */
export async function getModuleConfigs(): Promise<ModuleConfig[]> {
    console.log("Admin fetching module configurations");
    await new Promise(res => setTimeout(res, 100));
    return [...mockModuleConfigs]; // Return copy
}

/** Simulates updating a module's configuration (enabled, locked, settings) */
export async function updateModuleConfig(moduleId: string, updates: Partial<ModuleConfig>): Promise<{ success: boolean; message: string; config?: ModuleConfig }> {
    console.log(`Admin updating config for module ${moduleId}:`, updates);
    await new Promise(res => setTimeout(res, 90));

    const configIndex = mockModuleConfigs.findIndex(m => m.id === moduleId);
    if (configIndex === -1) {
        return { success: false, message: "Module not found." };
    }

    // Merge updates carefully, especially nested settings
     const currentConfig = mockModuleConfigs[configIndex];
     const newSettings = updates.settings ? { ...currentConfig.settings, ...updates.settings } : currentConfig.settings;
     const updatedConfig = { ...currentConfig, ...updates, settings: newSettings };

    mockModuleConfigs[configIndex] = updatedConfig;

    // Determine the action for logging
    let logAction = 'Module Config Updated';
    let logDetails = `Updated configuration for module ${moduleId}. Fields: ${Object.keys(updates).join(', ')}`;
    if (updates.enabled !== undefined) {
        logAction = updates.enabled ? 'Module Enabled' : 'Module Disabled';
        logDetails = `${updates.enabled ? 'Enabled' : 'Disabled'} module ${moduleId}`;
    } else if (updates.locked !== undefined) {
        logAction = updates.locked ? 'Module Locked' : 'Module Unlocked';
        logDetails = `${updates.locked ? 'Locked' : 'Unlocked'} module ${moduleId}`;
    }

    logAdminAudit('admin001', 'Admin User', logAction, logDetails);
    return { success: true, message: "Module configuration updated.", config: updatedConfig };
}


// --- Audit Logs ---

export interface AuditLogEntryAdmin {
    id: string;
    timestamp: string; // ISO DateTime string
    userId: string;
    userName: string;
    action: string; // e.g., 'User Login', 'Document Uploaded', 'Settings Changed'
    details?: string; // Optional details (e.g., 'Document ID: doc-123')
    ipAddress?: string;
}

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    startDate?: string; // ISO Date string
    endDate?: string; // ISO Date string
    searchQuery?: string; // Search in details/action/user
}

/** Simulates fetching audit logs */
export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntryAdmin[]> {
    console.log("Admin fetching audit logs with filters:", filters);
    await new Promise(res => setTimeout(res, 250));

    let results = [...mockAuditLogs]; // Use copy

    if (filters?.startDate) {
        results = results.filter(log => new Date(log.timestamp) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
         // Add 1 day to endDate to make it inclusive
         const end = new Date(filters.endDate!);
         end.setDate(end.getDate() + 1);
        results = results.filter(log => new Date(log.timestamp) < end);
    }
    if (filters?.userId) {
        results = results.filter(log => log.userId === filters.userId);
    }
    if (filters?.action) {
        results = results.filter(log => log.action === filters.action);
    }
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(log =>
            log.userName.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query) ||
            log.details?.toLowerCase().includes(query) ||
            log.userId.toLowerCase().includes(query)
        );
    }

    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Simulates exporting audit logs to CSV */
export async function exportAuditLogsToCSV(filters?: AuditLogFilters): Promise<string> {
    console.log("Admin exporting audit logs to CSV with filters:", filters);
    const logs = await getAuditLogs(filters); // Reuse fetching logic
    await new Promise(res => setTimeout(res, 100)); // Simulate CSV generation

     if (!logs || logs.length === 0) return "ID,Timestamp,User ID,User Name,Action,Details,IP Address\n";

    const header = "ID,Timestamp,User ID,User Name,Action,Details,IP Address";
    const rows = logs.map(log =>
        [
            log.id,
            format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            log.userId,
            log.userName,
            log.action,
            log.details || '',
            log.ipAddress || ''
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
    );

    return `${header}\n${rows.join('\n')}`;
}

// --- Data Backup & Recovery ---

export type BackupType = 'manual' | 'automatic';
export type BackupTarget = 'cloud' | 'local';
export type BackupStatus = 'Completed' | 'Failed' | 'In Progress';

export interface BackupEntry {
    id: string;
    timestamp: string; // ISO DateTime string
    type: BackupType;
    target: BackupTarget;
    status: BackupStatus;
    size?: number; // Size in bytes
    downloadUrl?: string; // Optional URL if downloadable
}

export interface BackupSettings {
    frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
    target: BackupTarget;
    // Add retention policy, specific time, etc.
}

/** Simulates fetching backup history */
export async function getBackupHistory(): Promise<BackupEntry[]> {
    console.log("Admin fetching backup history");
    await new Promise(res => setTimeout(res, 150));
    return [...mockBackupHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Simulates creating a new manual backup */
export async function createBackup(): Promise<{ success: boolean; message: string; backup?: BackupEntry }> {
    console.log("Admin creating manual backup");
    await new Promise(res => setTimeout(res, 1000)); // Simulate backup time

    const settings = await getBackupSettings(); // Get current target setting
    const newBackup: BackupEntry = {
        id: `backup-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'manual',
        target: settings.target,
        status: 'Completed', // Simulate success
        size: Math.floor(Math.random() * 500 * 1024 * 1024) + 100 * 1024 * 1024, // Random size 100MB-600MB
    };
    mockBackupHistory.push(newBackup);
    logAdminAudit('admin001', 'Admin User', 'Manual Backup Created', `Created manual backup ${newBackup.id} to ${newBackup.target}`);
    return { success: true, message: "Manual backup created successfully.", backup: newBackup };
}

/** Simulates restoring from a backup */
export async function restoreFromBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Admin restoring from backup ${backupId}`);
    await new Promise(res => setTimeout(res, 2000)); // Simulate restore time

    const backup = mockBackupHistory.find(b => b.id === backupId);
    if (!backup || backup.status !== 'Completed') {
        return { success: false, message: "Invalid or incomplete backup selected." };
    }
    // In backend: perform restore operation
     logAdminAudit('admin001', 'Admin User', 'System Restore Initiated', `Initiated restore from backup ${backupId}`);
    return { success: true, message: "System restore initiated. This may take some time." };
}

/** Simulates fetching backup settings */
export async function getBackupSettings(): Promise<BackupSettings> {
    console.log("Admin fetching backup settings");
    await new Promise(res => setTimeout(res, 50));
    return { ...mockBackupSettings }; // Return copy
}

/** Simulates updating backup settings */
export async function updateBackupSettings(settings: BackupSettings): Promise<{ success: boolean; message: string }> {
    console.log("Admin updating backup settings:", settings);
    await new Promise(res => setTimeout(res, 90));

    mockBackupSettings.frequency = settings.frequency;
    mockBackupSettings.target = settings.target;
    logAdminAudit('admin001', 'Admin User', 'Backup Settings Updated', `Updated backup frequency to ${settings.frequency}, target to ${settings.target}`);
    return { success: true, message: "Backup settings updated successfully." };
}


// --- Broadcasts ---

export interface BroadcastTarget {
    type: 'all' | 'role' | 'department' | 'user';
    value: string; // 'all', role ID, department name, or comma-separated user IDs
}

export interface BroadcastMessage {
    id: string;
    title: string;
    message: string;
    target: BroadcastTarget;
    channels: ('in-app' | 'email' | 'sms')[];
    sentDate: string; // ISO DateTime string
    sentBy: { id: string; name: string }; // Admin who sent it
}

export interface BroadcastFilters {
    targetType?: BroadcastTarget['type'];
    startDate?: string; // ISO Date string
    endDate?: string; // ISO Date string
    searchQuery?: string; // Search title/message
}

/** Simulates fetching broadcast history */
export async function getBroadcasts(filters?: BroadcastFilters): Promise<BroadcastMessage[]> {
    console.log("Admin fetching broadcasts with filters:", filters);
    await new Promise(res => setTimeout(res, 120));

    let results = [...mockBroadcasts];

    if (filters?.startDate) {
        results = results.filter(b => new Date(b.sentDate) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
         const end = new Date(filters.endDate!);
         end.setDate(end.getDate() + 1);
        results = results.filter(b => new Date(b.sentDate) < end);
    }
     if (filters?.targetType) {
        results = results.filter(b => b.target.type === filters.targetType);
    }
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(b =>
            b.title.toLowerCase().includes(query) ||
            b.message.toLowerCase().includes(query)
        );
    }

    return results.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
}

/** Simulates sending a new broadcast */
export async function sendBroadcast(data: Omit<BroadcastMessage, 'id' | 'sentDate' | 'sentBy'>): Promise<{ success: boolean; message: string; broadcast?: BroadcastMessage }> {
    console.log("Admin sending broadcast:", data);
    await new Promise(res => setTimeout(res, 300)); // Simulate sending

    const newBroadcast: BroadcastMessage = {
        ...data,
        id: `bc-${Date.now()}`,
        sentDate: new Date().toISOString(),
        sentBy: { id: 'admin001', name: 'Admin User' }, // Assume current admin
    };
    mockBroadcasts.push(newBroadcast);
    logAdminAudit('admin001', 'Admin User', 'Broadcast Sent', `Sent broadcast "${data.title}" to ${data.target.type}: ${data.target.value}`);
    return { success: true, message: "Broadcast sent successfully.", broadcast: newBroadcast };
}

/** Simulates deleting a broadcast message */
export async function deleteBroadcast(broadcastId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Admin deleting broadcast ${broadcastId}`);
    await new Promise(res => setTimeout(res, 80));

     const index = mockBroadcasts.findIndex(b => b.id === broadcastId);
     if (index === -1) {
        return { success: false, message: "Broadcast message not found." };
    }
    mockBroadcasts.splice(index, 1);
    logAdminAudit('admin001', 'Admin User', 'Broadcast Deleted', `Deleted broadcast message ${broadcastId}`);
    return { success: true, message: "Broadcast deleted successfully." };
}


// --- Mock Data ---

let mockUsers: (AuthUser & { isLocked?: boolean })[] = [
    { id: 'student123', name: 'Alice Smith', email: 'alice.smith@campusconnect.edu', role: 'student', studentId: 'S12345', department: 'Computer Science', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/student123/100/100` },
    { id: 'student456', name: 'Bob Johnson', email: 'bob.j@campusconnect.edu', role: 'student', studentId: 'S67890', department: 'Physics', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/student456/100/100` },
    { id: 'student789', name: 'Charlie Brown', email: 'charlie.b@campusconnect.edu', role: 'student', studentId: 'S11223', department: 'Mathematics', isAuthenticated: true, isLocked: true, avatarUrl: `https://picsum.photos/seed/student789/100/100` }, // Locked example
    { id: 'faculty999', name: 'Dr. Alan Turing', email: 'alan.turing@campusconnect.edu', role: 'faculty', facultyId: 'F999', department: 'Computer Science', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/faculty999/100/100` },
    { id: 'faculty-phys', name: 'Dr. Marie Curie', email: 'marie.c@campusconnect.edu', role: 'faculty', facultyId: 'F101', department: 'Physics', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/faculty-phys/100/100` },
    { id: 'admin001', name: 'Admin User', email: 'admin@campusconnect.edu', role: 'admin', department: 'Administration', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/admin001/100/100` },
    { id: 'printcell007', name: 'Print Operator', email: 'print.cell@campusconnect.edu', role: 'print_cell', department: 'Printing Services', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/printcell007/100/100` },
    { id: 'clearance01', name: 'Clearance Officer Lib', email: 'library.clear@campusconnect.edu', role: 'clearance_officer', department: 'Library', isAuthenticated: true, isLocked: false, avatarUrl: `https://picsum.photos/seed/clearance01/100/100` }, // Example clearance officer role
];

let mockRoles: Role[] = [
    { id: 'admin', name: 'Administrator', permissions: ['admin:*', 'attendance:*', 'fees:*', 'clearance:*', 'documents:*'] }, // Wildcard simulation
    { id: 'faculty', name: 'Faculty', permissions: ['attendance:view:class', 'clearance:action:step', 'documents:upload', 'documents:view:general', 'documents:request:print', 'fees:view:own', 'attendance:view:own', 'clearance:view:own'] },
    { id: 'student', name: 'Student', permissions: ['attendance:mark', 'attendance:view:own', 'fees:view:own', 'clearance:submit:own', 'clearance:view:own', 'documents:view:general'] },
    { id: 'print_cell', name: 'Print Cell', permissions: ['documents:mark:printed', 'documents:view:approved'] }, // Need specific view permission
    { id: 'clearance_officer', name: 'Clearance Officer', permissions: ['clearance:action:step'] }, // Needs refinement based on dept
];

let mockModuleConfigs: ModuleConfig[] = [
    { id: 'attendance', name: 'Attendance', description: 'Manage student attendance records.', enabled: true, locked: false, settings: { attendanceMethod: 'wifi', requiredWifiSsid: 'Campus-WiFi', enableAbsentWarning: true } },
    { id: 'fees', name: 'Fee Management', description: 'Track student fee payments.', enabled: true, locked: false, settings: {} },
    { id: 'clearance', name: 'Clearance Tracker', description: 'Manage student clearance process.', enabled: true, locked: false, settings: {} },
    { id: 'documents', name: 'Document Workflow', description: 'Manage internal documents and printing.', enabled: true, locked: false, settings: { enableVersioning: true } },
    { id: 'notifications', name: 'Notifications', description: 'Send and manage system notifications.', enabled: true, locked: false, settings: {} },
];

let mockAuditLogs: AuditLogEntryAdmin[] = [
    // Populate with more realistic sample log entries
    { id: 'log1', timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), userId: 'admin001', userName: 'Admin User', action: 'User Login', ipAddress: '192.168.1.100' },
    { id: 'log2', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), userId: 'faculty999', userName: 'Dr. Alan Turing', action: 'Document Uploaded', details: 'Uploaded CS101_Midterm_Fall24.pdf', ipAddress: '10.0.0.5' },
    { id: 'log3', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), userId: 'student123', userName: 'Alice Smith', action: 'Attendance Marked', details: 'Marked present for CS101', ipAddress: '172.16.0.50' },
     { id: 'log4', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), userId: 'admin001', userName: 'Admin User', action: 'Fee Payment Added', details: 'Added payment of $1000 for student456', ipAddress: '192.168.1.100' },
     { id: 'log5', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), userId: 'admin001', userName: 'Admin User', action: 'Module Config Updated', details: 'Enabled absence warnings for Attendance module', ipAddress: '192.168.1.100' },
     { id: 'log6', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), userId: 'admin001', userName: 'Admin User', action: 'Automatic Backup Created', details: 'Daily backup to cloud completed.', ipAddress: 'System' },
];

let mockBackupHistory: BackupEntry[] = [
    { id: 'backup-1', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'automatic', target: 'cloud', status: 'Completed', size: 350 * 1024 * 1024 },
    { id: 'backup-2', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'automatic', target: 'cloud', status: 'Completed', size: 345 * 1024 * 1024 },
     { id: 'backup-3', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'manual', target: 'local', status: 'Failed', size: 0 },
];

let mockBackupSettings: BackupSettings = {
    frequency: 'daily',
    target: 'cloud',
};

let mockBroadcasts: BroadcastMessage[] = [
     { id: 'bc-1', title: 'Campus Network Maintenance', message: 'The campus Wi-Fi will be down for maintenance tonight from 1 AM to 3 AM.', target: { type: 'all', value: 'all' }, channels: ['in-app', 'email'], sentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), sentBy: { id: 'admin001', name: 'Admin User' } },
     { id: 'bc-2', title: 'Physics Dept Meeting', message: 'Mandatory meeting for all Physics faculty on Friday at 2 PM in Room 401.', target: { type: 'department', value: 'Physics' }, channels: ['in-app', 'email'], sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), sentBy: { id: 'admin001', name: 'Admin User' } },
];


// Helper to add admin audit logs
function logAdminAudit(userId: string, userName: string, action: string, details?: string) {
    mockAuditLogs.push({
        id: `log${mockAuditLogs.length + 1}`,
        timestamp: new Date().toISOString(),
        userId,
        userName,
        action,
        details,
        ipAddress: '127.0.0.1', // Simulate local admin action
    });
}

    