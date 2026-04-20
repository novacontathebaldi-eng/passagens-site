import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";
import Link from "next/link";
import Countdown from "./Countdown";

type Params = Promise<{ reservation_id: string }>;

export default async function SucessoPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const reservationId = resolvedParams.reservation_id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  // Buscar Reserva
  const { data: reservation } = await supabase
    .from("reservations")
    .select(`
      *,
      excursions (
        departure_date,
        tour_packages (title)
      )
    `)
    .eq("id", reservationId)
    .single();

  if (!reservation || reservation.user_id !== user.id) {
    notFound();
  }

  // Buscar Global Settings para configs do PIX
  const { data: settings } = await supabase
    .from("global_settings")
    .select("*")
    .single();

  const isPending = reservation.status === "PENDING_PIX";
  const isApproved = reservation.status === "APPROVED";
  const isExpired = reservation.status === "EXPIRED";

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {isPending && (
          <div className="text-center animate-in fade-in zoom-in duration-500 mb-12">
            <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-on-surface mb-4">Pedido Reservado!</h1>
            <p className="text-lg text-on-surface-variant">Sua reserva foi criada com sucesso, mas <strong>ainda não está confirmada</strong>.</p>
          </div>
        )}

        {isApproved && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-success mb-4 flex items-center justify-center gap-3">
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reserva Confirmada!
            </h1>
            <p className="text-lg text-on-surface-variant">Sua vaga está garantida. Nos vemos no embarque!</p>
          </div>
        )}

        {isExpired && (
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-error mb-4">Reserva Expirada</h1>
            <p className="text-lg text-on-surface-variant">O tempo para pagamento esgotou e sua reserva foi cancelada.</p>
            <Link href="/" className="mt-4 inline-block px-6 py-2 rounded-xl gradient-cta text-on-cta font-bold hover:shadow-glow-cta transition-all">
              Buscar novas viagens
            </Link>
          </div>
        )}

        {isPending && (
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-xl relative overflow-hidden">
            {/* Banner superior */}
            <div className="absolute top-0 left-0 right-0 h-2 gradient-cta" />
            
            <div className="flex flex-col md:flex-row gap-8">
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-on-surface mb-2">Pague via PIX</h2>
                <p className="text-sm text-on-surface-variant mb-6">Utilize o QR Code ou a chave PIX abaixo para garantir sua vaga.</p>
                
                <div className="bg-surface-container p-6 rounded-2xl mb-6 flex flex-col items-center border border-outline-variant/50">
                  {settings?.pix_qr_code_url ? (
                    <img src={settings.pix_qr_code_url} alt="QR Code PIX" className="w-48 h-48 rounded-xl bg-white p-2 shadow-sm mb-4" />
                  ) : (
                    <div className="w-48 h-48 bg-outline/10 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-xs text-outline font-bold text-center">QR Code<br/>Indisponível</span>
                    </div>
                  )}
                  
                  <div className="w-full">
                    <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Chave PIX</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={settings?.pix_key || "chave-pix-nao-configurada"} 
                        className="w-full bg-surface px-4 py-3 rounded-xl border border-outline-variant text-sm font-medium outline-none text-on-surface"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-on-surface-variant">
                  <h3 className="font-bold text-primary mb-1">Valor Exato:</h3>
                  <p className="text-2xl font-extrabold text-on-surface">{formatBRL(reservation.total_amount)}</p>
                </div>
              </div>

              <div className="w-px bg-outline-variant/30 hidden md:block" />
              <hr className="md:hidden border-outline-variant/30" />

              <div className="flex-1 flex flex-col items-center justify-center md:items-start text-center md:text-left">
                <h2 className="text-xl font-bold text-on-surface mb-6">Tempo Restante</h2>
                
                <Countdown expiresAt={reservation.expires_at} />

                <div className="mt-8 space-y-4 w-full">
                  <p className="text-sm text-on-surface-variant font-medium">
                    Após o pagamento, envie o comprovante para nosso WhatsApp para aprovação imediata.
                  </p>
                  
                  <a 
                    href="https://wa.me/5511999999999" // TODO: usar do settings
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#1EBE5D] transition-colors text-center shadow-md flex justify-center items-center gap-2"
                  >
                    <span>📱</span> Enviar Comprovante
                  </a>
                  
                  <Link 
                    href="/painel"
                    className="block w-full py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface font-semibold text-center"
                  >
                    Ir para meu painel
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
