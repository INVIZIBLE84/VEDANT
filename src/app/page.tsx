import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>

      {/* 3D Info Panels Section */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InfoPanel
          title="Attendance"
          description="View your attendance records"
          icon={<BarChart3 className="text-primary" />}
          link="/attendance"
        />
        <InfoPanel
          title="Fee Management"
          description="Check fee status and payments"
          icon={<DollarSign className="text-secondary" />}
          link="/fees"
        />
        <InfoPanel
          title="Clearance Status"
          description="Track your clearance requests"
          icon={<CheckCircle className="text-accent" />}
          link="/clearance"
        />
      </section>

      {/* Floating Cards Section */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <FloatingCard
          title="My Profile"
          description="View and edit your profile"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          link="/profile"
        />
        <FloatingCard
          title="Documents"
          description="Access shared documents"
          icon={<FileText className="text-secondary" />}
          link="/documents"
        />
         <FloatingCard
          title="Course Schedule"
          description="View your class schedule"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>}
          link="/schedule"
        />
        <FloatingCard
          title="Notifications"
          description="Check recent notifications"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>}
          link="/notifications"
        />
      </section>
    </div>
  );
}

// Component for 3D-style Info Panels
interface InfoPanelProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

function InfoPanel({ title, description, icon, link }: InfoPanelProps) {
  return (
    <Link href={link}>
      <Card className="group transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl" style={{ perspective: '1000px' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="transform transition-transform duration-300 group-hover:rotate-y-12">{icon}</div>
        </CardHeader>
        <CardContent style={{ transformStyle: 'preserve-3d' }}>
          <p className="text-sm text-muted-foreground transform transition-transform duration-300 group-hover:translate-z-4">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}


// Component for Floating Cards
interface FloatingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

function FloatingCard({ title, description, icon, link }: FloatingCardProps) {
  return (
     <Link href={link}>
      <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-card/90 border-2 border-transparent hover:border-accent">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
           <div className="p-2 bg-primary/10 rounded-full group-hover:bg-accent/20 transition-colors duration-300">{icon}</div>
           <CardTitle className="text-md font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
