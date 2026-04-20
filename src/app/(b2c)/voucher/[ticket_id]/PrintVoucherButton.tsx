"use client";

import { Printer } from "lucide-react";

export function PrintVoucherButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
    >
      <Printer className="w-4 h-4" /> Imprimir Voucher
    </button>
  );
}
