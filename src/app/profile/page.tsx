import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, User, MapPin, Edit } from "lucide-react";

// TODO: Replace with actual data fetching based on logged-in user
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string; // e.g., 'Student', 'Faculty', 'Admin'
  studentId?: string; // Optional: Only for students
  department?: string; // Optional: For faculty/students
  phone?: string;
  address?: string;
  avatarUrl: string;
}

const sampleUserProfile: UserProfile = {
  id: 'admin1',
  name: "Admin User",
  email: "admin@campusconnect.edu",
  role: "Administrator",
  phone: "+1 234 567 890",
  address: "123 College Ave, Admin Building, Campus City",
  avatarUrl: "https://picsum.photos/100/100?random=1",
  department: "IT Department"
};

export default async function ProfilePage() {
  // In a real app, fetch user profile based on authentication
  const user = sampleUserProfile;
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">My Profile</h1>

      <Card className="overflow-hidden transform transition-transform duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-col items-center gap-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile picture large"/>
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="text-muted-foreground">{user.role}{user.department ? ` - ${user.department}` : ''}</CardDescription>
            {user.studentId && <p className="text-sm text-muted-foreground">ID: {user.studentId}</p>}
          </div>
           <Button variant="outline" size="icon" className="ml-auto absolute top-4 right-4 sm:static">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
           </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <h3 className="text-lg font-semibold mb-2 border-b pb-1">Contact Information</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<Mail className="text-primary"/>} label="Email" value={user.email} />
                {user.phone && <InfoItem icon={<Phone className="text-secondary"/>} label="Phone" value={user.phone} />}
                {user.address && <InfoItem icon={<MapPin className="text-accent"/>} label="Address" value={user.address} />}
           </div>

            {/* Add more sections as needed, e.g., Academic Information, Emergency Contact */}

        </CardContent>
      </Card>
    </div>
  );
}


interface InfoItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-foreground">{value}</p>
            </div>
        </div>
    )
}
