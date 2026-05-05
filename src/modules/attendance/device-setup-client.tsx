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
  EyeOff,
  HelpCircle,
  AlertCircle,
  Key
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
import { useTranslation } from "@/hooks/use-translation";

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
    const lastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
    const isOnline = Date.now() - lastSeen < 6 * 60 * 1000; // 6 minutes threshold
    
    if (!isOnline) {
      return { 
        label: "Offline", 
        color: "bg-slate-100 text-slate-500", 
        iconColor: "text-slate-400", 
        bgColor: "bg-slate-50 border-slate-100",
        agentStatus: "DISCONNECTED"
      };
    }
    
    // If agent is seen, check the machine status stored in 'status' field
    const machineActive = device.status === "ACTIVE";
    
    return { 
      label: machineActive ? "Online" : "Agent Only", 
      color: machineActive ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600", 
      iconColor: machineActive ? "text-green-600" : "text-blue-600", 
      bgColor: machineActive ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100",
      agentStatus: "CONNECTED",
      machineStatus: machineActive ? "REACHABLE" : "UNREACHABLE"
    };
  };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyId, setShowApiKeyId] = useState<string | null>(null);
  const [setupOS, setSetupOS] = useState<"windows" | "linux">("windows");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  
  function copyCmd(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  }
  const dialog = useDialog();
  const { t } = useTranslation();

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
      dialog.alert(t("Success"), t("Device added successfully. Please copy the API Key for the sync agent."));
    } catch (error: any) {
      dialog.alert(t("Error"), error.message || t("Failed to add device."));
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
      dialog.alert(t("Error"), t("Failed to delete device."));
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

// Configuration
const HEARTBEAT_URL = "${window.location.origin}/api/attendance/heartbeat";
const SYNC_URL = "${window.location.origin}/api/attendance/sync-push";
const API_KEY = "${device.apiKey}";
const TENANT_SLUG = "${window.location.pathname.split('/')[1] || 'default'}"; // Auto-detected slug
const DEVICE_IP = "${device.ipAddress}";
const DEVICE_PORT = ${device.port};
const SYNC_INTERVAL_MINUTES = 5;

// Requires node-zklib package
// Install with: npm install node-zklib axios

const ZKLib = require('node-zklib');
const axios = require('axios');

async function sendHeartbeat(machineStatus = "DISCONNECTED", error = null) {
    try {
        await axios.post(HEARTBEAT_URL, { machineStatus, error }, {
            headers: { 
                'x-api-key': API_KEY,
                'x-tenant-slug': TENANT_SLUG
            }
        });
        console.log(\`[\${new Date().toLocaleString()}] Heartbeat sent: Machine is \${machineStatus}\`);
    } catch (e) {
        console.error('Heartbeat failed:', e.message);
    }
}

async function sync() {
    let zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 20000, 4000);
    try {
        console.log(\`[\${new Date().toLocaleString()}] Attempting connection to \${DEVICE_IP}...\`);
        await zkInstance.createSocket();
        
        console.log('Connected! Fetching logs...');
        const logs = await zkInstance.getAttendances();
        
        console.log(\`Syncing \${logs.data.length} logs to SaaS...\`);
        const response = await axios.post(SYNC_URL, { logs: logs.data }, {
            headers: { 
                'x-api-key': API_KEY,
                'x-tenant-slug': TENANT_SLUG
            }
        });

        console.log('Success:', response.data.message);
        await sendHeartbeat("CONNECTED");
        
    } catch (e) {
        const errMsg = e && e.message ? e.message : 'Unknown Connection Error or Timeout';
        console.error('Connection Failed:', errMsg);
        
        // Detailed Diagnostics for Troubleshooting
        if (errMsg.includes('timeout') || errMsg.includes('EHOSTUNREACH') || errMsg === 'Unknown Connection Error or Timeout') {
            console.log('DIAGNOSTIC: 1. Ensure laptop & machine are on the SAME router.');
            console.log('DIAGNOSTIC: 2. Check if IP ' + DEVICE_IP + ' is correct on the machine settings.');
            console.log('DIAGNOSTIC: 3. Try to ping ' + DEVICE_IP + ' from your terminal.');
        } else if (errMsg.includes('ECONNREFUSED')) {
            console.error('DIAGNOSTIC: Connection Refused. Ensure no other agent is connected to the machine.');
        }
        
        await sendHeartbeat("DISCONNECTED", errMsg);
    } finally {
        try { await zkInstance.disconnect(); } catch (e) {}
    }
}

console.log('AppDevs Sync Agent V2 Started...');
console.log('Target Device:', DEVICE_IP + ':' + DEVICE_PORT);

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
        title={t("Attendance Device Setup")}
        subtitle={t("Manage your physical biometric machines and connect them to the SaaS portal.")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("Add New Device")}
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
              <h3 className="text-lg font-bold text-slate-900">{t("No Devices Configured")}</h3>
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
                             {t(statusInfo.label)}
                           </span>
                           {statusInfo.agentStatus === 'CONNECTED' && statusInfo.label === 'Agent Only' && (
                             <span className="text-[9px] text-blue-500 font-medium italic ml-2">
                               ({t("Agent Online, Machine Offline")})
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => downloadAgent(device)}>
                       <Download className="mr-2 h-3.5 w-3.5" /> {t("Download Agent")}
                    </Button>
                    <Button variant="danger" onClick={() => deleteDevice(device.id)}>
                       <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Device API Key (Private)")}</label>
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
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Last Activity")}</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {device.lastSync ? format(new Date(device.lastSync), "MMM d, yyyy HH:mm") : t("Never synced")}
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
                <h4 className="font-bold text-slate-900">{t("Setup Guide")}</h4>
             </div>
             
             <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {/* Step 1 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-200 z-10">1</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">{t("New Device Configuration")}</h5>
                   <p className="text-[11px] text-slate-500 mb-3">
                      {t("First, connect the machine to WiFi. Go to WiFi 'Details' to get the ")} <strong>{t("IP Address")}</strong>. 
                      {t(" Then go to 'Ethernet Details' to get the ")} <strong>{t("Port")}</strong> (4370). 
                      <span className="text-amber-600 font-semibold block mt-1">{t("Note: Only use the WiFi IP, not the Ethernet IP.")}</span>
                   </p>
                </div>

                {/* Step 2 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">2</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">{t("Install Node.js")}</h5>
                   <p className="text-[11px] text-slate-500 mb-3">{t("Install Node.js on the PC connected to the same router as the biometric device.")}</p>
                   <a 
                      href="https://nodejs.org/en/download/prebuilt-installer" 
                      target="_blank" 
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                   >
                      <Download className="w-3 h-3" /> Download Node.js <ExternalLink className="w-3 h-3" />
                   </a>
                </div>

                {/* Step 3 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">3</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">{t("Install Dependencies")}</h5>
                   <p className="text-[11px] text-slate-500 mb-2">{t("Open CMD or Terminal and run the following command to install required packages:")}</p>
                   <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 rounded-xl px-3 py-2.5 font-mono text-[10px] text-emerald-400">
                         <span className="text-slate-500">$ </span>npm install node-zklib axios
                      </div>
                      <button
                         onClick={() => copyCmd('npm install node-zklib axios')}
                         className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                           copiedCmd === 'npm install node-zklib axios'
                             ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                             : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200'
                         }`}
                      >
                         {copiedCmd === 'npm install node-zklib axios' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                         {copiedCmd === 'npm install node-zklib axios' ? 'Copied!' : 'Copy'}
                      </button>
                   </div>
                </div>

                {/* Step 4 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">4</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">{t("Download Sync Agent")}</h5>
                   <p className="text-[11px] text-slate-500 mb-2">{t("From the device card above, click the")}{" "}<strong className="text-blue-600">{t("Download Agent")}</strong>{" "}{t("button to download the pre-configured sync agent file for your device. Save it in a dedicated folder (e.g., C:\\sync-agent\\).")}</p>
                   <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <Download className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <p className="text-[10px] text-amber-700 font-medium">{t("The agent file is unique per device — it contains your API key and device IP.")}</p>
                   </div>
                </div>

                {/* Step 5 */}
                <div className="relative pl-10">
                   <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-sm z-10">5</div>
                   <h5 className="font-bold text-slate-800 text-sm mb-1">{t("Test Connection")}</h5>
                   <p className="text-[11px] text-slate-500 mb-2">{t("Open CMD inside the folder where you saved the agent file, then run:")}</p>
                   <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 rounded-xl px-3 py-2.5 font-mono text-[10px] text-blue-400">
                         <span className="text-slate-500">$ </span>node <span className="text-red-400 font-bold">your-agent-filename.js</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-amber-600 font-medium italic mt-1.5">
                      {t("* Replace 'your-agent-filename.js' with the actual downloaded file name.")}
                   </p>
                </div>

                {/* Step 6 */}
                <div className="relative pl-10">
                   <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                         <h5 className="font-bold text-slate-800 text-sm">{t("Auto-Run (Background)")}</h5>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                         <button 
                            className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${setupOS === 'windows' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            onClick={() => setSetupOS('windows')}
                         >
                            Windows
                         </button>
                         <button 
                            className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${setupOS === 'linux' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            onClick={() => setSetupOS('linux')}
                         >
                            Linux
                         </button>
                      </div>
                   </div>
                   <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      {setupOS === 'windows' 
                        ? "To run automatically on Windows startup, open CMD as Administrator and run each command:"
                        : "To keep it running in the background on Linux, use PM2:"}
                   </p>
                   
                   {setupOS === 'windows' ? (
                     <div className="space-y-2">
                       {[
                         { cmd: 'npm install -g qckwinsvc', label: 'Install Windows Service Tool' },
                         { cmd: 'qckwinsvc', label: 'Register as Windows Service' },
                       ].map(({ cmd, label }) => (
                         <div key={cmd}>
                           <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{label}</p>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 bg-slate-900 rounded-xl px-3 py-2.5 font-mono text-[10px] text-blue-400">
                               <span className="text-slate-500">$ </span>{cmd}
                             </div>
                             <button
                               onClick={() => copyCmd(cmd)}
                               className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                                 copiedCmd === cmd ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200'
                               }`}
                             >
                               {copiedCmd === cmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                               {copiedCmd === cmd ? 'Copied!' : 'Copy'}
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {[
                         { cmd: 'npm install -g pm2', label: 'Install PM2 Process Manager' },
                         { cmd: 'pm2 start sync-agent-name.js', label: 'Start Agent in Background' },
                         { cmd: 'pm2 save', label: 'Save to Auto-Restart on Reboot' },
                       ].map(({ cmd, label }) => (
                         <div key={cmd}>
                           <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{label}</p>
                           <div className="flex items-center gap-2">
                             <div className="flex-1 bg-slate-900 rounded-xl px-3 py-2.5 font-mono text-[10px] text-indigo-400">
                               <span className="text-slate-500">$ </span>{cmd}
                             </div>
                             <button
                               onClick={() => copyCmd(cmd)}
                               className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                                 copiedCmd === cmd ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200'
                               }`}
                             >
                               {copiedCmd === cmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                               {copiedCmd === cmd ? 'Copied!' : 'Copy'}
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             </div>

             {/* Troubleshooting & Help - Modernized */}
             <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-5 h-5" />
                   </div>
                   <div>
                      <h5 className="font-bold text-slate-900 text-sm">{t("Troubleshooting & Help")}</h5>
                      <p className="text-[10px] text-slate-500">{t("Solve common connection and sync issues")}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-amber-600">
                         <WifiOff className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold">{t("Connection Failed")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                         {t("Ensure PC and Machine are on the SAME router. Try to 'ping' the machine IP from your terminal to verify visibility.")}
                      </p>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-rose-600">
                         <AlertCircle className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold">{t("Subnet Mismatch")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                         {t("PC IP series must match Machine (e.g. 192.168.1.x). If they differ, use DHCP on the machine to auto-resolve.")}
                      </p>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-blue-600">
                         <Key className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold">{t("Invalid API Key (401)")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                         {t("This means your agent file is outdated. Please delete old files and download the LATEST agent from this page.")}
                      </p>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-emerald-600">
                         <ShieldCheck className="w-3.5 h-3.5" />
                         <span className="text-[11px] font-bold">{t("Comm Key / Password")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                         {t("Ensure 'Comm Key' is set to '0' in machine network settings. Otherwise, the agent will be blocked from connecting.")}
                      </p>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                   <div className="bg-blue-100 p-2 rounded-xl h-fit">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                   </div>
                   <div className="space-y-1">
                      <h6 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">{t("Device API Key")}</h6>
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
                  <h4 className="font-bold">{t("Sync Technology")}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                   Our "Push-Sync" model eliminates the need for Static IP or Port Forwarding. All communication is E2E encrypted via HTTPS.
                </p>
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                   {t("Ready to connect")}
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
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("IP Address")}</label>
                  <Input 
                     required 
                     placeholder="192.168.1.201" 
                     value={formData.ipAddress}
                     onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Port")}</label>
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
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("Description")}</label>
               <Input 
                  placeholder="ZKTeco F22 on front desk" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
               />
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
               <Button type="submit" disabled={loading}>
                 {loading ? t("Adding...") : t("Register Device")}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
