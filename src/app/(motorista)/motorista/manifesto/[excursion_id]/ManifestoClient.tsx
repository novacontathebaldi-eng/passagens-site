"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  AlertCircle,
  QrCode,
} from "lucide-react";

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

  // Only count APPROVED passengers — consistent with check-in counter
  const approvedPassengers = passengers.filter(
    (p) => p.payment_status === "APPROVED"
  );
  const totalBoarded = approvedPassengers.filter(
    (p) => p.check_in_status === true
  ).length;
  const totalApproved = approvedPassengers.length;

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
    <div className="bg-surface min-h-[calc(100dvh-56px-64px)]">
      {/* Sticky Header — not overlapping content */}
      <div className="bg-surface-container-lowest sticky top-0 z-30 px-4 py-3 border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/motorista"
            className="text-on-surface-variant hover:text-primary p-1 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-on-surface text-base leading-tight truncate flex-1">
            {excursionTitle}
          </h1>
          <Link
            href={`/motorista/checkin/${excursionId}`}
            className="bg-cta text-on-cta p-2 rounded-xl shadow-sm active:scale-95 transition-transform"
            title="Ir para Check-in"
          >
            <QrCode className="w-5 h-5" />
          </Link>
        </div>

        {/* Progress Bar — only counts APPROVED */}
        <div className="mt-3">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-on-surface-variant">Embarcados</span>
            <span className="text-primary">
              {totalBoarded} / {totalApproved}
            </span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${
                  totalApproved > 0
                    ? (totalBoarded / totalApproved) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Passenger List — only APPROVED passengers shown */}
      <div className="p-4 space-y-3 pb-20">
        {approvedPassengers.length > 0 ? (
          approvedPassengers.map((passenger) => (
            <div
              key={passenger.ticket_id}
              className={`border rounded-2xl p-4 flex items-start gap-4 transition-all duration-300 shadow-sm ${
                passenger.check_in_status
                  ? "bg-success/5 border-success/30"
                  : "bg-surface-container-lowest border-outline-variant/30"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  passenger.check_in_status
                    ? "bg-success text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {passenger.check_in_status ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-on-surface text-sm truncate">
                  {passenger.full_name}
                </h3>

                <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                  {passenger.masked_cpf}
                </p>

                {/* Check-in timestamp */}
                {passenger.check_in_status && passenger.checked_in_at && (
                  <p className="text-xs text-success mt-1 font-medium">
                    Embarcou às {formatTime(passenger.checked_in_at)}
                  </p>
                )}

                {passenger.emergency_contact_phone && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-primary bg-primary/10 w-max px-2 py-0.5 rounded-md">
                    <Phone className="w-3 h-3" />
                    {passenger.emergency_contact_phone}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <p className="text-on-surface-variant">
              Nenhum passageiro confirmado ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
