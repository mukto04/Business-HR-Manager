"use client";

import React, { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { 
  Globe, 
  Save, 
  Plus, 
  Trash2, 
  Loader2, 
  Image as ImageIcon,
  Zap,
  DollarSign,
  RefreshCcw,
  Upload,
  Palette,
  BarChart3,
  CheckCircle2
} from "lucide-react";

const toPascalCase = (str: string) => {
  if (!str) return "";
  return str
    .split(/[-_ ]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
  const normalizedName = toPascalCase(name);
  const IconComponent = (LucideIcons as any)[normalizedName] || (LucideIcons as any)[name] || LucideIcons.Zap;
  return <IconComponent className={className} />;
};

export default function LandingControllerPage() {
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"branding" | "hero" | "stats" | "features" | "pricing">("branding");
  
  // Content States
  const [branding, setBranding] = useState({
    siteTitle: "AppDevs HR Dashboard",
    siteDescription: "Modern HR Management Dashboard built with Next.js, Tailwind CSS, TypeScript and Prisma.",
    primaryColor: "#2563eb",
    logo: "/logo.png",
    favicon: "/favicon.png"
  });

  const [hero, setHero] = useState({
    title: "Revolutionize Your HR Operations",
    subtitle: "The all-in-one HR Management System designed for modern businesses. Automate attendance, payroll, and employee life-cycles in one sleek platform.",
    cta: "Contact Support",
    ctaLink: "https://wa.me/8801739748004",
    mockupImg: "/hr_dashboard_mockup_new.png"
  });

  const [stats, setStats] = useState([
    { label: "Uptime SLA", val: "99.9%" },
    { label: "Active Tenants", val: "500+" }
  ]);

  const [features, setFeatures] = useState([
    { title: "Employee Management", desc: "Manage onboarding and profiles.", icon: "Users" }
  ]);

  const [pricing, setPricing] = useState([
    { name: "Starter", price: "$19", employees: "25", features: ["Core HR"] },
    { name: "Growth", price: "$39", employees: "100", features: ["Full Logic"] },
    { name: "Enterprise", price: "$99", employees: "300", features: ["Elite"] }
  ]);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const res = await fetch("/api/super-admin/landing-page");
      const data = await res.json();
      if (typeof data === 'object' && !Array.isArray(data)) {
        if (data.BRANDING) setBranding(prev => ({...prev, ...data.BRANDING}));
        if (data.HERO) setHero(prev => ({...prev, ...data.HERO}));
        if (data.STATS) setStats(data.STATS);
        if (data.FEATURES) setFeatures(data.FEATURES);
        if (data.PRICING) {
           // Handle transition from old object structure to new array structure if needed
           setPricing(Array.isArray(data.PRICING) ? data.PRICING : (data.PRICING.monthly || []));
        }
      }
    } catch (e) {
      console.error("Failed to fetch landing page content");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File, type: "LOGO" | "FAVICON" | "MOCKUP") {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/super-admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (type === "LOGO") setBranding({...branding, logo: data.url});
        if (type === "FAVICON") setBranding({...branding, favicon: data.url});
        if (type === "MOCKUP") setHero({...hero, mockupImg: data.url});
      }
    } catch (e) {
      alert("File upload failed");
    }
  }

  async function saveSection(section: string, content: any) {
    setSavingSection(section);
    try {
      const res = await fetch("/api/super-admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content }),
      });
      if (!res.ok) alert(`Failed to save ${section}`);
    } catch (e) {
      alert(`Error saving ${section}`);
    } finally {
      setSavingSection(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 shadow-2xl p-8 rounded-[32px] border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-3 rounded-2xl">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Landing Page Controller</h1>
            <p className="text-slate-500 font-medium">Control visual identity and site content</p>
          </div>
        </div>
        <button onClick={fetchContent} className="btn-secondary flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl">
          <RefreshCcw className="w-4 h-4" /> Sync
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 w-fit overflow-x-auto max-w-full">
        {[
          { id: "branding", label: "Branding & SEO", icon: <Palette className="w-4 h-4" /> },
          { id: "hero", label: "Hero Section", icon: <Zap className="w-4 h-4" /> },
          { id: "stats", label: "Stats Bar", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "features", label: "Features Grid", icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: "pricing", label: "Pricing Table", icon: <DollarSign className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden p-10">
        
        {/* TAB: BRANDING */}
        {activeTab === "branding" && (
          <div className="space-y-12">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Palette className="w-6 h-6 text-red-500" /> Branding & SEO
                </h2>
                <button 
                  onClick={() => saveSection("BRANDING", branding)}
                  disabled={savingSection === "BRANDING"}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingSection === "BRANDING" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Branding
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Site Title (Browser Tab)</label>
                  <input 
                    value={branding.siteTitle}
                    onChange={e => setBranding({...branding, siteTitle: e.target.value})}
                    className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="Enter site title..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meta Description (SEO)</label>
                  <textarea 
                    value={branding.siteDescription}
                    onChange={e => setBranding({...branding, siteDescription: e.target.value})}
                    className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none h-20"
                    placeholder="Enter meta description for search engines..."
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 border-t border-slate-800">
               {/* Color Picker */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Theme Color</label>
                  <div className="flex items-center gap-4 bg-black p-4 rounded-3xl border border-slate-800">
                     <input 
                       type="color" 
                       value={branding.primaryColor}
                       onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                       className="w-16 h-16 rounded-xl overflow-hidden border-0 cursor-pointer p-0"
                     />
                     <div>
                        <input 
                          value={branding.primaryColor}
                          onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                          className="bg-transparent text-white font-mono text-xl outline-none"
                        />
                        <p className="text-[10px] text-slate-500 uppercase">Updates buttons & accents site-wide</p>
                     </div>
                  </div>
               </div>
               {/* Logo Upload */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Site Logo</label>
                  <div className="relative group bg-black p-4 rounded-3xl border border-slate-800 flex flex-col items-center gap-4">
                     <img src={branding.logo} className="h-16 w-auto object-contain" />
                     <label className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all">
                       <Upload className="w-4 h-4" /> Upload Logo
                       <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "LOGO")} />
                     </label>
                  </div>
               </div>
               {/* Favicon Upload */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Site Favicon</label>
                  <div className="relative group bg-black p-4 rounded-3xl border border-slate-800 flex flex-col items-center gap-4">
                     <img src={branding.favicon} className="w-16 h-16 object-contain" />
                     <label className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all">
                       <Upload className="w-4 h-4" /> Upload Favicon
                       <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "FAVICON")} />
                     </label>
                  </div>
               </div>
             </div>
          </div>
        )}

        {/* TAB: HERO */}
        {activeTab === "hero" && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-500" /> Hero Section
                </h2>
                <button 
                  onClick={() => saveSection("HERO", hero)}
                  disabled={savingSection === "HERO"}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingSection === "HERO" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Hero
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Headline</label>
                      <textarea value={hero.title} onChange={e => setHero({...hero, title: e.target.value})} className="w-full bg-black border border-slate-800 rounded-3xl p-6 text-white text-lg h-32 focus:ring-2 focus:ring-yellow-600 outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sub Headline</label>
                      <textarea value={hero.subtitle} onChange={e => setHero({...hero, subtitle: e.target.value})} className="w-full bg-black border border-slate-800 rounded-3xl p-6 text-slate-400 h-40 focus:ring-2 focus:ring-yellow-600 outline-none transition-all leading-relaxed" />
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Button Text</label>
                        <input value={hero.cta} onChange={e => setHero({...hero, cta: e.target.value})} className="w-full bg-black border border-slate-800 rounded-2xl p-4 text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Button Link</label>
                        <input value={hero.ctaLink} onChange={e => setHero({...hero, ctaLink: e.target.value})} className="w-full bg-black border border-slate-800 rounded-2xl p-4 text-white" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Mockup Image</label>
                      <div className="relative group bg-black rounded-[40px] border border-slate-800 p-8 flex flex-col items-center gap-6 overflow-hidden">
                         <img src={hero.mockupImg} className="w-full h-48 object-cover rounded-2xl shadow-2xl grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" />
                         <label className="flex items-center gap-3 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl cursor-pointer font-bold transition-all w-fit border border-slate-700">
                           <Upload className="w-5 h-5" /> Replace Platform Mockup
                           <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "MOCKUP")} />
                         </label>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        )}

        {/* TAB: STATS */}
        {activeTab === "stats" && (
          <div className="space-y-12">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-cyan-500" /> Statistics Bar
                </h2>
                <button onClick={() => saveSection("STATS", stats)} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all">
                   <Save className="w-5 h-5" /> Save Stats
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-black p-6 rounded-3xl border border-slate-800 space-y-4 relative">
                     <button onClick={() => setStats(stats.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                     </button>
                     <input value={stat.val} onChange={e => {
                        const newStats = [...stats];
                        newStats[i].val = e.target.value;
                        setStats(newStats);
                     }} className="w-full bg-slate-900/50 text-white text-3xl font-black p-2 rounded-xl outline-none" />
                     <input value={stat.label} onChange={e => {
                        const newStats = [...stats];
                        newStats[i].label = e.target.value;
                        setStats(newStats);
                     }} className="w-full bg-transparent text-slate-500 font-bold uppercase tracking-widest text-[10px] outline-none" />
                  </div>
                ))}
                <button onClick={() => setStats([...stats, { label: "NEW STAT", val: "100%" }])} className="border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-6 text-slate-600 hover:text-white hover:border-slate-500 transition-all">
                   <Plus className="w-6 h-6 mb-2" /> Add Stat
                </button>
             </div>
          </div>
        )}

        {/* TAB: FEATURES */}
        {activeTab === "features" && (
           <div className="space-y-12">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-rose-500" /> Platform Features Grid
                </h2>
                <button onClick={() => saveSection("FEATURES", features)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all">
                   <Save className="w-5 h-5" /> Save Features
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, i) => (
                   <div key={i} className="bg-black p-8 rounded-[40px] border border-slate-800 space-y-6 relative group">
                      <button onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-500 transition-colors">
                         <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Icon Name (Lucide)</label>
                            <div className="relative group/icon">
                               <input 
                                 value={feature.icon}
                                 onChange={e => {
                                    const f = [...features];
                                    f[i].icon = e.target.value;
                                    setFeatures(f);
                                 }}
                                 placeholder="e.g. Activity"
                                 className="w-full bg-slate-900 text-white rounded-2xl p-4 pl-12 outline-none border border-slate-800 focus:border-red-600 transition-all"
                               />
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500">
                                  <LucideIcon name={feature.icon} className="w-5 h-5" />
                               </div>
                            </div>
                            <p className="text-[9px] text-slate-500">Use names from <a href="https://lucide.dev/icons" target="_blank" className="text-blue-500 underline">lucide.dev</a></p>
                         </div>
                         <div className="flex-1 space-y-4">
                            <input value={feature.title} onChange={e => {
                               const f = [...features];
                               f[i].title = e.target.value;
                               setFeatures(f);
                            }} placeholder="Feature Title" className="w-full bg-transparent text-white text-xl font-bold outline-none" />
                            <textarea value={feature.desc} onChange={e => {
                               const f = [...features];
                               f[i].desc = e.target.value;
                               setFeatures(f);
                            }} placeholder="Short description" className="w-full bg-transparent text-slate-400 text-sm outline-none h-24 italic" />
                         </div>
                      </div>
                   </div>
                ))}
                <button onClick={() => setFeatures([...features, { title: "NEW FEATURE", desc: "Short desc", icon: "Zap" }])} className="border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center p-12 text-slate-600 hover:text-white hover:border-slate-500 transition-all">
                   <Plus className="w-10 h-10 mb-4" /> Add New Feature Grid
                </button>
             </div>
           </div>
        )}

        {/* TAB: PRICING */}
        {activeTab === "pricing" && (
           <div className="space-y-12">
              {/* Similar logic for current pricing editor but with list manager style */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-emerald-500" /> Pricing Structure
                </h2>
                <button onClick={() => saveSection("PRICING", pricing)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl flex items-center gap-2 transition-all">
                   <Save className="w-5 h-5" /> Save Pricing
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {pricing.map((plan, i) => (
                  <div key={i} className="bg-black p-8 rounded-[40px] border border-slate-800 space-y-6 relative group">
                      <button onClick={() => setPricing(pricing.filter((_, idx) => idx !== i))} className="absolute top-6 right-6 p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                         <Trash2 className="w-5 h-5" />
                      </button>
                      <input value={plan.name} onChange={e => {
                         const p = [...pricing];
                         p[i].name = e.target.value;
                         setPricing(p);
                      }} className="w-full bg-transparent text-2xl font-black text-white outline-none" placeholder="Plan Name" />
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-600 uppercase">Monthly Price</label>
                           <input value={plan.price} onChange={e => {
                              const p = [...pricing];
                              p[i].price = e.target.value;
                              setPricing(p);
                           }} className="bg-slate-900 p-4 rounded-2xl text-red-500 font-bold outline-none w-full" />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-600 uppercase">Max Employees</label>
                           <input value={plan.employees} onChange={e => {
                              const p = [...pricing];
                              p[i].employees = e.target.value;
                              setPricing(p);
                           }} className="bg-slate-900 p-4 rounded-2xl text-white font-bold outline-none w-full" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-600 uppercase">Features (One per line)</label>
                         <textarea value={plan.features.join("\n")} onChange={e => {
                            const p = [...pricing];
                            p[i].features = e.target.value.split("\n").filter(f => f.trim() !== "");
                            setPricing(p);
                         }} className="w-full bg-slate-900 p-4 rounded-2xl text-slate-400 text-xs min-h-[150px] outline-none leading-relaxed" placeholder="Features (one per line)" />
                      </div>
                  </div>
               ))}
               <button onClick={() => setPricing([...pricing, { name: "NEW PLAN", price: "$49", employees: "100", features: ["Core Feature"] }])} className="border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center p-12 text-slate-600 hover:text-white hover:border-slate-500 transition-all">
                   <Plus className="w-10 h-10 mb-4" /> Add New Plan
               </button>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}
