import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/get-settings";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

import { MotoristaBottomNav } from "./MotoristaBottomNav";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Motorista — ${settings.company_name || "Partiu Turismo"}`,
    robots: "noindex, nofollow",
  };
}

export default async function MotoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const settings = await getSiteSettings();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar se é motorista ou admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "DRIVER" && profile?.role !== "ADMIN") {
    redirect("/painel");
  }

  const initials = profile?.full_name?.substring(0, 2).toUpperCase() || "DR";

  return (
    <div className="min-h-[100dvh] bg-slate-50 font-body flex flex-col pb-24">
      {/* Top App Bar Mobile */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm flex items-center px-6 py-4">
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-blue-900">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Driver" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none gap-2">
          {settings.logo_url && (
            <img 
              src={settings.logo_url} 
              alt={settings.company_name || "Partiu Turismo"} 
              className="w-6 h-6 object-cover rounded-full ring-1 ring-blue-900/20"
            />
          )}
          <h1 className="font-headline font-bold text-xl text-blue-900 tracking-tight whitespace-nowrap">
            {settings.company_name || "Partiu Turismo"}
          </h1>
        </div>
        <div className="ml-auto z-10">
          <form action={logout}>
            <button type="submit" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors hover:opacity-80 scale-95 duration-200">
              <LogOut className="w-5 h-5 text-blue-900" />
            </button>
          </form>
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 pt-[72px]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <MotoristaBottomNav />
    </div>
  );
}
