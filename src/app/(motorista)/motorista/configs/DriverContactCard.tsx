"use client";

import { useState } from "react";
import { MessageCircle, Phone, Copy, Check, Headphones } from "lucide-react";

interface DriverContact {
  id: string;
  label: string;
  number: string;
  whatsapp: boolean;
}

export function DriverContactCard({ contact }: { contact: DriverContact }) {
  const [copied, setCopied] = useState(false);

  // Format number for display: (XX) XXXXX-XXXX
  // Assuming number is at least 10 digits and has DDI (e.g. 5527999999999)
  const formatDisplayNumber = (num: string) => {
    const withoutDDI = num.startsWith("55") ? num.substring(2) : num;
    if (withoutDDI.length === 11) {
      return `(${withoutDDI.substring(0, 2)}) ${withoutDDI.substring(2, 7)}-${withoutDDI.substring(7)}`;
    }
    if (withoutDDI.length === 10) {
      return `(${withoutDDI.substring(0, 2)}) ${withoutDDI.substring(2, 6)}-${withoutDDI.substring(6)}`;
    }
    return num;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatDisplayNumber(contact.number));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  return (
    <div className="bg-white rounded-[1rem] p-5 shadow-[0_8px_30px_rgba(25,28,30,0.04)] flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 group-hover:bg-cyan-200 transition-colors shrink-0">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{contact.label}</h3>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">
            {formatDisplayNumber(contact.number)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`tel:+${contact.number}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-[#1E40AF]/10 hover:text-[#1E40AF] transition-colors"
          title="Ligar"
        >
          <Phone className="w-5 h-5" />
        </a>
        
        {contact.whatsapp && (
          <a
            href={`https://wa.me/${contact.number}?text=Olá, preciso de suporte.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-green-100 hover:text-green-600 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        )}
        
        <button
          onClick={handleCopy}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-[#1E40AF]/10 hover:text-[#1E40AF] transition-colors"
          title="Copiar"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
