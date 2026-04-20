import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { formatBRL, formatDate } from "@/lib/utils";
import { Bus, MapPin, CalendarDays, User, Printer } from "lucide-react";
import { PrintVoucherButton } from "./PrintVoucherButton";

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id } = await params;
  const supabase = await createClient();

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
  
  // Mask CPF for LGPD on the physical voucher as well
  const maskedCpf = `***.${ticket.cpf.substring(4, 7)}.***-**`;

  return (
    <div className="min-h-screen bg-surface py-8 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Botão de Imprimir (Escondido na impressão) */}
        <div className="flex justify-end mb-6 print:hidden">
          <PrintVoucherButton />
        </div>

        {/* Voucher Card */}
        <div className="bg-white border-2 border-outline-variant/30 rounded-3xl overflow-hidden shadow-lg print:shadow-none print:border-black print:rounded-none">
          
          {/* Header Ticket */}
          <div className="bg-primary p-6 text-on-primary flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 print:bg-black print:text-white">
            <div>
              <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                <Bus className="w-6 h-6" />
                <span className="font-extrabold tracking-widest uppercase text-sm opacity-80">ViajaEdu! Ticket</span>
              </div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-center sm:text-left">{title}</h1>
            </div>
            <div className="text-center sm:text-right">
              <span className="block text-xs opacity-80 uppercase tracking-wider mb-1">Poltrona</span>
              <span className="text-4xl font-black">{ticket.seat_code}</span>
            </div>
          </div>

          <div className="p-8 flex flex-col md:flex-row gap-8 items-center md:items-stretch">
            
            {/* Informações do Passageiro */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Passageiro</span>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  {ticket.full_name}
                </p>
                <p className="text-sm text-gray-500 ml-7">CPF: {maskedCpf}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Embarque</span>
                <p className="text-base font-bold text-gray-900 flex items-start gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  {formatDate(date)}
                </p>
                <p className="text-sm text-gray-500 ml-7 mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  {ticket.boarding_location_id || "Local Principal"}
                </p>
              </div>

              <div className="pt-4 border-t border-dashed border-gray-300">
                <span className="text-xs font-bold text-outline uppercase tracking-wider block mb-1">Comprador</span>
                <p className="text-sm text-gray-900">
                  {Array.isArray(ticket.reservations?.profiles) ? ticket.reservations?.profiles[0]?.full_name : ticket.reservations?.profiles?.full_name}
                </p>
                <p className="text-xs text-gray-500">Reserva: {ticket.reservation_id.split("-")[0].toUpperCase()}</p>
              </div>
            </div>

            {/* Divisória tracejada na tela */}
            <div className="hidden md:block w-px bg-dashed border-l-2 border-dashed border-gray-200"></div>
            <div className="block md:hidden h-px w-full bg-dashed border-t-2 border-dashed border-gray-200"></div>

            {/* Área do QR Code */}
            <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl print:bg-white border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Check-in Digital</span>
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <QRCodeSVG 
                  value={ticket.id} 
                  size={160} 
                  level="H"
                  includeMargin={true}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-400 mt-3">{ticket.id.split("-")[0]}</span>
            </div>

          </div>

          <div className="bg-gray-50 p-4 text-center border-t border-gray-100 print:bg-white">
            <p className="text-xs text-gray-500">
              Apresente este voucher impresso ou na tela do celular junto com um documento original com foto.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
