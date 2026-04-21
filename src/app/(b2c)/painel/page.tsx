import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import { CalendarDays, Bus, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { getCoverImage } from "@/lib/tour-images";

import { ConfirmEmailBanner } from "./ConfirmEmailBanner";

export default async function PainelClientePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const successMessage = searchParams?.success as string;
  const errorMessage = searchParams?.error as string;

  // 1. Perfil do Usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Minhas Reservas (Viagens)
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      excursions (
        departure_date,
        return_date,
        tour_packages (
          title,
          tour_package_images (
            url,
            is_cover,
            position
          )
        )
      ),
      passenger_tickets (id, full_name, seat_code)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fila de Espera
  const { data: waitlist } = await supabase
    .from("waitlist")
    .select(`
      *,
      excursions (
        departure_date,
        tour_packages (title)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PIX': return <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Aguardando PIX</span>;
      case 'APPROVED': return <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aprovada</span>;
      case 'EXPIRED': return <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Expirada</span>;
      case 'CANCELLED': return <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelada</span>;
      case 'REFUNDED': return <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">Reembolsada</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {errorMessage}
          </div>
        )}

        {!profile?.email_confirmed_at && (
          <ConfirmEmailBanner email={user.email!} />
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-cta text-on-cta flex items-center justify-center text-2xl font-bold shadow-md">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">Olá, {profile?.full_name?.split(" ")[0]}!</h1>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors shadow-sm">
              Buscar Viagens
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Reservas */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Bus className="w-6 h-6 text-primary" /> Minhas Viagens
            </h2>

            {reservations && reservations.length > 0 ? (
              <div className="space-y-4">
                {reservations.map((res: any) => {
                  const pkg = Array.isArray(res.excursions?.tour_packages) ? res.excursions.tour_packages[0] : res.excursions?.tour_packages;
                  const date = res.excursions?.departure_date;
                  const image = getCoverImage(pkg?.tour_package_images);
                  
                  return (
                    <div key={res.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row">
                      <div className="w-full sm:w-48 h-32 sm:h-auto relative">
                        <img src={image} alt={pkg?.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2">
                          {getStatusBadge(res.status)}
                        </div>
                      </div>
                      
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-on-surface leading-tight">{pkg?.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {formatDate(date)}</span>
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {res.passenger_tickets?.length} Passageiro(s)</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-extrabold text-primary">{formatBRL(res.total_amount)}</span>
                          
                          {res.status === 'PENDING_PIX' && (
                            <Link href={`/sucesso/${res.id}`} className="text-xs font-bold text-on-cta bg-cta px-3 py-1.5 rounded-lg shadow-sm hover:shadow-glow-cta transition-all">
                              Concluir Pagamento
                            </Link>
                          )}
                          {res.status === 'APPROVED' && (
                            <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all">
                              Ver Voucher
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center shadow-sm">
                <svg className="w-12 h-12 mx-auto text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-bold text-on-surface">Você ainda não possui viagens</h3>
                <p className="mt-2 text-sm text-on-surface-variant">Que tal planejar sua próxima aventura hoje mesmo?</p>
                <SmoothScrollLink href="/#excursoes" className="mt-6 inline-block px-6 py-2 rounded-xl gradient-cta text-on-cta font-bold shadow-sm hover:shadow-glow-cta transition-all">
                  Explorar Destinos
                </SmoothScrollLink>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: Waitlist e Configs */}
          <div className="space-y-8">
            
            {/* Waitlist Box */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" /> Fila de Espera
              </h3>
              
              {waitlist && waitlist.length > 0 ? (
                <div className="space-y-3">
                  {waitlist.map((w: any) => {
                    const title = Array.isArray(w.excursions?.tour_packages) ? w.excursions?.tour_packages[0]?.title : w.excursions?.tour_packages?.title;
                    return (
                      <div key={w.id} className="border border-outline-variant/50 rounded-xl p-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-on-surface">{title}</p>
                          <p className="text-xs text-on-surface-variant">{formatDate(w.excursions?.departure_date)}</p>
                        </div>
                        <div className="bg-surface-container px-2 py-1 rounded text-xs font-bold text-outline">
                          {w.requested_seats} vaga(s)
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-on-surface-variant mt-2">Avisaremos via WhatsApp se alguma vaga abrir.</p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant text-center py-4">Você não está em nenhuma fila de espera.</p>
              )}
            </div>

            {/* Quick Actions / Dependentes */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface mb-4">Minha Conta</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-sm font-medium text-on-surface flex items-center justify-between group">
                  <span>Meus Dados</span>
                  <span className="text-outline group-hover:text-primary">→</span>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-sm font-medium text-on-surface flex items-center justify-between group">
                  <span>Passageiros Salvos</span>
                  <span className="text-outline group-hover:text-primary">→</span>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-sm font-medium text-on-surface flex items-center justify-between group">
                  <span>Privacidade e Marketing</span>
                  <span className="text-outline group-hover:text-primary">→</span>
                </button>
                
                <form action={logout} className="pt-4 border-t border-outline-variant/30 mt-4">
                  <button type="submit" className="w-full text-center px-4 py-2 rounded-xl text-error text-sm font-bold hover:bg-error/10 transition-colors">
                    Sair da Conta
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
