"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/utils";
import Link from "next/link";
import Countdown from "./Countdown";
import CopyButton from "./CopyButton";
import VoucherCard, { type TicketData } from "./VoucherCard";
import VoucherActions from "./VoucherActions";
import type { PixKeyEntry } from "@/lib/get-settings";

interface SucessoClientProps {
  reservationId: string;
  initialStatus: string;
  totalAmount: number;
  expiresAt: string;
  tripTitle: string;
  departureDate: string;
  departureDateFull: string;
  coverImage: string;
  shortId: string;
  whatsappNumber: string;
  userEmail: string;
  initialTickets: TicketData[];
  settings: {
    company_name: string;
    logo_url: string | null;
    pix_qr_code_url: string | null;
    pix_instructions: string | null;
    pix_keys: PixKeyEntry[] | null;
    pix_copy_paste: string | null;
    bank_name: string | null;
    bank_account_holder: string | null;
    bank_cpf: string | null;
    bank_agency: string | null;
    bank_account: string | null;
    bank_transfer_instructions: string | null;
    cancellation_policy_text: string | null;
  };
}

export default function SucessoClient({
  reservationId, initialStatus, totalAmount, expiresAt,
  tripTitle, departureDate, departureDateFull, coverImage,
  shortId, whatsappNumber, userEmail, initialTickets, settings,
}: SucessoClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [tickets, setTickets] = useState<TicketData[]>(initialTickets);
  const [justApproved, setJustApproved] = useState(false);

  const isPending = status === "PENDING_PIX" || status === "AWAITING_MANUAL_CHECK";
  const isApproved = status === "APPROVED";
  const isExpired = status === "EXPIRED";
  const isCancelled = status === "CANCELLED" || status === "REFUNDED";

  // Real-time listener for reservation status changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`reservation-${reservationId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "reservations",
        filter: `id=eq.${reservationId}`,
      }, async (payload) => {
        const newStatus = payload.new.status;
        if (newStatus && newStatus !== status) {
          setStatus(newStatus);

          // If just approved, fetch tickets (they may have been created/updated)
          if (newStatus === "APPROVED") {
            setJustApproved(true);
            const { data } = await supabase
              .from("passenger_tickets")
              .select("id, full_name, cpf, seat_code, qr_code_token, short_code, boarding_location_id")
              .eq("reservation_id", reservationId)
              .order("created_at", { ascending: true });
            if (data) setTickets(data);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reservationId, status]);

  const zapMessage = encodeURIComponent(
    `Olá! Gostaria de confirmar meu pagamento.\n\nPedido: #${shortId}\nDestino: ${tripTitle}\nData: ${departureDate}\nValor: ${formatBRL(totalAmount)}`
  );
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${zapMessage}` : "#";
  const helpMessage = encodeURIComponent(`Olá! Preciso de ajuda com a minha reserva.\n\nPedido: #${shortId}`);
  const whatsappHelpUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${helpMessage}` : "#";

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* --- HEADER: PENDING --- */}
        {isPending && (
          <div className="text-center animate-in fade-in zoom-in duration-500 mb-8">
            <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface mb-2">Pedido Reservado!</h1>
            <p className="text-on-surface-variant">Sua reserva foi criada com sucesso, mas <strong>ainda não está confirmada</strong>.</p>
          </div>
        )}

        {/* --- HEADER: APPROVED --- */}
        {isApproved && (
          <div className={`text-center mb-8 ${justApproved ? "animate-in fade-in zoom-in duration-700" : ""}`}>
            <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-success mb-2">Reserva Confirmada!</h1>
            <p className="text-on-surface-variant">Sua vaga está garantida. Nos vemos no embarque!</p>
          </div>
        )}

        {/* --- HEADER: EXPIRED --- */}
        {isExpired && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-error mb-4">Reserva Expirada</h1>
            <p className="text-lg text-on-surface-variant">O tempo para pagamento esgotou e sua reserva foi cancelada.</p>
            <Link href="/" className="mt-4 inline-block px-6 py-2 rounded-xl gradient-cta text-on-cta font-bold hover:shadow-glow-cta transition-all">Buscar novas viagens</Link>
          </div>
        )}

        {/* --- HEADER: CANCELLED/REFUNDED --- */}
        {isCancelled && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-error mb-4">{status === "REFUNDED" ? "Reserva Reembolsada" : "Reserva Cancelada"}</h1>
            <p className="text-lg text-on-surface-variant">{status === "REFUNDED" ? "O valor será devolvido conforme a política de reembolso." : "Esta reserva foi cancelada."}</p>
            <Link href="/" className="mt-4 inline-block px-6 py-2 rounded-xl gradient-cta text-on-cta font-bold hover:shadow-glow-cta transition-all">Buscar novas viagens</Link>
          </div>
        )}

        {/* --- CONTENT: APPROVED (Vouchers) --- */}
        {isApproved && tickets.length > 0 && (
          <div className={`space-y-6 ${justApproved ? "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300" : ""}`}>
            {/* Trip summary mini card */}
            <div className="no-print bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 flex items-center gap-4 shadow-sm">
              <img src={coverImage} alt={tripTitle} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-xs text-on-surface-variant">Pedido #{shortId}</p>
                <h2 className="font-bold text-on-surface">{tripTitle}</h2>
                <p className="text-xs text-on-surface-variant">{departureDate} • {formatBRL(totalAmount)}</p>
              </div>
            </div>

            {/* Voucher cards */}
            {tickets.map((ticket) => (
              <VoucherCard
                key={ticket.id}
                ticket={ticket}
                tripTitle={tripTitle}
                departureDate={departureDate}
                departureDateFull={departureDateFull}
                companyName={settings.company_name}
                logoUrl={settings.logo_url}
              />
            ))}

            {/* Action buttons */}
            <VoucherActions
              reservationId={reservationId}
              userEmail={userEmail}
            />
          </div>
        )}

        {/* --- CONTENT: PENDING (Payment) --- */}
        {isPending && (
          <div className="space-y-6">
            {/* Trip Summary Card */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
              <div className="h-32 sm:h-48 w-full relative">
                <img src={coverImage} alt={tripTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6 text-white flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-white/80 drop-shadow-md">Pedido #{shortId}</p>
                    <h2 className="text-xl sm:text-2xl font-bold !text-white drop-shadow-md">{tripTitle}</h2>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm flex items-center gap-1 sm:justify-end text-white/90 drop-shadow-md">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {departureDate}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-surface-container-lowest flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Valor Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">{formatBRL(totalAmount)}</span>
                  <CopyButton textToCopy={totalAmount.toString()} iconOnly className="text-primary hover:text-primary-dark p-2 bg-primary/10 rounded-lg transition-colors" label="Copiar Valor Exato" />
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Payment Details */}
              <div className="md:col-span-8 space-y-6">
                <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    <h2 className="text-2xl font-bold text-on-surface">Pague via PIX</h2>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                    {settings.pix_qr_code_url && (
                      <div className="w-full sm:w-auto flex flex-col items-center">
                        <img src={settings.pix_qr_code_url} alt="QR Code PIX" className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-white p-3 border border-outline-variant/30 mb-2" />
                        <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase">Escaneie o QR Code</span>
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-4">
                      {settings.pix_instructions && (
                        <p className="text-sm text-on-surface-variant bg-surface-container p-3 rounded-xl">{settings.pix_instructions}</p>
                      )}
                      {settings.pix_keys && settings.pix_keys.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Chaves Disponíveis</h3>
                          {settings.pix_keys.map((pk, idx) => (
                            <div key={idx} className="bg-surface rounded-xl p-3 border border-outline-variant/50 flex justify-between items-center gap-4">
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">{pk.label}</p>
                                <div className="font-mono text-sm text-on-surface font-semibold break-all">{pk.key}</div>
                              </div>
                              <CopyButton textToCopy={pk.key} iconOnly className="text-primary hover:text-primary-dark p-2 rounded-lg hover:bg-primary/10 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                      {settings.pix_copy_paste && (
                        <div className="pt-2 border-t border-outline-variant/20">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">PIX Copia e Cola</h3>
                            <CopyButton textToCopy={settings.pix_copy_paste} className="text-xs font-bold text-primary hover:text-primary-dark" label="Copiar Código" />
                          </div>
                          <textarea readOnly value={settings.pix_copy_paste} className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-xs font-mono text-on-surface-variant outline-none resize-none" rows={3} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-outline-variant/30">
                    <p className="text-center text-sm font-semibold text-on-surface mb-4">Já efetuou o pagamento?</p>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1EBE5D] transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                      Confirmar Pagamento no WhatsApp
                    </a>
                  </div>
                </div>

                {(settings.bank_name || settings.bank_account || settings.bank_cpf) && (
                  <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
                    <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                      Ou transfira via TED/DOC
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {settings.bank_name && <div><span className="block text-on-surface-variant text-xs">Banco</span><span className="font-semibold text-on-surface">{settings.bank_name}</span></div>}
                      {settings.bank_agency && <div><span className="block text-on-surface-variant text-xs">Agência</span><span className="font-semibold text-on-surface">{settings.bank_agency}</span></div>}
                      {settings.bank_account && <div><span className="block text-on-surface-variant text-xs">Conta</span><span className="font-semibold text-on-surface">{settings.bank_account}</span></div>}
                      {settings.bank_account_holder && <div><span className="block text-on-surface-variant text-xs">Titular</span><span className="font-semibold text-on-surface">{settings.bank_account_holder}</span></div>}
                      {settings.bank_cpf && <div><span className="block text-on-surface-variant text-xs">Documento</span><span className="font-semibold text-on-surface">{settings.bank_cpf}</span></div>}
                    </div>
                    {settings.bank_transfer_instructions && (
                      <p className="mt-4 text-xs text-on-surface-variant bg-surface-container p-3 rounded-lg">{settings.bank_transfer_instructions}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Timer & Help */}
              <div className="md:col-span-4 space-y-6">
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm text-center">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">Tempo para Pagamento</h3>
                  <Countdown expiresAt={expiresAt} />
                  <p className="text-xs text-on-surface-variant mt-4">As poltronas serão liberadas se o pagamento não for confirmado neste prazo.</p>
                </div>
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
                  <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Precisa de ajuda?
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-4">Problemas com o pagamento ou dúvidas sobre a reserva? Nossa equipe está pronta para ajudar.</p>
                  <a href={whatsappHelpUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl border border-outline-variant/50 hover:bg-surface-container transition-colors text-sm font-semibold text-on-surface flex justify-center items-center gap-2">Falar com Suporte</a>
                </div>
                {settings.cancellation_policy_text && (
                  <div className="p-4 bg-surface rounded-2xl border border-outline-variant/20">
                    <h4 className="text-xs font-bold text-on-surface uppercase mb-2">Política de Cancelamento</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{settings.cancellation_policy_text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
