import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";
import Link from "next/link";

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  PENDING_PIX: "bg-warning-light text-warning",
  AWAITING_MANUAL_CHECK: "bg-primary-container text-primary",
  APPROVED: "bg-success-light text-success",
  REFUNDED: "bg-surface-container text-on-surface-variant",
  CANCELLED: "bg-error-light text-error",
  EXPIRED: "bg-surface-container text-outline",
};

const EXCURSION_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-surface-container text-outline",
  PUBLISHED: "bg-success-light text-success",
  SOLD_OUT: "bg-error-light text-error",
  IN_PROGRESS: "bg-primary-container text-primary",
  COMPLETED: "bg-surface-container-high text-on-surface-variant",
  CANCELLED: "bg-error-light text-error",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch all KPIs in parallel
  const [
    { count: totalExcursions },
    { count: publishedExcursions },
    { count: totalReservations },
    { count: pendingReservations },
    { count: approvedReservations },
    { count: totalClients },
    { data: revenueData },
    { data: recentExcursions },
    { data: recentReservations },
  ] = await Promise.all([
    supabase.from("excursions").select("*", { count: "exact", head: true }),
    supabase
      .from("excursions")
      .select("*", { count: "exact", head: true })
      .eq("status", "PUBLISHED"),
    supabase.from("reservations").select("*", { count: "exact", head: true }),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING_PIX"),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "APPROVED"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CLIENT"),
    supabase
      .from("reservations")
      .select("total_amount")
      .eq("status", "APPROVED"),
    supabase
      .from("excursions")
      .select(
        `
        id, status, price_per_seat, departure_date, highlight_text,
        tour_packages (title, slug, category)
      `
      )
      .order("departure_date", { ascending: true })
      .limit(5),
    supabase
      .from("reservations")
      .select(
        `
        id, status, total_amount, created_at,
        profiles (full_name),
        excursions (tour_packages (title))
      `
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalRevenue = (revenueData || []).reduce(
    (sum, r) => sum + Number(r.total_amount),
    0
  );

  const kpis = [
    {
      icon: "🚌",
      label: "Excursões Ativas",
      value: publishedExcursions ?? 0,
      sub: `${totalExcursions ?? 0} total`,
      color: "text-primary",
      bgColor: "bg-primary-container/30",
    },
    {
      icon: "🎫",
      label: "Reservas Pendentes",
      value: pendingReservations ?? 0,
      sub: `${totalReservations ?? 0} total`,
      color: "text-warning",
      bgColor: "bg-warning-light/50",
    },
    {
      icon: "✅",
      label: "Reservas Aprovadas",
      value: approvedReservations ?? 0,
      sub: "confirmadas",
      color: "text-success",
      bgColor: "bg-success-light/50",
    },
    {
      icon: "💰",
      label: "Faturamento",
      value: formatBRL(totalRevenue),
      sub: "receita aprovada",
      color: "text-primary",
      bgColor: "bg-primary-container/30",
    },
    {
      icon: "👥",
      label: "Clientes",
      value: totalClients ?? 0,
      sub: "cadastrados",
      color: "text-secondary",
      bgColor: "bg-secondary-container/30",
    },
  ];

  const formatDateShort = (d: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(d));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Visão geral do ViajaEdu! — Atualizado em tempo real
          </p>
        </div>
        <Link
          href="/admin/excursoes"
          className="hidden sm:inline-flex px-4 py-2 rounded-xl gradient-cta text-on-cta text-sm font-semibold shadow-sm hover:shadow-glow-cta transition-all"
        >
          + Nova Excursão
        </Link>
      </div>

      {/* KPI Cards — Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bgColor} rounded-2xl p-5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <p
              className={`text-2xl lg:text-3xl font-bold mt-3 ${kpi.color}`}
            >
              {kpi.value}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">
              {kpi.label}
            </p>
            <p className="text-[10px] text-outline mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Excursions */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h2 className="font-bold text-on-surface">Próximas Excursões</h2>
            <Link
              href="/admin/excursoes"
              className="text-xs text-primary font-medium hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {recentExcursions && recentExcursions.length > 0 ? (
              recentExcursions.map((exc) => {
                const pkgRaw = exc.tour_packages as unknown;
                const pkg = (Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw) as {
                  title: string;
                  slug: string;
                  category: string;
                } | null;
                return (
                  <div
                    key={exc.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {pkg?.title || "Sem título"}
                      </p>
                      <p className="text-xs text-outline mt-0.5">
                        📅 {formatDateShort(exc.departure_date)} ·{" "}
                        {pkg?.category || "—"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {formatBRL(Number(exc.price_per_seat))}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${EXCURSION_STATUS_COLORS[exc.status] || ""}`}
                    >
                      {exc.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
                Nenhuma excursão cadastrada ainda.
              </div>
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h2 className="font-bold text-on-surface">Últimas Reservas</h2>
            <Link
              href="/admin/reservas"
              className="text-xs text-primary font-medium hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {recentReservations && recentReservations.length > 0 ? (
              recentReservations.map((res) => {
                const profileRaw = res.profiles as unknown;
                const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
                  full_name: string;
                } | null;
                return (
                  <div
                    key={res.id}
                    className="px-6 py-3 flex items-center gap-3 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {profile?.full_name || "Cliente"}
                      </p>
                      <p className="text-xs text-outline">
                        {formatBRL(Number(res.total_amount))}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${RESERVATION_STATUS_COLORS[res.status] || ""}`}
                    >
                      {res.status === "PENDING_PIX"
                        ? "PIX Pendente"
                        : res.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
                Nenhuma reserva registrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: "/admin/excursoes",
            icon: "🚌",
            label: "Nova Excursão",
            desc: "Criar excursão",
          },
          {
            href: "/admin/roteiros",
            icon: "🗺️",
            label: "Novo Roteiro",
            desc: "Criar pacote",
          },
          {
            href: "/admin/frotas",
            icon: "🪑",
            label: "Nova Frota",
            desc: "Criar layout",
          },
          {
            href: "/admin/configuracoes",
            icon: "⚙️",
            label: "Configurações",
            desc: "PIX, WhatsApp",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-surface-container-lowest rounded-2xl p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <span className="text-3xl block group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <p className="text-sm font-bold text-on-surface mt-3">
              {action.label}
            </p>
            <p className="text-xs text-outline mt-0.5">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
