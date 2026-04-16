"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface CurrencyAmountProps {
  amount: number | string;
  className?: string;
}

export function CurrencyAmount({ amount, className = "" }: CurrencyAmountProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="font-bold">
        ৳{isVisible ? amount : "****"}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="p-1 hover:bg-slate-100 rounded-md transition text-slate-400 hover:text-indigo-600 focus:outline-none"
        title={isVisible ? "Hide amount" : "Show amount"}
      >
        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
