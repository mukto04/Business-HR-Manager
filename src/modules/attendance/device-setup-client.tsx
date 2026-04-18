"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Wifi, 
  WifiOff, 
  Terminal, 
  Download, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Settings2,
  Copy,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAsyncData } from "@/modules/shared/use-async-data";
import { sendJson } from "@/lib/http";
import { useDialog } from "@/components/ui/dialog-provider";
import { LoadingState } from "@/modules/shared/loading-state";
import { ErrorState } from "@/modules/shared/error-state";
import { format } from "date-fns";

interface AttendanceDevice {
  id: string;
  deviceName: string;
  ipAddress: string;
  port: number;
  status: string;
  lastSync: string | null;
  lastSeen: string | null;
  description: string | null;
  apiKey: string;
  createdAt: string;
}

export function DeviceSetupClient() {
  const devices = useAsyncData<AttendanceDevice[]>("/api/attendance/devices", []);
  
  // Helper to determine if device is online (seen in last 6 minutes)
  const getDeviceStatus = (device: AttendanceDevice) => {
    if (!device.lastSeen) return { label: "Offline", color: "bg-slate-100 text-slate-500", iconColor: "text-slate-400", bgColor: "bg-slate-50 border-slate-100" };
    
    const diff = Date.now() - new Date(device.lastSeen).getTime();
    const isOnline = diff < 6 * 60 * 1000; // 6 minutes threshold
    
    return isOnline 
      ? { label: "Online", color: "bg-green-500/10 text-green-600", iconColor: "text-green-600", bgColor: "bg-green-50 border-green-100" }
      : { label: "Offline", color: "bg-slate-100 text-slate-500", iconColor: "text-slate-400", bgColor: "bg-slate-50 border-slate-100" };
  };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyId, setShowApiKeyId] = useState<string | null>(null);
  const dialog = useDialog();

  const [formData, setFormData] = useState({
    deviceName: "",
    ipAddress: "",
    port: "4370",
    description: ""
  });

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendJson("/api/attendance/devices", "POST", formData);
      setOpen(false);
      setFormData({ deviceName: "", ipAddress: "", port: "4370", description: "" });
      await devices.refresh();
      dialog.alert("Success", "Device added successfully. Please copy the API Key for the sync agent.");
    } catch (error: any) {
      dialog.alert("Error", error.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteDevice(id: string) {
    const ok = await dialog.danger("Delete Device?", "Are you sure you want to remove this device? The sync agent for this device will stop working.");
    if (!ok) return;

    try {
      await fetch(`/api/attendance/devices?id=${id}`, { method: "DELETE" });
      await devices.refresh();
    } catch (error: any) {
      dialog.alert("Error", "Failed to delete device.");
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function downloadAgent(device: AttendanceDevice) {
    const script = `
/**
 * AppDevs Attendance Sync Agent
 * Device: ${device.deviceName}
 * IP: ${device.ipAddress}
 */

// Configuration - Edit this if needed
const API_URL = "${window.location.origin}/api/attendance/sync-push";
const API_KEY = "${device.apiKey}";
const DEVICE_IP = "${device.ipAddress}";
const DEVICE_PORT = ${device.port};
const SYNC_INTERVAL_MINUTES = 5;

// Note: Requires node-zklib package
// Install with: npm install node-zklib axios

const ZKLib = require('node-zklib');
const axios = require('axios');

async function sync() {
    let zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);
    try {
        console.log(\`[\${new Date().toLocaleString()}] Connecting to device at \${DEVICE_IP}...\`);
        await zkInstance.createSocket();
        
        const logs = await zkInstance.getAttendances();
        console.log(\`Found \${logs.data.length} logs. Sending to SaaS...\`);

        const response = await axios.post(API_URL, { logs: logs.data }, {
            headers: { 'x-api-key': API_KEY }
        });

        console.log('Sync Success:', response.data.message);
        console.log('Summary:', response.data.summary);
        
    } catch (e) {
        console.error('Sync error:', e.message);
    } finally {
        try { await zkInstance.disconnect(); } catch (e) {}
    }
}

console.log('AppDevs Sync Agent Started...');
console.log('Sync Interval:', SYNC_INTERVAL_MINUTES, 'minutes');

// Run immediately then on interval
sync();
setInterval(sync, SYNC_INTERVAL_MINUTES * 60 * 1000);
    `.trim();

    const blob = new Blob([script], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync-agent-${device.deviceName.replace(/\s+/g, '-').toLowerCase()}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (devices.loading) return <LoadingState />;
  if (devices.error) return <ErrorState message={devices.error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Device Setup"
        subtitle="Manage your physical biometric machines and connect them to the SaaS portal."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Device
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {devices.data.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Wifi className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Devices Configured</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Biometric devices must be added here before you can sync attendance data from your office.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => setOpen(true)}>
                 Register Your First Device
              </Button>
            </div>
          ) : (
            devices.data.map(device => {
              const statusInfo = getDeviceStatus(device);
              return (
                <div key={device.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${statusInfo.bgColor} ${statusInfo.iconColor}`}>
                        {statusInfo.label === 'Online' ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{device.deviceName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{device.ipAddress}:{device.port}</span>
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                             {statusInfo.label}
                           </span>
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => downloadAgent(device)}>
                       <Download className="mr-2 h-3.5 w-3.5" /> Download Agent
                    </Button>
                    <Button variant="danger" onClick={() => deleteDevice(device.id)}>
                       <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Device API Key (Private)</label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <Input 
                               readOnly 
                               value={device.apiKey} 
                               type={showApiKeyId === device.id ? "text" : "password"}
                               className="bg-slate-50 font-mono text-xs border-dashed pr-10"
                             />
                            <button
                               type="button"
                               onClick={() => setShowApiKeyId(showApiKeyId === device.id ? null : device.id)}
                               className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                               {showApiKeyId === device.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                         </div>
                         <Button 
                            variant="secondary" 
                            onClick={() => copyToClipboard(device.apiKey, device.id)}
                            className={copiedId === device.id ? "text-green-600 border-green-200 bg-green-50" : ""}
                          >
                           {copiedId === device.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                         </Button>
                      </div>
                      <p className="text-[10px] text-slate-500">This key is required by the sync agent to authenticate your data.</p>
                   </div>
                   <div className="flex items-end justify-end text-right">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {device.lastSync ? format(new Date(device.lastSync), "MMM d, yyyy HH:mm") : "Never synced"}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
              )
            })
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Terminal className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900">Setup Guide</h4>
             </div>
             
             <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {/* Step 1 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-200 z-10">1</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">Install Node.js</h5>
                   <p className="text-xs text-slate-500 mb-3">Download and install Node.js on the office PC that is on the same network as the device.</p>
                   <a 
                      href="https://nodejs.org/en/download/prebuilt-installer" 
                      target="_blank" 
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                   >
                      <Download className="w-3 h-3" /> Download Node.js <ExternalLink className="w-3 h-3" />
                   </a>
                </div>

                {/* Step 2 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">2</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">Download Sync Agent</h5>
                   <p className="text-xs text-slate-500">
                      Register your device on the left, then click the <strong>"Download Agent"</strong> button to save the script on that PC.
                   </p>
                </div>

                {/* Step 3 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">3</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">Run Automatically (Auto-Setup)</h5>
                   <p className="text-xs text-slate-500 mb-2">
                      To set it as a Windows Service (runs automatically on startup), open <strong>CMD</strong> as Admin and run:
                   </p>
                   <div className="bg-slate-900 rounded-xl p-3 font-mono text-[10px] text-blue-400 group">
                      <span className="text-slate-500">$</span> npm install -g qckwinsvc
                      <br/>
                      <span className="text-slate-500">$</span> qckwinsvc
                   </div>
                </div>

                {/* Step 4 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">4</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">Check Connection Status</h5>
                   <p className="text-xs text-slate-500">
                      Once the agent starts, the device status here will automatically switch to <span className="text-green-600 font-bold">Online</span>.
                   </p>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                   <div className="bg-blue-100 p-2 rounded-xl h-fit">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                   </div>
                   <div className="space-y-1">
                      <h6 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Device API Key</h6>
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        This key acts as a secure identity token. It ensures that only data from your specific machine is accepted by the SaaS server. <strong>Never share this key with anyone.</strong>
                      </p>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-2xl shadow-slate-900/20">
             <Settings2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-xl">
                    <Wifi className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="font-bold">Sync Technology</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                   Our "Push-Sync" model eliminates the need for Static IP or Port Forwarding. All communication is E2E encrypted via HTTPS.
                </p>
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                   Ready to connect
                </div>
             </div>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Register Biometric Device">
         <form onSubmit={handleAddDevice} className="space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Device Name</label>
               <Input 
                  required 
                  placeholder="Main Office (Ground Floor)" 
                  value={formData.deviceName}
                  onChange={e => setFormData({...formData, deviceName: e.target.value})}
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">IP Address</label>
                  <Input 
                     required 
                     placeholder="192.168.1.201" 
                     value={formData.ipAddress}
                     onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Port</label>
                  <Input 
                     required 
                     type="number" 
                     placeholder="4370" 
                     value={formData.port}
                     onChange={e => setFormData({...formData, port: e.target.value})}
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
               <Input 
                  placeholder="ZKTeco F22 on front desk" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
               />
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={loading}>
                 {loading ? "Adding..." : "Register Device"}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
