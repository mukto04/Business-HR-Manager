"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { AlertCircle, ExternalLink, RefreshCw, Settings2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useDialog } from "@/components/ui/dialog-provider";

export default function GoogleSheetPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dialog = useDialog();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/attendance");
      if (res.ok) {
        const data = await res.json();
        setUrl(data.googleSheetUrl || null);
        setInputUrl(data.googleSheetUrl || "");
      }
    } catch (e) {
      console.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) {
      dialog.alert("Error", "Please enter a valid Google Sheet URL.");
      return;
    }

    setSaving(true);
    try {
      // We fetch existing settings first to preserve other values like defaultInTime
      const settingsRes = await fetch("/api/settings/attendance");
      const currentSettings = await settingsRes.json();

      const res = await fetch("/api/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentSettings,
          googleSheetUrl: inputUrl.trim()
        })
      });

      if (res.ok) {
        setUrl(inputUrl.trim());
        setIsSettingsOpen(false);
        dialog.alert("Success", "Spreadsheet link updated successfully.");
      } else {
        dialog.alert("Error", "Failed to save the link.");
      }
    } catch (error) {
      dialog.alert("Error", "Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to format the URL for embedding if it's a standard link
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return null;
    
    // If it's already a pubhtml link, use it
    if (rawUrl.includes("/pubhtml")) return rawUrl;
    
    // If it's a standard spreadsheet link, try to convert to preview/embed
    if (rawUrl.includes("docs.google.com/spreadsheets/d/")) {
      const match = rawUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/preview?usp=embed_google_sheet`;
      }
    }
    
    return rawUrl;
  };

  const embedUrl = url ? getEmbedUrl(url) : null;

  return (
    <div className="flex flex-col h-screen -m-8 bg-slate-50/50">
      <div className="p-8 pb-4">
        <PageHeader
          title="Company Spreadsheet"
          subtitle="View and manage external Google Sheets data"
          actions={
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={fetchSettings}>
                  <RefreshCw className={loading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} /> Refresh
               </Button>
               {url && (
                 <>
                   <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)}>
                      <Settings2 className="mr-2 h-4 w-4" /> Configure Link
                   </Button>
                   <a href={url} target="_blank" rel="noopener noreferrer">
                     <Button variant="ghost" size="sm" className="hidden md:flex">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Original
                     </Button>
                   </a>
                 </>
               )}
            </div>
          }
        />
      </div>

      <div className="flex-1 p-8 pt-0">
        <Card className="w-full h-full overflow-hidden border-slate-200 bg-white relative flex flex-col shadow-sm rounded-3xl">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
               <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
               <p className="text-slate-400 font-medium animate-pulse">Loading spreadsheet...</p>
            </div>
          ) : !url ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto">
               <div className="bg-brand-50 p-6 rounded-3xl mb-8 text-brand-600 ring-8 ring-brand-50/50">
                  <AlertCircle size={48} />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-3">No Spreadsheet Linked</h3>
               <p className="text-slate-500 mb-10 leading-relaxed text-lg">
                  Integrate your external Google Sheets directly into this dashboard. Copy your spreadsheet URL and paste it below to get started.
               </p>
               
               <form onSubmit={handleSave} className="w-full space-y-4 bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-8">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-bold text-slate-700 ml-1">Google Sheet URL</label>
                    <div className="flex gap-2">
                       <Input 
                          placeholder="https://docs.google.com/spreadsheets/d/..." 
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          className="flex-1 h-12 rounded-xl bg-white focus:ring-brand-500"
                       />
                       <Button type="submit" disabled={saving} className="h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700">
                          {saving ? "Saving..." : "Save & Connect"}
                       </Button>
                    </div>
                  </div>
               </form>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left w-full">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">1</div>
                      Open Sheet
                    </div>
                    <p className="text-xs text-slate-500">Go to your Google Sheet in your browser.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">2</div>
                      Copy URL
                    </div>
                    <p className="text-xs text-slate-500">Copy the URL or 'Publish to web' link.</p>
                  </div>
               </div>
            </div>
          ) : (
            <iframe
              src={embedUrl || ""}
              className="w-full h-full border-none bg-white"
              title="Company Spreadsheet"
              allowFullScreen
            />
          )}
        </Card>
      </div>

      {/* Settings Modal */}
      <Modal open={isSettingsOpen} onClose={() => !saving && setIsSettingsOpen(false)} title="Configure Spreadsheet Link">
         <form onSubmit={handleSave} className="space-y-6 pt-4">
            <div className="space-y-3">
               <div className="p-4 bg-amber-50 text-amber-700 text-xs rounded-2xl border border-amber-100 leading-relaxed flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>
                    Changing this link will update the spreadsheet for all administrators in your company. 
                    Ensure the sheet has proper sharing permissions.
                  </p>
               </div>
               
               <div className="space-y-1.5 px-1">
                  <label className="text-sm font-bold text-slate-700">Google Sheet URL</label>
                  <Input 
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Link should be like: docs.google.com/spreadsheets/d/SPREADSHEET_ID</p>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button type="button" variant="ghost" onClick={() => setIsSettingsOpen(false)} disabled={saving}>Cancel</Button>
               <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Update Link"}
               </Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
