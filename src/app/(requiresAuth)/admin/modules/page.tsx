
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ToggleLeft, ToggleRight, Loader2, Save, Lock, Unlock, Wifi, MapPin, RadioTower } from "lucide-react"; // Added icons
import { useToast } from "@/hooks/use-toast";
import { getModuleConfigs, updateModuleConfig, type ModuleConfig, type AttendanceMethod } from "@/services/admin"; // Import module service functions
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"; // Added Input

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
         // For nested settings, ensure we merge correctly
         if (key === 'settings' && typeof value === 'object' && value !== null) {
              const currentConfig = moduleConfigs.find(config => config.id === moduleId);
              const currentSettings = currentConfig?.settings || {};
              const updatedSettings = { ...currentSettings, ...value };

              setPendingChanges(prev => ({
                 ...prev,
                 [moduleId]: {
                     ...(prev[moduleId] || {}),
                     settings: updatedSettings,
                 },
              }));

               setModuleConfigs(prevConfigs =>
                  prevConfigs.map(config =>
                      config.id === moduleId ? { ...config, settings: updatedSettings } : config
                  )
              );

         } else {
              setPendingChanges(prev => ({
                  ...prev,
                  [moduleId]: {
                      ...(prev[moduleId] || {}),
                      [key]: value,
                  },
              }));

              setModuleConfigs(prevConfigs =>
                  prevConfigs.map(config =>
                      config.id === moduleId ? { ...config, [key]: value } : config
                  )
              );
         }
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
                    <CardDescription>Enable, disable, lock, and configure system modules.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                     {isLoading ? (
                        // Skeleton Loader
                        Array.from({ length: 4 }).map((_, i) => (
                             <Card key={i} className="p-4 animate-pulse">
                                 <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-32 rounded" />
                                     <div className="flex gap-2">
                                        <Skeleton className="h-6 w-12 rounded-full" />
                                        <Skeleton className="h-6 w-12 rounded-full" />
                                     </div>
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
                                      <div className="flex items-center space-x-2">
                                          {/* Lock Switch */}
                                          <div className="flex items-center space-x-1" title={config.locked ? 'Module Locked (Emergency)' : 'Module Unlocked'}>
                                            <Switch
                                                 id={`lock-switch-${config.id}`}
                                                 checked={!!config.locked} // Ensure boolean
                                                 onCheckedChange={(checked) => handleConfigChange(config.id, 'locked', checked)}
                                                 aria-label={`Lock ${config.name} module`}
                                                 className="data-[state=checked]:bg-destructive" // Red when locked
                                             />
                                              {config.locked ? <Lock className="h-4 w-4 text-destructive"/> : <Unlock className="h-4 w-4 text-muted-foreground"/>}
                                          </div>
                                          {/* Enable Switch */}
                                          <div className="flex items-center space-x-1" title={config.enabled ? 'Module Enabled' : 'Module Disabled'}>
                                             <Switch
                                                 id={`switch-${config.id}`}
                                                 checked={config.enabled}
                                                 onCheckedChange={(checked) => handleConfigChange(config.id, 'enabled', checked)}
                                                 aria-label={`Enable ${config.name} module`}
                                                 disabled={!!config.locked} // Ensure boolean, disable if locked
                                              />
                                               {config.enabled ? <ToggleRight className="h-4 w-4 text-green-500"/> : <ToggleLeft className="h-4 w-4 text-muted-foreground"/>}
                                          </div>
                                      </div>
                                 </div>
                                 <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

                                 {/* Module-Specific Settings */}
                                  <div className={`mt-4 space-y-3 transition-opacity duration-300 ${config.enabled && !config.locked ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                     {config.id === 'attendance' && (
                                         <div className="grid w-full max-w-sm items-center gap-1.5">
                                             <Label htmlFor={`attendance-method-${config.id}`}>Attendance Method</Label>
                                             <Select
                                                 value={config.settings?.attendanceMethod}
                                                 onValueChange={(value) => handleConfigChange(config.id, 'settings', { attendanceMethod: value as AttendanceMethod })}
                                                 disabled={!config.enabled || !!config.locked}
                                             >
                                                <SelectTrigger id={`attendance-method-${config.id}`}>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="manual"><User className="h-4 w-4 mr-2 inline-block"/>Manual Button Click</SelectItem>
                                                     <SelectItem value="wifi"><Wifi className="h-4 w-4 mr-2 inline-block"/>Wi-Fi SSID Check</SelectItem>
                                                     <SelectItem value="geo-fence"><MapPin className="h-4 w-4 mr-2 inline-block"/>Geo-fencing (GPS)</SelectItem>
                                                     <SelectItem value="ultrasonic"><RadioTower className="h-4 w-4 mr-2 inline-block"/>Ultrasonic Proximity</SelectItem>
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
                                                         onChange={(e) => handleConfigChange(config.id, 'settings', { requiredWifiSsid: e.target.value })}
                                                         placeholder="e.g., Campus-WiFi"
                                                         disabled={!config.enabled || !!config.locked}
                                                     />
                                                 </div>
                                             )}
                                             <div className="flex items-center space-x-2 mt-2">
                                                <Switch
                                                     id={`attendance-warning-${config.id}`}
                                                     checked={!!config.settings?.enableAbsentWarning} // Ensure boolean
                                                     onCheckedChange={(checked) => handleConfigChange(config.id, 'settings', { enableAbsentWarning: checked })}
                                                     disabled={!config.enabled || !!config.locked}
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
                                                         checked={!!config.settings?.enableVersioning} // Ensure boolean
                                                         onCheckedChange={(checked) => handleConfigChange(config.id, 'settings', { enableVersioning: checked })}
                                                         disabled={!config.enabled || !!config.locked}
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
