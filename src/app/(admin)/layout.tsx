import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { LiveAlerts } from "@/components/LiveAlerts";

export const metadata: Metadata = {
  title: "Admin — ViajaEdu!",
  robots: "noindex, nofollow",
};

const NAV_ITEMS = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/excursoes", icon: "🚌", label: "Excursões" },
  { href: "/admin/roteiros", icon: "🗺️", label: "Roteiros" },
  { href: "/admin/frotas", icon: "🪑", label: "Frotas" },
  { href: "/admin/reservas", icon: "🎫", label: "Reservas" },
  { href: "/admin/clientes", icon: "👥", label: "Clientes" },
  { href: "/admin/afiliados", icon: "🤝", label: "Afiliados" },
  { href: "/admin/configuracoes", icon: "⚙️", label: "Configurações" },
  { href: "/admin/auditoria", icon: "📋", label: "Auditoria" },
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
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <span className="text-2xl">🚌</span>
          <span className="text-lg font-extrabold font-[family-name:var(--font-display)]">
            ViajaEdu!
          </span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/80 font-semibold">
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-white/50">{profile.role}</p>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="w-full text-xs text-white/40 hover:text-white/80 transition-colors text-left"
            >
              ← Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="lg:hidden h-14 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center px-4 gap-3">
          <span className="text-xl">🚌</span>
          <span className="font-bold text-primary font-[family-name:var(--font-display)]">
            Admin
          </span>
          <Link
            href="/"
            className="ml-auto text-xs text-on-surface-variant hover:text-primary"
          >
            Ver site →
          </Link>
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
