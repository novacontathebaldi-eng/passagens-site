import { createClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

export default async function ConfigsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout redirects anyway
  }

  // Busca dados do perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Busca configurações globais para o WhatsApp
  const { data: settings } = await supabase
    .from("global_settings")
    .select("whatsapp_support_numbers")
    .single();

  const rawNumbers = settings?.whatsapp_support_numbers as string[] | undefined;
  // Extrai o primeiro número não vazio
  const rawNumber = Array.isArray(rawNumbers)
    ? rawNumbers.find((n) => n.trim() !== "")
    : null;

  let supportLink = null;
  if (rawNumber) {
    // Remove tudo que não for dígito
    let cleanNumber = rawNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 10) {
      // Se não tiver o DDI 55 (Brasil), adiciona
      if (!cleanNumber.startsWith("55")) {
        cleanNumber = "55" + cleanNumber;
      }
      supportLink = `https://wa.me/${cleanNumber}?text=Olá, preciso de suporte com uma viagem.`;
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.substring(0, 2).toUpperCase()
    : "MO";

  return (
    <div className="p-4 space-y-8">
      <h1 className="font-bold text-on-surface text-xl px-2">Ajustes</h1>

      {/* ── Perfil do Motorista ── */}
      <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cta/5 rounded-full blur-xl" />

        {profile?.avatar_url ? (
          <div className="w-20 h-20 relative rounded-full overflow-hidden mb-4 border-2 border-surface shadow-md">
            {/* Using standard img instead of next/image to avoid unconfigured domains errors */}
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mb-4 border-2 border-primary/20 shadow-sm">
            {initials}
          </div>
        )}
        <h2 className="text-lg font-bold text-on-surface relative z-10">
          {profile?.full_name || "Motorista"}
        </h2>
        <p className="text-sm text-on-surface-variant relative z-10">
          {user.email}
        </p>
      </section>

      {/* ── Suporte ── */}
      {supportLink && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-2">
            Suporte
          </h3>
          <a
            href={supportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-success/10 text-success rounded-2xl border border-success/20 hover:bg-success/20 transition-colors"
          >
            <span className="font-bold text-base">Falar com o suporte</span>
            <MessageCircle className="w-5 h-5" />
          </a>
        </section>
      )}

      {/* ── Conta ── */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-2">
          Conta
        </h3>
        <LogoutButton />
      </section>
    </div>
  );
}
