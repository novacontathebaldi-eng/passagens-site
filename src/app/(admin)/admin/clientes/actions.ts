"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getUsersEmails(uids: string[]) {
  // Verificação de segurança: apenas admin pode rodar isso
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["ADMIN", "AGENT"].includes(profile.role)) {
    return {};
  }

  if (!uids || uids.length === 0) return {};

  // Busca emails usando a Admin API
  const results: Record<string, { email: string; banned_until: string | null }> = {};
  
  await Promise.all(
    uids.map(async (uid) => {
      try {
        const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (adminUser) {
          results[uid] = {
            email: adminUser.email || "",
            banned_until: adminUser.banned_until || null,
          };
        }
      } catch (error) {
        console.error(`Error fetching email for uid ${uid}`, error);
      }
    })
  );

  return results;
}

export async function changeUserRole(userId: string, newRole: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    throw new Error("Apenas administradores podem alterar roles.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // Auditar ação
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "ALTER_ROLE",
    entity_type: "PROFILE",
    entity_id: userId,
    new_data: { role: newRole },
  });

  return { success: true };
}

export async function toggleClientBan(uid: string, ban: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["ADMIN", "AGENT"].includes(profile.role)) throw new Error("Acesso negado");

  // O ban_duration "876000h" é igual a 100 anos. "none" é para desbanir.
  const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
    ban_duration: ban ? "876000h" : "none",
  });

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: ban ? "BAN_USER" : "UNBAN_USER",
    entity_type: "PROFILE",
    entity_id: uid,
  });

  return { success: true };
}

export async function addClientNote(clientId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    admin_id: user.id,
    content,
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteClientNote(noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteClientAccount(uid: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") throw new Error("Acesso negado. Apenas admins podem deletar contas.");

  // 1. Double Check de Reservas com histórico importante
  const { data: reservations } = await supabase.from("reservations").select("id, status").eq("user_id", uid);
  const criticalReservations = reservations?.filter(r => ["APPROVED", "PENDING_PIX", "AWAITING_MANUAL_CHECK", "COMPLETED"].includes(r.status));
  
  const hasImpediments = criticalReservations && criticalReservations.length > 0;

  if (hasImpediments) {
    // Caminho A: Anonimização
    const fakeEmail = `removed_${uid}_${Date.now()}@deleted.partiuturismo.com`;
    
    // Atualiza auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
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
    }).eq("id", uid);

    await supabase.from("audit_logs").insert({ actor_id: user.id, action: "ANONYMIZE_ACCOUNT", entity_type: "PROFILE", entity_id: uid });
    return { success: true, strategy: "ANONYMIZE" };
  } else {
    // Caminho B: Hard Delete
    // 2. Deleção Sequencial Cascata (passenger_tickets deleta via cascata do reservations)
    await supabase.from("reservations").delete().eq("user_id", uid);
    await supabase.from("saved_passengers").delete().eq("owner_id", uid);
    await supabase.from("waitlist").delete().eq("user_id", uid);
    await supabase.from("client_notes").delete().eq("client_id", uid);
    await supabase.from("excursion_reports").delete().eq("driver_id", uid); // caso seja motorista
    
    // Deleta o profile e auth.user usando a Admin API (admin API tbm propaga o CASCADE em auth.users pro public.profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (deleteError) throw new Error(deleteError.message);

    await supabase.from("audit_logs").insert({ actor_id: user.id, action: "HARD_DELETE_ACCOUNT", entity_type: "PROFILE", entity_id: uid });
    return { success: true, strategy: "HARD_DELETE" };
  }
}
