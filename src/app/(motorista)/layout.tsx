import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motorista — ViajaEdu!",
  robots: "noindex, nofollow",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BusFront, ClipboardCheck, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export default async function MotoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar se é motorista ou admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "DRIVER" && profile?.role !== "ADMIN") {
    redirect("/painel");
  }

  return (
    <div className="min-h-screen bg-surface-container flex flex-col pb-16">
      {/* Top App Bar Mobile */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-40 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="font-bold text-on-surface flex items-center gap-2">
          <span className="text-xl">🚌</span> 
          <span className="tracking-tight">Expedição ViajaEdu</span>
        </div>
        <form action={logout}>
          <button type="submit" className="p-2 text-outline hover:text-error transition-colors rounded-full">
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-surface-container-lowest border-t border-outline-variant/30 fixed bottom-0 w-full h-16 flex justify-around items-center px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/motorista" className="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors focus:text-primary active:scale-95">
          <BusFront className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Viagens</span>
        </Link>
        <Link href="/motorista/checklist" className="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors focus:text-primary active:scale-95">
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Checklist</span>
        </Link>
        <Link href="/motorista/configs" className="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors focus:text-primary active:scale-95">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
        </Link>
      </nav>
    </div>
  );
}
