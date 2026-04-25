"use client";

import { QRCodeSVG } from "qrcode.react";

export type TicketData = {
  id: string;
  full_name: string;
  cpf: string;
  seat_code: string;
  qr_code_token: string;
  short_code: string;
  boarding_location_id: string | null;
};

interface VoucherCardProps {
  ticket: TicketData;
  tripTitle: string;
  departureDate: string;
  departureDateFull: string;
  companyName: string;
  logoUrl: string | null;
}

function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 11) return cpf;
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export default function VoucherCard({ ticket, tripTitle, departureDate, departureDateFull, companyName, logoUrl }: VoucherCardProps) {
  return (
    <div className="voucher-card bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-md print:shadow-none print:border print:rounded-none print:break-inside-avoid print:mb-4">
      {/* Header */}
      <div className="bg-primary p-4 sm:p-5 flex items-center justify-between print:bg-primary">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white p-1" />
          )}
          <span className="text-white font-bold text-sm sm:text-base">{companyName}</span>
        </div>
        <div className="text-right text-white">
          <p className="text-xs opacity-80 uppercase tracking-wider">Voucher de Embarque</p>
          <p className="font-bold text-sm">{tripTitle}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Passenger Info Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Passageiro</span>
            <span className="font-semibold text-on-surface">{ticket.full_name}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">CPF</span>
            <span className="font-mono text-on-surface">{maskCPF(ticket.cpf)}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Poltrona</span>
            <span className="font-bold text-primary text-lg">{ticket.seat_code}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Data de Embarque</span>
            <span className="font-semibold text-on-surface text-xs">{departureDateFull}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-outline-variant/40" />

        {/* QR + Short Code */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="bg-white p-3 rounded-2xl border border-outline-variant/20 shadow-sm">
            <QRCodeSVG value={ticket.qr_code_token} size={120} level="M" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Código de Embarque</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-primary font-mono tracking-[0.2em]">
              {ticket.short_code}
            </p>
            <p className="text-xs text-on-surface-variant mt-2 max-w-[250px]">
              Apresente este voucher ou informe o código ao motorista no embarque.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
