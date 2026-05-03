/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import { formatCPF, formatPhone, formatDate } from "@/lib/utils";
import RoleSelect from "./RoleSelect";
import ClientsSearchForm from "./ClientsSearchForm";
import { getUsersEmails } from "./actions";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestão de Clientes",
};

export default async function ClientesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const roleFilter = typeof searchParams.role === "string" ? searchParams.role : "ALL";
  const pageStr = typeof searchParams.page === "string" ? searchParams.page : "1";
  const page = parseInt(pageStr, 10) > 0 ? parseInt(pageStr, 10) : 1;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  // Fetch KPI Counts
  const [
    { count: totalCount },
    { count: clientsCount },
    { count: adminsCount },
    { count: agentsCount },
    { count: driversCount },
    { count: promotersCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "ADMIN"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "AGENT"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "DRIVER"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "PROMOTER"),
  ]);

  const stats = {
    total: totalCount || 0,
    clients: clientsCount || 0,
    admins: adminsCount || 0,
    agents: agentsCount || 0,
    drivers: driversCount || 0,
    promoters: promotersCount || 0,
  };

  // Main Query
  let query = supabase
    .from("profiles")
    .select("id, full_name, cpf, phone, role, email_confirmed_at, created_at, avatar_url", { count: "exact" });

  if (roleFilter !== "ALL") {
    query = query.eq("role", roleFilter);
  }

  if (q) {
    // Busca aproximada em text
    query = query.or(`full_name.ilike.%${q}%,cpf.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: profiles, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / limit);

  // Fetch Emails
  let emailsDict: Record<string, { email: string; banned_until: string | null }> = {};
  if (profiles && profiles.length > 0) {
    const uids = profiles.map(p => p.id);
    emailsDict = await getUsersEmails(uids);
  }

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Gestão de Usuários
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Todos os usuários do sistema. Gerencie roles, visualize perfis e monitore registros.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-on-surface" },
          { label: "Clientes", value: stats.clients, color: "text-primary" },
          { label: "Admins", value: stats.admins, color: "text-error" },
          { label: "Agentes", value: stats.agents, color: "text-secondary-dark" },
          { label: "Motoristas", value: stats.drivers, color: "text-success" },
          { label: "Promotores", value: stats.promoters, color: "text-cta" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 text-center">
            <p className="text-xs font-medium text-on-surface-variant">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <ClientsSearchForm />

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="py-3 px-6 text-sm font-semibold">Usuário</th>
                <th className="py-3 px-6 text-sm font-semibold">CPF</th>
                <th className="py-3 px-6 text-sm font-semibold">Telefone</th>
                <th className="py-3 px-6 text-sm font-semibold">Role</th>
                <th className="py-3 px-6 text-sm font-semibold">Desde</th>
                <th className="py-3 px-6 text-sm font-semibold">Email</th>
                <th className="py-3 px-6 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {error ? (
                <tr><td colSpan={7} className="py-12 text-center text-error">Erro ao carregar usuários.</td></tr>
              ) : !profiles || profiles.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-outline">Nenhum usuário encontrado.</td></tr>
              ) : (
                profiles.map(p => {
                  const adminData = emailsDict[p.id];
                  const email = adminData?.email || "—";
                  const isBanned = adminData?.banned_until ? new Date(adminData.banned_until) > new Date() : false;

                  return (
                    <tr key={p.id} className={`hover:bg-surface-container-low/50 transition-colors ${isBanned ? 'bg-error-light/10' : ''}`}>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-primary">
                              {getInitials(p.full_name || "?")}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-on-surface">{p.full_name}</p>
                              {isBanned && (
                                <span className="text-[10px] bg-error text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Suspenso</span>
                              )}
                            </div>
                            <p className="text-xs text-outline font-mono">{p.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-on-surface-variant whitespace-nowrap">{p.cpf ? formatCPF(p.cpf) : "—"}</td>
                      <td className="py-3 px-6 text-sm text-on-surface-variant whitespace-nowrap">{p.phone ? formatPhone(p.phone) : "—"}</td>
                      <td className="py-3 px-6">
                        <RoleSelect userId={p.id} initialRole={p.role} />
                      </td>
                      <td className="py-3 px-6 text-sm text-on-surface-variant">{formatDate(p.created_at)}</td>
                      <td className="py-3 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-on-surface">{email}</span>
                          {p.email_confirmed_at ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-success">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Verificado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-warning">Pendente</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <Link 
                          href={`/admin/clientes/${p.id}`}
                          className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-colors inline-block text-center whitespace-nowrap"
                        >
                          Gerenciar
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
            <span className="text-sm text-on-surface-variant">
              Mostrando página <span className="font-bold text-on-surface">{page}</span> de <span className="font-bold text-on-surface">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link 
                  href={`/admin/clientes?page=${page - 1}&q=${encodeURIComponent(q)}&role=${encodeURIComponent(roleFilter)}`}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
                >
                  Anterior
                </Link>
              ) : (
                <button disabled className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                  Anterior
                </button>
              )}
              {page < totalPages ? (
                <Link 
                  href={`/admin/clientes?page=${page + 1}&q=${encodeURIComponent(q)}&role=${encodeURIComponent(roleFilter)}`}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
                >
                  Próximo
                </Link>
              ) : (
                <button disabled className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                  Próximo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
