"use client";

import { useState } from "react";
import { MessageCircle, Phone, Copy, Check } from "lucide-react";

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
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div>
        <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          {contact.label}
        </h4>
        <p className="text-sm font-mono text-on-surface-variant ml-6 mt-1">
          {formatDisplayNumber(contact.number)}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-1">
        {contact.whatsapp && (
          <a
            href={`https://wa.me/${contact.number}?text=Olá, preciso de suporte.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
        <a
          href={`tel:+${contact.number}`}
          className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold"
        >
          <Phone className="w-4 h-4" />
          Ligar
        </a>
        <button
          onClick={handleCopy}
          className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-success">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
