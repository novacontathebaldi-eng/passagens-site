import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { LiveAlerts } from "@/components/LiveAlerts";
import { AdminMobileMenu } from "./AdminMobileMenu";
import { AdminDesktopNav } from "./AdminDesktopNav";

export const metadata: Metadata = {
  title: "Admin — Partiu Turismo",
  robots: "noindex, nofollow",
};

const NAV_ITEMS = [
  { href: "/admin", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Dashboard" },
  { href: "/admin/excursoes", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", label: "Excursões" },
  { href: "/admin/roteiros", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", label: "Roteiros" },
  { href: "/admin/frotas", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", label: "Frotas" },
  { href: "/admin/reservas", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z", label: "Reservas" },
  { href: "/admin/financeiro", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Financeiro" },
  { href: "/admin/clientes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Clientes" },
  { href: "/admin/afiliados", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z", label: "Afiliados" },
  { href: "/admin/configuracoes", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", label: "Configurações" },
  { href: "/admin/auditoria", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Auditoria" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || !["ADMIN", "AGENT"].includes(profile.role)) {
    redirect("/");
  }

  const initials = profile.full_name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen bg-surface-container-low overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-on-surface text-white">
        {/* Logo & Profile */}
        <div className="flex flex-col border-b border-white/10 bg-white/[0.02]">
          <div className="h-16 flex items-center gap-3 px-6 shrink-0">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
              <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
              <path d="M8 10L16 24L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-extrabold font-[family-name:var(--font-display)] truncate">
              Partiu Turismo
            </span>
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold ring-2 ring-primary/30 shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile.full_name}
                </p>
                <div className="flex items-center mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/20 text-primary font-bold uppercase tracking-wider">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <AdminDesktopNav navItems={NAV_ITEMS} />

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-white/[0.02]">
          <div className="space-y-1">
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Voltar ao Site
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair da conta
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="lg:hidden h-14 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center px-4 gap-3">
          <AdminMobileMenu 
            navItems={NAV_ITEMS}
            profile={profile}
            initials={initials}
          />
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="ml-1">
            <rect width="32" height="32" rx="8" className="fill-primary" />
            <path d="M8 10L16 24L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-bold text-primary font-[family-name:var(--font-display)]">
            Admin
          </span>
          <div className="ml-auto"></div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <LiveAlerts />
          {children}
        </main>
      </div>
    </div>
  );
}
