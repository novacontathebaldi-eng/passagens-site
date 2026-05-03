import { createClient } from "@/lib/supabase/server";
import { formatCPF, formatPhone, formatDate, formatBRL } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUsersEmails } from "../actions";
import DangerZoneAdmin from "./DangerZoneAdmin";
import ClientNotes from "./ClientNotes";

export default async function ClientDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const clientId = params.id;
  const supabase = await createClient();

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. Fetch Admin User details (email, ban status)
  const emailsDict = await getUsersEmails([clientId]);
  const adminData = emailsDict[clientId];
  const email = adminData?.email || "—";
  const isBanned = adminData?.banned_until ? new Date(adminData.banned_until) > new Date() : false;

  // 3. Fetch Reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      id,
      status,
      total_amount,
      created_at,
      excursion_id,
      excursions (
        highlight_text,
        tour_packages ( title )
      )
    `)
    .eq("user_id", clientId)
    .order("created_at", { ascending: false });

  // 4. Calculate LTV (Life Time Value) - apenas Approved ou Completed
  const ltv = (reservations || [])
    .filter(r => r.status === "APPROVED" || r.status === "COMPLETED")
    .reduce((acc, curr) => acc + Number(curr.total_amount), 0);

  // 5. Fetch Notes
  const { data: notesData } = await supabase
    .from("client_notes")
    .select(`
      id,
      content,
      created_at,
      admin_id,
      profiles:admin_id ( full_name )
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const notes = (notesData || []).map((n: any) => ({
    id: n.id,
    content: n.content,
    created_at: n.created_at,
    admin_id: n.admin_id,
    admin_name: n.profiles?.full_name,
  }));

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/clientes"
          className="p-2 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface flex items-center gap-3">
            Perfil do Cliente
            {isBanned && (
              <span className="text-xs bg-error text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm">Suspenso</span>
            )}
          </h1>
          <p className="text-on-surface-variant text-sm font-mono mt-1">ID: {clientId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 flex flex-col items-center text-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover shadow-md mb-4 ring-4 ring-surface-container-low" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-container text-primary flex items-center justify-center text-3xl font-bold shadow-md mb-4 ring-4 ring-surface-container-low">
                {getInitials(profile.full_name || "?")}
              </div>
            )}
            
            <h2 className="text-xl font-bold text-on-surface">{profile.full_name}</h2>
            <div className="inline-flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded-md text-on-surface-variant uppercase tracking-wider">
                {profile.role}
              </span>
              {profile.email_confirmed_at ? (
                <span className="text-[10px] font-bold text-success uppercase tracking-wider bg-success-light/20 px-2.5 py-1 rounded-md">Verificado</span>
              ) : (
                <span className="text-[10px] font-bold text-warning uppercase tracking-wider bg-warning-light/20 px-2.5 py-1 rounded-md">Email Pendente</span>
              )}
            </div>

            <div className="w-full mt-6 space-y-4 text-left">
              <div>
                <p className="text-xs font-medium text-outline">Email (Conta)</p>
                <p className="text-sm font-semibold text-on-surface">{email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-outline">Telefone (WhatsApp)</p>
                <p className="text-sm font-semibold text-on-surface">{profile.phone ? formatPhone(profile.phone) : "Não informado"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-outline">CPF</p>
                <p className="text-sm font-semibold text-on-surface font-mono">{profile.cpf ? formatCPF(profile.cpf) : "Não informado"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-outline">Data de Cadastro</p>
                <p className="text-sm font-semibold text-on-surface">{formatDate(profile.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-outline">Aceita Marketing</p>
                <p className="text-sm font-semibold text-on-surface">{profile.accepts_marketing ? "Sim" : "Não"}</p>
              </div>
            </div>
          </div>

          <ClientNotes clientId={clientId} initialNotes={notes} />
          
          <DangerZoneAdmin uid={clientId} isBanned={isBanned} />
        </div>

        {/* Right Column: Financial & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LTV & Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface-variant">Lifetime Value (LTV)</p>
                <p className="text-3xl font-bold text-primary mt-1">{formatBRL(ltv)}</p>
                <p className="text-xs text-outline mt-1">Soma de pedidos aprovados</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-light/20 flex items-center justify-center text-primary">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface-variant">Total de Reservas</p>
                <p className="text-3xl font-bold text-on-surface mt-1">{reservations?.length || 0}</p>
                <p className="text-xs text-outline mt-1">Pedidos registrados</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/30">
              <h3 className="text-lg font-bold text-on-surface">Histórico de Compras</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                    <th className="py-3 px-6 text-sm font-semibold">Excursão</th>
                    <th className="py-3 px-6 text-sm font-semibold">Data</th>
                    <th className="py-3 px-6 text-sm font-semibold">Valor</th>
                    <th className="py-3 px-6 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {!reservations || reservations.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-outline">Nenhuma compra registrada.</td></tr>
                  ) : (
                    reservations.map(res => {
                      // Status Styles
                      const statusStyles = {
                        PENDING_PIX: "bg-warning-light/20 text-warning border-warning/20",
                        AWAITING_MANUAL_CHECK: "bg-secondary-container text-on-secondary-container border-secondary/20",
                        APPROVED: "bg-success-light/20 text-success border-success/20",
                        COMPLETED: "bg-primary-container text-primary border-primary/20",
                        REFUNDED: "bg-surface-container-low text-on-surface-variant border-outline-variant",
                        CANCELLED: "bg-error-light/10 text-error border-error/20",
                        EXPIRED: "bg-surface-container-low text-on-surface-variant border-outline-variant",
                      }[res.status as keyof typeof statusLabels] || "bg-surface text-on-surface";

                      const statusLabels = {
                        PENDING_PIX: "Aguardando PIX",
                        AWAITING_MANUAL_CHECK: "Em Análise",
                        APPROVED: "Aprovado",
                        COMPLETED: "Concluído",
                        REFUNDED: "Reembolsado",
                        CANCELLED: "Cancelado",
                        EXPIRED: "Expirado",
                      };

                      return (
                        <tr key={res.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-sm text-on-surface">
                              {(res.excursions as any)?.tour_packages?.title || "Excursão Removida"}
                            </p>
                            <p className="text-xs text-outline mt-0.5">
                              {(res.excursions as any)?.highlight_text || ""}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-sm text-on-surface-variant">{formatDate(res.created_at)}</td>
                          <td className="py-4 px-6 text-sm font-bold text-on-surface">{formatBRL(res.total_amount)}</td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${statusStyles}`}>
                              {statusLabels[res.status as keyof typeof statusLabels] || res.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
