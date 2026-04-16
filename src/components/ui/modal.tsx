"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-[2.5rem] bg-white shadow-soft-2xl my-auto md:my-8 overflow-hidden">
        {/* Header - Sticky */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between gap-4 bg-white border-b border-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-slate-400 italic">{description}</p> : null}
          </div>
          <button 
            onClick={onClose} 
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:rotate-90 transition-all duration-300 border border-slate-100 group"
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={3} />
          </button>
        </div>
        
        {/* Body - Scrollable if needed */}
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
