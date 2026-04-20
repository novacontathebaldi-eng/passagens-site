"use client";

import { useState } from "react";
import { ArrowLeft, Camera, QrCode, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CheckinPage() {
  const params = useParams();
  const excursionId = params.excursion_id as string;
  const [manualCode, setManualCode] = useState("");

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Header */}
      <div className="bg-surface-container-lowest sticky top-14 z-30 px-4 py-4 border-b border-outline-variant/30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/motorista" className="text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-on-surface text-lg">Check-in</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* QR Scanner Area (Placeholder) */}
        <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center aspect-square shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5 z-0"></div>
          
          <div className="relative z-10 w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 animate-pulse">
            <Camera className="w-12 h-12" />
          </div>
          
          <h2 className="text-xl font-bold text-on-surface mb-2">Leitor de QR Code</h2>
          <p className="text-sm text-on-surface-variant max-w-[250px]">
            Aponte a câmera para o QR Code no voucher do passageiro.
          </p>
          
          <button className="mt-8 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md w-full max-w-[200px]">
            Ativar Câmera
          </button>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-outline-variant/30 flex-1"></div>
          <span className="text-xs font-bold text-outline uppercase tracking-widest">Ou manual</span>
          <div className="h-px bg-outline-variant/30 flex-1"></div>
        </div>

        {/* Manual Input */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
          <label className="block text-sm font-bold text-on-surface mb-2">
            Código do Voucher
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <QrCode className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: VJD-A8F2"
                className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono uppercase"
              />
            </div>
            <button className="px-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors flex items-center justify-center">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
