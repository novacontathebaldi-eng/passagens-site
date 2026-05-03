"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteOwnAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  // 1. Verificar histórico financeiro
  const { data: reservations } = await supabase
    .from("reservations")
    .select("status")
    .eq("user_id", user.id);

  const hasCriticalReservations = reservations?.some(r => 
    ["APPROVED", "PENDING_PIX", "AWAITING_MANUAL_CHECK", "COMPLETED"].includes(r.status)
  );

  if (hasCriticalReservations) {
    // Caminho A: Anonimização B2C (apenas desvincular auth e apagar PII)
    const fakeEmail = `removed_${user.id}_${Date.now()}@deleted.partiuturismo.com`;
    
    // Atualiza auth.users para banir e alterar email (usando admin role)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: fakeEmail,
      ban_duration: "876000h",
      user_metadata: { name: "Cliente Removido" },
    });
    if (authError) throw new Error(authError.message);

    // Atualiza profiles
    await supabase.from("profiles").update({
      full_name: "Cliente Removido",
      cpf: null,
      phone: null,
      birth_date: null,
      avatar_url: null,
      accepts_marketing: false,
    }).eq("id", user.id);

    await supabase.from("audit_logs").insert({ actor_id: user.id, action: "ANONYMIZE_OWN_ACCOUNT", entity_type: "PROFILE", entity_id: user.id });

    // Deslogar
    await supabase.auth.signOut();
    return { success: true, strategy: "ANONYMIZE" };

  } else {
    // Caminho B: Hard Delete
    await supabase.from("reservations").delete().eq("user_id", user.id);
    await supabase.from("saved_passengers").delete().eq("owner_id", user.id);
    await supabase.from("waitlist").delete().eq("user_id", user.id);
    
    // Delete via Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(deleteError.message);

    await supabase.from("audit_logs").insert({ actor_id: user.id, action: "HARD_DELETE_OWN_ACCOUNT", entity_type: "PROFILE", entity_id: user.id });

    // Deslogar
    await supabase.auth.signOut();
    return { success: true, strategy: "HARD_DELETE" };
  }
}
