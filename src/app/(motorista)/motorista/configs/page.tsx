import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { DriverContactCard } from "./DriverContactCard";

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

  // Busca configurações globais
  const { data: settings } = await supabase
    .from("global_settings")
    .select("driver_contact_numbers")
    .single();

  let driverContacts: any[] = [];
  try {
    if (Array.isArray(settings?.driver_contact_numbers)) {
      driverContacts = settings?.driver_contact_numbers as any[];
    } else if (typeof settings?.driver_contact_numbers === "string") {
      driverContacts = JSON.parse(settings?.driver_contact_numbers);
    }
  } catch (_e) {}

  const initials = profile?.full_name
    ? profile.full_name.substring(0, 2).toUpperCase()
    : "MO";

  return (
    <div className="pt-4 max-w-md mx-auto pb-32 font-sans">
      {/* ── Perfil do Motorista ── */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1E40AF] to-[#001a66] p-8 shadow-[0_16px_40px_rgba(0,40,142,0.15)] flex flex-col items-center text-center">
          {/* Abstract Decorative Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden mb-5 border-[3px] border-white/20 shadow-lg bg-white/10 flex items-center justify-center text-white text-3xl font-bold">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          
          <h1 className="relative z-10 font-extrabold text-2xl text-white mb-1 tracking-tight leading-tight">
            {profile?.full_name || "Motorista"}
          </h1>
          <p className="relative z-10 text-blue-200 text-sm font-medium">
            {user.email}
          </p>
          
          <div className="relative z-10 mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-cyan-300 text-sm">verified</span>
            <span className="text-white text-xs font-semibold uppercase tracking-wider">Motorista</span>
          </div>
        </div>
      </section>

      {/* ── Números Úteis ── */}
      <section className="mb-12">
        <h2 className="font-bold text-[0.85rem] tracking-[0.15em] text-[#1E40AF] uppercase mb-6 pl-2">
          NÚMEROS ÚTEIS
        </h2>
        
        {driverContacts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {driverContacts.map((contact) => (
              <DriverContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-6 text-center shadow-sm">
            <p className="text-sm text-slate-500 italic">
              Nenhum número de suporte configurado. Peça ao administrador para cadastrar os contatos.
            </p>
          </div>
        )}
      </section>

      {/* ── Conta ── */}
      <section>
        <LogoutButton />
      </section>
    </div>
  );
}
