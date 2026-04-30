"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  QrCode,
  ClipboardCheck,
  Users,
  Share2
} from "lucide-react";
import VistoriaForm from "./VistoriaForm";

interface Passenger {
  ticket_id: string;
  excursion_id: string;
  seat_code: string;
  full_name: string;
  masked_cpf: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  boarding_location_id: string | null;
  check_in_status: boolean;
  checked_in_at: string | null;
  qr_code_token: string;
  short_code: string;
  payment_status: string;
}

interface ManifestoClientProps {
  initialPassengers: Passenger[];
  excursionId: string;
  excursionTitle: string;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ManifestoClient({
  initialPassengers,
  excursionId,
  excursionTitle,
}: ManifestoClientProps) {
  const [passengers, setPassengers] = useState<Passenger[]>(initialPassengers);
  const [activeTab, setActiveTab] = useState<"manifesto" | "ocorrencias">("manifesto");
  const [isReportCompleted, setIsReportCompleted] = useState<boolean>(false);
  const [filter, setFilter] = useState<"todos" | "faltantes" | "embarcados">("todos");

  // Only count APPROVED passengers
  const approvedPassengers = passengers.filter(
    (p) => p.payment_status === "APPROVED"
  );
  const totalBoarded = approvedPassengers.filter(
    (p) => p.check_in_status === true
  ).length;
  const totalApproved = approvedPassengers.length;
  const progressPercentage = totalApproved > 0 ? (totalBoarded / totalApproved) * 100 : 0;

  const filteredPassengers = approvedPassengers.filter((p) => {
    if (filter === "todos") return true;
    if (filter === "faltantes") return !p.check_in_status;
    if (filter === "embarcados") return p.check_in_status;
    return true;
  });

  const handleShareReport = () => {
    const missing = approvedPassengers.filter(p => !p.check_in_status);
    const date = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    
    let text = `🚍 *Relatório de Embarque*\n`;
    text += `📍 *${excursionTitle}*\n`;
    text += `✅ Embarcados: ${totalBoarded}/${totalApproved}\n`;
    
    if (missing.length > 0) {
      text += `\n⏳ *Faltam (${missing.length}):*\n`;
      missing.forEach(p => {
        text += `- P${p.seat_code}: ${p.full_name}\n`;
      });
    } else {
      text += `\n🎉 *Todos os passageiros embarcados!*\n`;
    }
    
    text += `\n⏱️ Gerado em: ${date}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // ── Real-time updates via Supabase channel ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`manifesto-${excursionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "passenger_tickets",
          filter: `excursion_id=eq.${excursionId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            check_in_status: boolean;
            checked_in_at: string | null;
          };
          setPassengers((prev) =>
            prev.map((p) =>
              p.ticket_id === updated.id
                ? {
                    ...p,
                    check_in_status: updated.check_in_status,
                    checked_in_at: updated.checked_in_at,
                  }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [excursionId]);

  return (
    <div className="min-h-[calc(100dvh-56px-64px)] relative">
      {/* Sticky Header and Tabs */}
      <div className="bg-white sticky top-[72px] z-30 px-4 md:px-6 py-3 md:py-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-b border-slate-200 -mx-4 md:-mx-0 md:rounded-t-[2rem]">
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/motorista"
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-slate-800" />
          </Link>
          <h1 className="font-headline font-bold text-base md:text-lg text-slate-900 leading-tight truncate flex-1 tracking-tight">
            {excursionTitle}
          </h1>
          <button
            onClick={handleShareReport}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-green-50 hover:bg-green-100 rounded-full transition-colors active:scale-95 text-green-600 shrink-0"
            title="Compartilhar Relatório no WhatsApp"
          >
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 md:mt-5">
          <div className="flex justify-between items-end mb-1 md:mb-2">
            <span className="text-slate-500 font-label text-[10px] md:text-xs uppercase tracking-wider font-bold">Embarcados</span>
            <span className="font-headline font-bold text-blue-800 leading-none">
              <span className="text-base md:text-lg">{totalBoarded}</span>
              <span className="text-xs md:text-sm text-slate-400 mx-1">/</span>
              <span className="text-xs md:text-sm text-slate-500">{totalApproved}</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 md:h-2 overflow-hidden shadow-inner">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("manifesto")}
            className={`pb-2 md:pb-3 text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 transition-all border-b-2 ${
              activeTab === "manifesto"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Passageiros
          </button>
          <button
            onClick={() => setActiveTab("ocorrencias")}
            className={`pb-2 md:pb-3 text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 transition-all border-b-2 relative ${
              activeTab === "ocorrencias"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Ocorrências
            {!isReportCompleted && (
              <span className="absolute top-0.5 -right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            )}
          </button>
        </div>
      </div>

      {activeTab === "manifesto" ? (
        <div className="pt-6 px-1 md:px-0 space-y-4 pb-36">
          {/* Filtros Rápidos */}
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilter("todos")}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === "todos" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({totalApproved})
            </button>
            <button
              onClick={() => setFilter("faltantes")}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === "faltantes" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Faltam ({totalApproved - totalBoarded})
            </button>
            <button
              onClick={() => setFilter("embarcados")}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === "embarcados" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Embarcados ({totalBoarded})
            </button>
          </div>

          {filteredPassengers.length > 0 ? (
            filteredPassengers.map((passenger) => (
              <div
                key={passenger.ticket_id}
                className={`rounded-3xl p-4 md:p-5 flex items-center gap-4 transition-all duration-300 shadow-[0_4px_16px_rgb(25,28,30,0.04)] border ${
                  passenger.check_in_status
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-transparent hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${
                    passenger.check_in_status
                      ? "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {passenger.seat_code}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-headline font-bold text-slate-900 text-base truncate">
                      {passenger.full_name}
                    </h3>
                    {passenger.check_in_status ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-1 font-body">
                    CPF: {passenger.masked_cpf}
                  </p>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {/* Check-in timestamp */}
                    {passenger.check_in_status && passenger.checked_in_at && (
                      <div className="text-[11px] font-bold tracking-wide uppercase text-green-700 bg-green-100 px-2 py-1 rounded-md">
                        Embarcou às {formatTime(passenger.checked_in_at)}
                      </div>
                    )}

                    {passenger.emergency_contact_phone && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                        <Phone className="w-3 h-3" />
                        {passenger.emergency_contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 mx-auto rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-headline font-bold text-lg text-slate-900 mb-2">Nenhum passageiro</h3>
              <p className="text-slate-500">
                Nenhum passageiro encontrado para este filtro.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-6 px-1 md:px-0 pb-36">
          <VistoriaForm excursionId={excursionId} onStatusChange={(status) => setIsReportCompleted(status)} />
        </div>
      )}

      {/* FAB - Botão Flutuante de Atalho */}
      <Link
        href={`/motorista/checkin/${excursionId}`}
        className="fixed bottom-32 md:bottom-28 right-6 w-14 h-14 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full shadow-[0_8px_24px_rgb(249,115,22,0.4)] flex items-center justify-center transition-transform active:scale-90 z-40 group"
        title="Escanear QR Code"
      >
        <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </Link>
    </div>
  );
}
