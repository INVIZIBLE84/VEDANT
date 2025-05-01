
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChartBig, Download, Filter, Calendar as CalendarIcon, Loader2, Users, AlertTriangle, DollarSign, FileCheck, BrainCircuit } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
    getAttendanceAnalytics,
    getFeeAnalytics,
    getClearanceAnalytics,
    getStudentBehaviorAnalytics,
    exportAnalyticsReport,
    type AttendanceAnalytics,
    type FeeAnalytics,
    type ClearanceAnalytics,
    type StudentBehaviorAnalytics,
    type AnalyticsFilters,
    type ReportType
} from "@/services/analytics";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const BEHAVIOR_COLORS: Record<string, string> = {
    'Regular': 'hsl(var(--chart-1))',
    'At Risk': 'hsl(var(--chart-4))',
    'Critical': 'hsl(var(--chart-2))', // Use chart-2 for critical (often red-like)
};

export default function AdminAnalyticsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState<ReportType>("attendance");
    const [isLoading, setIsLoading] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);

    // Filter State
    const [filters, setFilters] = React.useState<AnalyticsFilters>({});
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

    // Data State
    const [attendanceData, setAttendanceData] = React.useState<AttendanceAnalytics | null>(null);
    const [feeData, setFeeData] = React.useState<FeeAnalytics | null>(null);
    const [clearanceData, setClearanceData] = React.useState<ClearanceAnalytics | null>(null);
    const [behaviorData, setBehaviorData] = React.useState<StudentBehaviorAnalytics[]>([]);

    // Fetch data when tab or filters change
    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const effectiveFilters: AnalyticsFilters = {
                ...filters,
                startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            };
            try {
                switch (activeTab) {
                    case 'attendance':
                        setAttendanceData(await getAttendanceAnalytics(effectiveFilters));
                        break;
                    case 'fees':
                        setFeeData(await getFeeAnalytics(effectiveFilters));
                        break;
                    case 'clearance':
                        setClearanceData(await getClearanceAnalytics(effectiveFilters));
                        break;
                    case 'behavior':
                        setBehaviorData(await getStudentBehaviorAnalytics(effectiveFilters));
                        break;
                }
            } catch (error) {
                console.error(`Error fetching ${activeTab} analytics:`, error);
                toast({ variant: "destructive", title: "Error", description: `Could not load ${activeTab} analytics.` });
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce or fetch immediately? Fetch immediately for now.
        fetchData();
    }, [activeTab, filters, dateRange, toast]);

    const handleFilterChange = (key: keyof AnalyticsFilters, value: string | undefined) => {
        setFilters(prev => ({ ...prev, [key]: value === 'all' || value === '' ? undefined : value }));
    };

    const handleExport = async () => {
         setIsExporting(true);
         toast({ title: "Exporting...", description: `Generating ${activeTab} report.` });
         try {
              const effectiveFilters: AnalyticsFilters = {
                 ...filters,
                 startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                 endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
             };
             const csvData = await exportAnalyticsReport(activeTab, effectiveFilters);
             const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
             const link = document.createElement("a");
             const url = URL.createObjectURL(blob);
             link.setAttribute("href", url);
             link.setAttribute("download", `${activeTab}_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
             link.style.visibility = 'hidden';
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             toast({ title: "Success", description: `${activeTab} report exported.` });
         } catch (error: any) {
             console.error("Error exporting report:", error);
             toast({ variant: "destructive", title: "Export Failed", description: error.message || "Could not export report." });
         } finally {
            setIsExporting(false);
         }
     };

     // Chart configurations
     const attendanceChartConfig = {
       present: { label: "Present", color: "hsl(var(--chart-1))" },
       absent: { label: "Absent", color: "hsl(var(--chart-4))" },
     } satisfies Record<string, any>;

     const feeChartConfig = {
       collected: { label: "Collected", color: "hsl(var(--chart-1))" },
       due: { label: "Due", color: "hsl(var(--chart-2))" },
     } satisfies Record<string, any>;

     const clearanceChartConfig = {
        Pending: { label: "Pending", color: "hsl(var(--chart-4))" },
        'In Progress': { label: "In Progress", color: "hsl(var(--chart-5))" },
        Approved: { label: "Approved", color: "hsl(var(--chart-1))" },
        Rejected: { label: "Rejected", color: "hsl(var(--chart-2))" },
     } satisfies Record<string, any>;

      const behaviorChartConfig = {
        Regular: { label: "Regular", color: BEHAVIOR_COLORS['Regular'] },
        'At Risk': { label: "At Risk", color: BEHAVIOR_COLORS['At Risk'] },
        Critical: { label: "Critical", color: BEHAVIOR_COLORS['Critical'] },
     } satisfies Record<string, any>;

    const renderContent = () => {
        if (isLoading) {
            return <AnalyticsSkeleton />;
        }

        switch (activeTab) {
            case 'attendance':
                return attendanceData ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard title="Overall Attendance" value={`${attendanceData.overallPercentage}%`} icon={<BarChartBig className="text-primary" />} />
                        <SummaryCard title="Students At Risk" value={attendanceData.atRiskCount.toString()} icon={<AlertTriangle className="text-yellow-500" />} />
                        <SummaryCard title="Critical Attendance" value={attendanceData.criticalCount.toString()} icon={<AlertTriangle className="text-red-500" />} />
                        <div className="md:col-span-2 lg:col-span-4">
                            <ChartCard title="Attendance Trend" description="Daily presence over selected period">
                                <ChartContainer config={attendanceChartConfig} className="h-[300px] w-full">
                                    <BarChart data={attendanceData.trendData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM d')} tickLine={false} axisLine={false} />
                                        <YAxis />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="present" fill="var(--color-present)" radius={4} />
                                        <Bar dataKey="absent" fill="var(--color-absent)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </div>
                ) : <NoData />;
            case 'fees':
                 return feeData ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard title="Total Collected" value={`$${feeData.totalCollected.toLocaleString()}`} icon={<DollarSign className="text-green-500" />} />
                        <SummaryCard title="Current Balance Due" value={`$${feeData.totalDueCurrent.toLocaleString()}`} icon={<DollarSign className="text-red-500" />} />
                        <SummaryCard title="Overdue Count" value={feeData.overdueCount.toString()} icon={<AlertTriangle className="text-orange-500" />} />
                         <div className="md:col-span-2 lg:col-span-4">
                            <ChartCard title="Fee Collection Trend" description="Monthly fee collection vs. dues">
                                <ChartContainer config={feeChartConfig} className="h-[300px] w-full">
                                    <LineChart data={feeData.collectionTrend}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="period" tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="due" stroke="var(--color-due)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </div>
                ) : <NoData />;
            case 'clearance':
                const clearancePieData = clearanceData ? Object.entries(clearanceData.statusCounts).map(([name, value]) => ({ name, value })) : [];
                 return clearanceData ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard title="Avg. Completion" value={`${clearanceData.averageCompletionDays.toFixed(1)} days`} icon={<FileCheck className="text-blue-500" />} />
                        <SummaryCard title="Completion Rate" value={`${clearanceData.completionRate}%`} icon={<FileCheck className="text-green-500" />} />
                         <SummaryCard title="Bottleneck Dept." value={clearanceData.bottleneckDepartment || 'N/A'} icon={<AlertTriangle className="text-orange-500" />} />
                        <div className="md:col-span-2 lg:col-span-4">
                             <ChartCard title="Clearance Status Distribution" description="Current status breakdown of all requests">
                                <ChartContainer config={clearanceChartConfig} className="h-[300px] w-full">
                                     <PieChart>
                                         <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                         <Pie data={clearancePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                             {clearancePieData.map((entry, index) => (
                                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                             ))}
                                         </Pie>
                                         <ChartLegend content={<ChartLegendContent />} />
                                     </PieChart>
                                </ChartContainer>
                             </ChartCard>
                        </div>
                    </div>
                 ) : <NoData />;
            case 'behavior':
                 const behaviorCounts = behaviorData.reduce((acc, student) => {
                    acc[student.classification] = (acc[student.classification] || 0) + 1;
                    return acc;
                }, {} as Record<StudentBehaviorClassification, number>);
                const behaviorPieData = Object.entries(behaviorCounts).map(([name, value]) => ({ name: name as StudentBehaviorClassification, value }));

                 return behaviorData.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                         <ChartCard title="Student Behavior Classification" description="ML-based classification of students">
                            <ChartContainer config={behaviorChartConfig} className="h-[250px] w-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={behaviorPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {behaviorPieData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={BEHAVIOR_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                     <ChartLegend content={<ChartLegendContent />} />
                                </PieChart>
                            </ChartContainer>
                         </ChartCard>
                         <Card>
                            <CardHeader><CardTitle>High-Risk Students (Dropout Prediction)</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2 max-h-[250px] overflow-y-auto">
                                     {behaviorData.filter(s => s.classification === 'Critical' || (s.dropoutPrediction && s.dropoutPrediction > 0.2)).slice(0, 10).map(s => (
                                        <li key={s.studentId} className="text-sm flex justify-between border-b pb-1">
                                             <span>{s.studentName} ({s.studentId}) - {s.department}</span>
                                             <span className="font-semibold text-red-600">{(s.dropoutPrediction ?? 0 * 100).toFixed(1)}% Risk</span>
                                         </li>
                                     ))}
                                </ul>
                            </CardContent>
                         </Card>
                         {/* Add more behavior analytics cards/tables */}
                    </div>
                 ) : <NoData />;
            default:
                return <NoData />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><BarChartBig /> Analytics & Reporting</h1>
                 <Button onClick={handleExport} disabled={isExporting || isLoading}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                     Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report
                 </Button>
            </div>

            {/* Filters */}
             <Card>
                 <CardHeader>
                    <CardTitle>Filters</CardTitle>
                 </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {/* Department Filter */}
                     <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                         <SelectTrigger className="w-full sm:w-[180px]">
                             <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                             <SelectValue placeholder="Filter by Department" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="all">All Departments</SelectItem>
                             <SelectItem value="Computer Science">Computer Science</SelectItem>
                             <SelectItem value="Physics">Physics</SelectItem>
                             <SelectItem value="Mathematics">Mathematics</SelectItem>
                             {/* Add more departments */}
                         </SelectContent>
                     </Select>
                     {/* Semester Filter */}
                     <Select value={filters.semester} onValueChange={(value) => handleFilterChange('semester', value)}>
                         <SelectTrigger className="w-full sm:w-[180px]">
                              <Filter className="h-4 w-4 mr-1 text-muted-foreground inline-block"/>
                             <SelectValue placeholder="Filter by Semester" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="all">All Semesters</SelectItem>
                             <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                             <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                             {/* Add more semesters */}
                         </SelectContent>
                     </Select>
                     {/* Date Range Picker */}
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date-range"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal sm:w-[300px]",
                                !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                         </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={() => { setFilters({}); setDateRange(undefined); }}>Clear Filters</Button>
                </CardContent>
             </Card>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} defaultValue="attendance">
                <TabsList className="grid w-full grid-cols-2 md:w-fit md:grid-cols-4">
                    <TabsTrigger value="attendance"><Users className="mr-1 h-4 w-4" />Attendance</TabsTrigger>
                    <TabsTrigger value="fees"><DollarSign className="mr-1 h-4 w-4" />Fees</TabsTrigger>
                    <TabsTrigger value="clearance"><FileCheck className="mr-1 h-4 w-4" />Clearance</TabsTrigger>
                    <TabsTrigger value="behavior"><BrainCircuit className="mr-1 h-4 w-4" />Behavior</TabsTrigger>
                </TabsList>

                <TabsContent value="attendance" className="mt-4">{renderContent()}</TabsContent>
                <TabsContent value="fees" className="mt-4">{renderContent()}</TabsContent>
                <TabsContent value="clearance" className="mt-4">{renderContent()}</TabsContent>
                <TabsContent value="behavior" className="mt-4">{renderContent()}</TabsContent>
            </Tabs>
        </div>
    );
}

// --- Helper Components ---

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}


function NoData() {
    return (
        <Card className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No data available for the selected filters.</p>
        </Card>
    );
}

function AnalyticsSkeleton() {
    return (
         <div className="space-y-6 animate-pulse">
             {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card><CardHeader><Skeleton className="h-4 w-20 rounded" /></CardHeader><CardContent><Skeleton className="h-8 w-16 rounded" /></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-4 w-24 rounded" /></CardHeader><CardContent><Skeleton className="h-8 w-12 rounded" /></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-4 w-28 rounded" /></CardHeader><CardContent><Skeleton className="h-8 w-10 rounded" /></CardContent></Card>
             </div>
             {/* Chart Card */}
            <Card>
                 <CardHeader>
                     <Skeleton className="h-6 w-1/3 rounded" />
                     <Skeleton className="h-4 w-1/2 rounded" />
                 </CardHeader>
                 <CardContent>
                     <Skeleton className="h-[300px] w-full rounded" />
                 </CardContent>
            </Card>
         </div>
    );
}
