import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PassageirosList from "./PassageirosList";

export default async function MeusViajantesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch saved passengers
  const { data: passengers } = await supabase
    .from("saved_passengers")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/painel"
              className="p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors text-on-surface-variant shadow-sm shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">Meus Viajantes</h1>
              <p className="text-on-surface-variant text-sm mt-1">Gerencie os dados de amigos e familiares para agilizar suas compras.</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 shadow-sm">
          <PassageirosList initialPassengers={passengers || []} />
        </div>
        
      </div>
    </div>
  );
}
