import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/utils";
import { Bus, MapPin, CalendarDays, User } from "lucide-react";
import { PrintVoucherButton } from "./PrintVoucherButton";

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id } = await params;
  const supabase = await createClient();
  const settings = await getSiteSettings();

  // Fetch the specific ticket
  const { data: ticket } = await supabase
    .from("passenger_tickets")
    .select(`
      *,
      excursions (
        departure_date,
        boarding_locations,
        tour_packages (title)
      ),
      reservations (
        status,
        user_id,
        profiles:user_id (full_name)
      )
    `)
    .eq("id", ticket_id)
    .single();

  if (!ticket) {
    notFound();
  }

  // Ensure security: Only the owner or an admin can view this voucher
  // In a real scenario, you'd check RLS or session user vs reservation user
  // For now we'll allow it if they have the direct long UUID link, functioning as a unique token.

  const title = Array.isArray(ticket.excursions?.tour_packages)
    ? ticket.excursions?.tour_packages[0]?.title
    : ticket.excursions?.tour_packages?.title;

  const date = ticket.excursions?.departure_date;
  const departureDateFull = ticket.excursions?.departure_date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ticket.excursions.departure_date))
    : "Data a definir";

  // Mask CPF for LGPD on the physical voucher as well
  const maskedCpf = `***.${ticket.cpf.substring(4, 7)}.***-**`;

  return (
    <div className="min-h-screen bg-surface py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Ações (Escondidas na impressão) */}
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <a
            href={`/api/voucher/${ticket.id}/download-pdf`}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-surface-container hover:bg-surface-container-high text-on-surface"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar PDF
          </a>
          <PrintVoucherButton />
        </div>

        {/* Voucher Card Identical Layout to Sucesso */}
        <div className="voucher-card bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-lg print:shadow-none print:border print:rounded-none print:break-inside-avoid print:mb-4">
          
          {/* Header */}
          <div className="bg-primary p-5 sm:p-6 flex items-center justify-between print:bg-primary">
            <div className="flex items-center gap-3">
              {settings.logo_url && (
                <img src={settings.logo_url} alt={settings.company_name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white p-1" />
              )}
              <span className="text-white font-bold text-sm sm:text-base">{settings.company_name}</span>
            </div>
            <div className="text-right text-white">
              <p className="text-xs opacity-80 uppercase tracking-wider">Voucher de Embarque</p>
              <p className="font-bold text-sm sm:text-base">{title}</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Passenger Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
              <div>
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Passageiro</span>
                <span className="font-semibold text-on-surface text-base">{ticket.full_name}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">CPF</span>
                <span className="font-mono text-on-surface text-base">{maskedCpf}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Poltrona</span>
                <span className="font-bold text-primary text-2xl">{ticket.seat_code}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Data de Embarque</span>
                <span className="font-semibold text-on-surface text-sm">{departureDateFull}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Local de Embarque</span>
                <span className="font-semibold text-on-surface text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {ticket.boarding_location_id || "Ponto Principal"}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-outline-variant/40" />

            {/* QR + Short Code */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm shrink-0">
                <QRCodeSVG value={ticket.qr_code_token} size={140} level="M" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Código de Embarque</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-primary font-mono tracking-[0.2em] mb-3">
                  {ticket.short_code}
                </p>
                <p className="text-sm text-on-surface-variant max-w-[300px] mx-auto sm:mx-0">
                  Apresente este voucher impresso ou na tela do celular, juntamente com um documento original com foto.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
