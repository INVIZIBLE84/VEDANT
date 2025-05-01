
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ToggleLeft, ToggleRight, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getModuleConfigs, updateModuleConfig, type ModuleConfig, type AttendanceMethod } from "@/services/admin"; // Import module service functions
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminModulesPage() {
    const { toast } = useToast();
    const [moduleConfigs, setModuleConfigs] = React.useState<ModuleConfig[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [pendingChanges, setPendingChanges] = React.useState<Record<string, Partial<ModuleConfig>>>({});

    // Fetch module configurations on mount
    React.useEffect(() => {
        const fetchConfigs = async () => {
            setIsLoading(true);
            try {
                const configs = await getModuleConfigs();
                setModuleConfigs(configs);
            } catch (error) {
                console.error("Error fetching module configurations:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not fetch module configurations." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfigs();
    }, [toast]);

     const handleConfigChange = (moduleId: string, key: keyof ModuleConfig, value: any) => {
        setPendingChanges(prev => ({
            ...prev,
            [moduleId]: {
                ...(prev[moduleId] || {}),
                [key]: value,
            },
        }));

         // Also update the local state for immediate UI feedback
         setModuleConfigs(prevConfigs =>
            prevConfigs.map(config =>
                config.id === moduleId ? { ...config, [key]: value } : config
            )
        );
    };

     const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
             // In a real app, send only pendingChanges to the backend
             console.log("Saving changes:", pendingChanges);
             // Simulate multiple updates or a batch update
             for (const moduleId in pendingChanges) {
                const updates = pendingChanges[moduleId];
                // Example: Update each module config individually
                 await updateModuleConfig(moduleId, updates);
                 // In a real backend, you might have a batch update endpoint
            }

             toast({ title: "Success", description: "Module configurations updated successfully." });
             setPendingChanges({}); // Clear pending changes after successful save
        } catch (error: any) {
             console.error("Error saving module configurations:", error);
             toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save configurations." });
              // TODO: Optionally revert local state changes on error
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><Settings /> Module Configuration</h1>
                <Button onClick={handleSaveChanges} disabled={isSaving || Object.keys(pendingChanges).length === 0}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Manage Modules</CardTitle>
                    <CardDescription>Enable, disable, and configure system modules.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                     {isLoading ? (
                        // Skeleton Loader
                        Array.from({ length: 4 }).map((_, i) => (
                             <Card key={i} className="p-4 animate-pulse">
                                 <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-32 rounded" />
                                    <Skeleton className="h-6 w-12 rounded-full" />
                                 </div>
                                 <div className="mt-4 space-y-3">
                                     <Skeleton className="h-4 w-48 rounded" />
                                     <Skeleton className="h-4 w-64 rounded" />
                                 </div>
                             </Card>
                        ))
                     ) : moduleConfigs.length > 0 ? (
                         moduleConfigs.map((config) => (
                             <Card key={config.id} className="p-4 border shadow-sm">
                                 <div className="flex items-center justify-between">
                                     <Label htmlFor={`switch-${config.id}`} className="text-lg font-semibold flex items-center gap-2">
                                        {config.icon || <Settings className="h-5 w-5 text-muted-foreground" />} {config.name}
                                     </Label>
                                     <Switch
                                         id={`switch-${config.id}`}
                                         checked={config.enabled}
                                         onCheckedChange={(checked) => handleConfigChange(config.id, 'enabled', checked)}
                                         aria-label={`Enable ${config.name} module`}
                                      />
                                 </div>
                                 <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

                                 {/* Module-Specific Settings */}
                                  <div className={`mt-4 space-y-3 transition-opacity duration-300 ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                     {config.id === 'attendance' && (
                                         <div className="grid w-full max-w-sm items-center gap-1.5">
                                             <Label htmlFor={`attendance-method-${config.id}`}>Attendance Method</Label>
                                             <Select
                                                 value={config.settings?.attendanceMethod}
                                                 onValueChange={(value) => handleConfigChange(config.id, 'settings', { ...config.settings, attendanceMethod: value as AttendanceMethod })}
                                                 disabled={!config.enabled}
                                             >
                                                <SelectTrigger id={`attendance-method-${config.id}`}>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="manual">Manual Button Click</SelectItem>
                                                     <SelectItem value="wifi">Wi-Fi SSID Check</SelectItem>
                                                     <SelectItem value="geo-fence">Geo-fencing (GPS)</SelectItem>
                                                     <SelectItem value="ultrasonic">Ultrasonic Proximity</SelectItem>
                                                </SelectContent>
                                            </Select>
                                             <p className="text-xs text-muted-foreground">Select how attendance is verified.</p>
                                             {/* Add Wi-Fi SSID input if wifi is selected */}
                                             {config.settings?.attendanceMethod === 'wifi' && (
                                                 <div className="mt-2">
                                                     <Label htmlFor={`wifi-ssid-${config.id}`}>Required Wi-Fi SSID</Label>
                                                     <Input
                                                         id={`wifi-ssid-${config.id}`}
                                                         value={config.settings?.requiredWifiSsid || ''}
                                                         onChange={(e) => handleConfigChange(config.id, 'settings', { ...config.settings, requiredWifiSsid: e.target.value })}
                                                         placeholder="e.g., Campus-WiFi"
                                                         disabled={!config.enabled}
                                                     />
                                                 </div>
                                             )}
                                             <div className="flex items-center space-x-2 mt-2">
                                                <Switch
                                                     id={`attendance-warning-${config.id}`}
                                                     checked={config.settings?.enableAbsentWarning}
                                                     onCheckedChange={(checked) => handleConfigChange(config.id, 'settings', { ...config.settings, enableAbsentWarning: checked })}
                                                     disabled={!config.enabled}
                                                />
                                                <Label htmlFor={`attendance-warning-${config.id}`}>Enable Absence Warning System</Label>
                                            </div>
                                         </div>
                                     )}
                                      {config.id === 'documents' && (
                                          <div className="space-y-2">
                                               <div className="flex items-center space-x-2">
                                                    <Switch
                                                         id={`doc-versioning-${config.id}`}
                                                         checked={config.settings?.enableVersioning}
                                                         onCheckedChange={(checked) => handleConfigChange(config.id, 'settings', { ...config.settings, enableVersioning: checked })}
                                                         disabled={!config.enabled}
                                                    />
                                                    <Label htmlFor={`doc-versioning-${config.id}`}>Enable Document Versioning</Label>
                                                </div>
                                               {/* Add more document settings like allowed file types, size limits */}
                                          </div>
                                      )}
                                      {/* Add settings for other modules here */}
                                 </div>
                             </Card>
                         ))
                     ) : (
                        <p className="text-center text-muted-foreground py-6">No module configurations found.</p>
                     )}
                 </CardContent>
            </Card>
        </div>
    );
}
