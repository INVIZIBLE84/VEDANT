
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Settings, FileText, DatabaseZap, Activity, BellRing, BarChartBig } from "lucide-react"; // Added BarChartBig
import Link from "next/link";
import { AuthUser, getCurrentUser, UserRole } from "@/types/user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// TODO: Fetch real data from admin service
interface DashboardMetrics {
    totalUsers: number;
    activeModules: number;
    pendingActions: number;
    serverHealth: 'Online' | 'Degraded' | 'Offline';
    storageUsage: number; // Percentage
}

// Mock metrics
const mockMetrics: DashboardMetrics = {
    totalUsers: 1523,
    activeModules: 5,
    pendingActions: 12, // e.g., clearance approvals, print requests
    serverHealth: 'Online',
    storageUsage: 65,
};


export default function AdminDashboardPage() {
    const [user, setUser] = React.useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);

    React.useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            // Simulate fetching metrics
            await new Promise(res => setTimeout(res, 300));
            setMetrics(mockMetrics);
            setIsLoading(false);
        };
        initialize();
    }, []);

    if (isLoading) {
        return <AdminDashboardSkeleton />;
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="space-y-6">
                 <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to access the admin dashboard.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>

            {/* Summary Metrics Section */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Users"
                    value={metrics?.totalUsers.toLocaleString() ?? '...'}
                    icon={<Users className="text-primary" />}
                    link="/admin/users"
                    linkText="Manage Users"
                />
                <SummaryCard
                    title="Active Modules"
                    value={metrics?.activeModules.toString() ?? '...'}
                    icon={<Settings className="text-secondary" />}
                     link="/admin/modules"
                     linkText="Configure Modules"
                />
                <SummaryCard
                    title="Pending Actions"
                    value={metrics?.pendingActions.toString() ?? '...'}
                    icon={<BellRing className="text-yellow-500" />}
                    description="Approvals, requests, etc."
                    // Link could go to a specific 'actions needed' page or individual modules
                />
                 <SummaryCard
                    title="System Health"
                    value={metrics?.serverHealth ?? '...'}
                    icon={<Activity className={` ${metrics?.serverHealth === 'Online' ? 'text-green-500' : 'text-red-500'}`} />}
                    description={`Storage: ${metrics?.storageUsage ?? '...'}%`}
                    // Link could go to a monitoring page
                />
            </section>

            {/* Quick Access Links Section */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 <QuickAccessCard
                    title="User Management"
                    icon={<Users />}
                    link="/admin/users"
                    description="Add, edit, and manage user accounts and roles."
                 />
                 <QuickAccessCard
                    title="Role & Permissions"
                    icon={<ShieldCheck />}
                    link="/admin/roles"
                    description="Define roles and control access permissions."
                 />
                 <QuickAccessCard
                    title="Module Configuration"
                    icon={<Settings />}
                    link="/admin/modules"
                    description="Enable/disable modules and set configurations."
                 />
                  <QuickAccessCard
                    title="Analytics & Reports"
                    icon={<BarChartBig />}
                    link="/admin/analytics"
                    description="View insights and generate reports."
                 />
                 <QuickAccessCard
                    title="Audit Logs"
                    icon={<FileText />}
                    link="/admin/logs"
                    description="Monitor user activities and system events."
                 />
                 <QuickAccessCard
                    title="Backups"
                    icon={<DatabaseZap />}
                    link="/admin/backups"
                    description="Manage data backups and restoration points."
                 />
                 <QuickAccessCard
                    title="Broadcasts"
                    icon={<BellRing />}
                    link="/admin/broadcasts"
                    description="Send notifications and announcements."
                 />
            </section>
        </div>
    );
}

// Component for Summary Cards
interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    description?: string;
    link?: string;
    linkText?: string;
}

function SummaryCard({ title, value, icon, description, link, linkText }: SummaryCardProps) {
    const content = (
        <Card className="group transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ perspective: '1000px' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="transform transition-transform duration-300 group-hover:scale-110">{icon}</div>
            </CardHeader>
            <CardContent style={{ transformStyle: 'preserve-3d' }}>
                <div className="text-2xl font-bold transform transition-transform duration-300 group-hover:translate-z-2">{value}</div>
                {description && <p className="text-xs text-muted-foreground transform transition-transform duration-300 group-hover:translate-z-4">{description}</p>}
                {link && linkText && (
                    <Link href={link} className="text-xs text-accent hover:underline mt-2 block">
                        {linkText}
                    </Link>
                )}
            </CardContent>
        </Card>
    );

    return link ? <Link href={link}>{content}</Link> : content;
}


// Component for Quick Access Links
interface QuickAccessCardProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    link: string;
}

function QuickAccessCard({ title, icon, description, link }: QuickAccessCardProps) {
  return (
     <Link href={link}>
      <Card className="group transform transition-all duration-300 hover:scale-102 hover:shadow-lg hover:bg-card/90 border-2 border-transparent hover:border-secondary">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
           <div className="p-3 bg-secondary/10 rounded-lg text-secondary group-hover:bg-accent/20 group-hover:text-accent-foreground transition-colors duration-300">{icon}</div>
           <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton Loader for Admin Dashboard
function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <Skeleton className="h-8 w-1/3 rounded" /> {/* Title */}

            {/* Summary Cards Skeleton */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-20 rounded" />
                            <Skeleton className="h-6 w-6 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-16 rounded mb-1" />
                            <Skeleton className="h-3 w-24 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </section>

             {/* Quick Access Cards Skeleton */}
             <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {Array.from({ length: 7 }).map((_, i) => ( // Adjusted length to 7 for the new card
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                           <Skeleton className="h-12 w-12 rounded-lg" />
                           <Skeleton className="h-6 w-32 rounded" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-4/5 rounded" />
                        </CardContent>
                      </Card>
                 ))}
            </section>
        </div>
    );
}
