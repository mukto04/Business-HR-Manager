"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Shield,
  PieChart, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Briefcase,
  Zap,
  Globe,
  Lock,
  Menu,
  X,
  Loader2,
  Award,
  Trophy,
  Star
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

const FEATURE_LIST = [
  {
    title: "Employee Management",
    desc: "Manage onboarding, employee documents, and profiles in one centralized database.",
    icon: <Users className="w-6 h-6 text-blue-500" />
  },
  {
    title: "Biometric Attendance",
    desc: "Real-time attendance sync with ZKTeco and physical biometric machines.",
    icon: <Clock className="w-6 h-6 text-emerald-500" />
  },
  {
    title: "Automated Payroll",
    desc: "Calculate salaries, manageable structures, and monthly payments with one click.",
    icon: <CreditCard className="w-6 h-6 text-purple-500" />
  },
  {
    title: "Loans & Advances",
    desc: "Specifically track employee loans and advance salaries with automated deductions.",
    icon: <ShieldCheck className="w-6 h-6 text-amber-500" />
  },
  {
    title: "Leave & Holidays",
    desc: "Full control over leave balances, holidays, and manual attendance requests.",
    icon: <PieChart className="w-6 h-6 text-rose-500" />
  },
  {
    title: "Office Cost Tracking",
    desc: "Monitor daily expenses and maintain financial transparency for the office.",
    icon: <Briefcase className="w-6 h-6 text-cyan-500" />
  }
];

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Content States with Fallbacks
  const [branding, setBranding] = useState({
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
    { label: "Active Tenants", val: "500+" },
    { label: "Support", val: "24/7" },
    { label: "Encryption", val: "AES-256" }
  ]);

  const [features, setFeatures] = useState([
    { title: "Employee Management", desc: "Manage onboarding, employee documents, and profiles in one centralized database.", icon: "Users" },
    { title: "Biometric Attendance", desc: "Real-time attendance sync with ZKTeco and physical biometric machines.", icon: "Clock" },
    { title: "Automated Payroll", desc: "Calculate salaries, manageable structures, and monthly payments with one click.", icon: "CreditCard" },
    { title: "Loans & Advances", desc: "Specifically track employee loans and advance salaries with automated deductions.", icon: "Shield" },
    { title: "Leave & Holidays", desc: "Full control over leave balances, holidays, and manual attendance requests.", icon: "PieChart" },
    { title: "Office Cost Tracking", desc: "Monitor daily expenses and maintain financial transparency for the office.", icon: "Briefcase" }
  ]);

  const [pricing, setPricing] = useState([
    { name: "Starter", price: "$19", employees: "25", features: ["Employee Management", "Biometric Attendance", "Automated Payroll", "Loans & Advances", "Leave & Holidays", "Office Cost Tracking"] },
    { name: "Growth", price: "$49", employees: "100", features: ["Employee Management", "Biometric Attendance", "Automated Payroll", "Loans & Advances", "Leave & Holidays", "Office Cost Tracking"] },
    { name: "Enterprise", price: "$99", employees: "300", features: ["Employee Management", "Biometric Attendance", "Automated Payroll", "Loans & Advances", "Leave & Holidays", "Office Cost Tracking"] }
  ]);

  useEffect(() => {
    async function fetchLandingData() {
      try {
        const res = await fetch("/api/landing-page");
        const data = await res.json();
        if (data.BRANDING) setBranding(data.BRANDING);
        if (data.HERO) setHero(data.HERO);
        if (data.STATS) setStats(data.STATS);
        if (data.FEATURES) setFeatures(data.FEATURES);
        if (data.PRICING) {
           const pricingArray = Array.isArray(data.PRICING) ? data.PRICING : (data.PRICING.monthly || []);
           setPricing(pricingArray);
        }
      } catch (e) {
        console.error("Failed to load dynamic landing content, using fallbacks.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLandingData();
  }, []);

  const toPascalCase = (str: string) => {
    if (!str) return "";
    return str
      .split(/[-_ ]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  const DynamicIcon = ({ name, className, style }: { name: string, className?: string, style?: any }) => {
    const icons: any = { ...LucideIcons };
    const normalizedName = toPascalCase(name);
    const IconComponent = icons[normalizedName] || icons[name] || Zap;
    return <IconComponent className={className} style={style} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-red-500/30 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: ${branding.primaryColor};
          --primary-glow: ${branding.primaryColor}33;
          --primary-soft: ${branding.primaryColor}1a;
        }
      `}} />
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#hero" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={branding.logo} alt="Logo" className="h-10 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={hero.ctaLink} 
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-all shadow-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Contact Support
            </a>
            <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-widest" style={{ color: branding.primaryColor }}>
            <Globe className="w-3 h-3" /> Next-Gen HR Infrastructure
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] whitespace-pre-line">
            {hero.title}
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed whitespace-pre-line">
            {hero.subtitle}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 text-center">
             <a 
               href={hero.ctaLink} 
               target="_blank"
               rel="noopener noreferrer"
               className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all group"
             >
               {hero.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </a>
          </div>

          <div className="relative mt-20 max-w-5xl mx-auto rounded-3xl border border-white/10 bg-slate-900/50 p-2 shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 z-10" />
              <img 
                src={hero.mockupImg} 
                alt="HR Dashboard Mockup" 
                className="rounded-2xl w-full h-auto grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
              />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center">
           {stats.map((s, i) => (
             <div key={i} className="space-y-1">
               <div className="text-3xl font-bold text-white tracking-tight">{s.val}</div>
               <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
             </div>
           ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Everything you need to <span style={{ color: branding.primaryColor }}>scale</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto italic">Stop juggling spreadsheets and start managing your people with precision.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 transition-all group hover:border-slate-700" style={{ borderColor: 'var(--primary-soft)' }}>
                <div className="mb-6 bg-slate-900 p-3 rounded-2xl w-fit group-hover:bg-white/5 transition-colors">
                  <DynamicIcon name={f.icon} className="w-6 h-6" style={{ color: branding.primaryColor }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate HR Details Section */}
      <section className="py-32 bg-slate-900/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
               <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Master HR Management <br/><span className="text-blue-500">Without the Complexity</span></h2>
               <p className="text-slate-400 leading-relaxed">
                 Manage 10 to 10,000 employees with the same level of granular control. Our platform handles the "noisy" administrative tasks so you can focus on building your culture.
               </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
               {[
                 "Granular Role-Based Access Control",
                 "Automated Leave Compliance",
                 "Smart Loan & Advance Deduction",
                 "Interactive Attendance Reports"
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="bg-blue-500/20 p-1 rounded-full">
                     <CheckCircle2 className="w-4 h-4 text-blue-500" />
                   </div>
                   <span className="text-slate-300 font-medium">{item}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="relative p-6 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[60px] rounded-full" />
             <div className="space-y-6 relative z-10">
                <div className="bg-slate-950 p-6 rounded-3xl border border-white/10">
                   <div className="flex justify-between items-center mb-6">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Efficiency Metrices</div>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      {[
                        { label: "Payroll Processing", efficiency: "98%", color: "bg-blue-500" },
                        { label: "Attendance Accuracy", efficiency: "100%", color: "bg-emerald-500" },
                        { label: "Admin Time Saved", efficiency: "85%", color: "bg-purple-500" }
                      ].map((bar, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-400">{bar.label}</span>
                              <span className="text-white">{bar.efficiency}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className={`h-full ${bar.color} rounded-full`} style={{ width: bar.efficiency }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-blue-600 p-8 rounded-3xl text-white">
                   <p className="italic text-lg font-medium mb-4">"It transformed our chaotic payroll into a 10-minute task."</p>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20" />
                      <div>
                        <div className="font-bold text-sm">Sarah Jenkins</div>
                        <div className="text-xs text-blue-200">Head of Operations, TechFlow</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Simple, <span className="text-blue-500">Transparent</span> Plans</h2>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-500'}`}>Monthly</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-7 rounded-full bg-slate-800 p-1 relative transition-colors"
                aria-label="Toggle billing cycle"
              >
                <div className={`w-5 h-5 rounded-full bg-blue-600 transition-all duration-300 transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white font-bold' : 'text-slate-500'}`}>
                Yearly <span className="ml-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => {
              const isGrowth = plan.name.toLowerCase() === "growth" || (pricing.length === 3 && idx === 1);
              const priceNum = parseInt(plan.price.replace("$", ""));
              const price = billingCycle === "monthly" ? plan.price : `$${Math.round(priceNum * 12 * 0.8)}`;
              
              return (
                <div key={idx} className={`relative p-10 rounded-[40px] border transition-all space-y-8 ${
                  isGrowth 
                  ? "border-slate-700 shadow-2xl transform md:-translate-y-4" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
                }`} style={{ backgroundColor: isGrowth ? branding.primaryColor : undefined }}>
                  {isGrowth && (
                    <div className="absolute top-5 right-5 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest italic" style={{ color: branding.primaryColor }}>Most Popular</div>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className={`text-sm ${isGrowth ? "text-white/80" : "text-slate-400"}`}>Perfect for scaling teams.</p>
                  </div>
                  <div className="text-4xl font-bold text-white tracking-tight">
                    {price}
                    <span className={`text-sm font-normal ${isGrowth ? "text-white/60" : "text-slate-500"}`}>
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  <ul className="space-y-4">
                    <li className={`flex items-center gap-3 text-sm font-bold ${isGrowth ? "text-white" : ""}`} style={{ color: isGrowth ? undefined : branding.primaryColor }}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isGrowth ? "text-white" : ""}`} style={{ color: isGrowth ? undefined : branding.primaryColor }} /> 
                      Up to {plan.employees} Employees
                    </li>
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className={`flex items-center gap-3 text-sm ${isGrowth ? "text-white/90" : "text-slate-300"}`}>
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isGrowth ? "text-white text-blue-500" : ""}`} style={{ color: isGrowth ? undefined : branding.primaryColor }} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={hero.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-4 rounded-2xl font-bold transition-all shadow-lg ${
                      isGrowth ? "bg-white text-black hover:bg-slate-100" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    style={{ color: isGrowth ? branding.primaryColor : undefined }}
                  >
                    {hero.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
         <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[48px] bg-gradient-to-br from-blue-600 to-indigo-800 text-center space-y-8 shadow-2xl shadow-blue-900/40 relative overflow-hidden">
           <Lock className="absolute -left-10 -bottom-10 w-64 h-64 text-white/5" />
           <Building2 className="absolute -right-10 -top-10 w-64 h-64 text-white/5" />
           
           <h2 className="text-4xl md:text-5xl font-bold text-white relative z-10">Get Your Branded HR Portal Today</h2>
           <p className="text-blue-100 text-lg max-w-xl mx-auto relative z-10">
             Join 500+ forward-thinking companies who have modernized their HR experience.
           </p>
           <div className="pt-6 relative z-10">
             <a 
               href="https://wa.me/8801739748004" 
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-xl shadow-black/10"
             >
               Contact Support for Portal Setup
             </a>
           </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img src={branding.logo} alt="Logo" className="h-8 w-auto" />
            </div>
            <p className="max-w-xs text-sm text-slate-500">Empowering organizations with intelligent and intuitive HR infrastructure.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
             <div className="space-y-4">
                <div className="font-bold text-white">Product</div>
                <ul className="space-y-2 text-slate-500">
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Features</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Integrations</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Security</li>
                </ul>
             </div>
             <div className="space-y-4">
                <div className="font-bold text-white">Company</div>
                <ul className="space-y-2 text-slate-500">
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">About Us</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Blog</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacy</li>
                </ul>
             </div>
             <div className="space-y-4">
                <div className="font-bold text-white">Support</div>
                <ul className="space-y-2 text-slate-500">
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Contact</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Documentation</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors">Status</li>
                </ul>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
           &copy; {new Date().getFullYear()} AppDevs HR Framework · All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
