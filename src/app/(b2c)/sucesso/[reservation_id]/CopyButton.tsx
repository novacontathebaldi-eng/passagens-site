"use client";

import { useState } from "react";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export default function CopyButton({ textToCopy, label = "Copiar", className = "", iconOnly = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 transition-colors focus:outline-none ${className}`}
      title={label}
    >
      {copied ? (
        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {!iconOnly && (
        <span>{copied ? "Copiado!" : label}</span>
      )}
    </button>
  );
}
