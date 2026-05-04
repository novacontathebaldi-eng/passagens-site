"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const full_name = formData.get("full_name") as string;
  const cpf = formData.get("cpf") as string;
  const phone = formData.get("phone") as string;
  const birth_date = formData.get("birth_date") as string;

  // Basic validation
  if (!full_name || full_name.trim().length < 3) {
    return { error: "Nome completo é obrigatório." };
  }

  // Remove mask for CPF
  const unmaskedCpf = cpf ? cpf.replace(/\D/g, "") : null;
  // Remove mask for phone (optional but good practice)
  const unmaskedPhone = phone ? phone.replace(/\D/g, "") : null;

  const { error } = await supabase.from("profiles").update({
    full_name,
    cpf: unmaskedCpf || null,
    phone: unmaskedPhone || null,
    birth_date: birth_date || null,
    updated_at: new Date().toISOString()
  }).eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    if (error.code === '23505') {
      return { error: "Este CPF já está em uso por outra conta." };
    }
    return { error: "Erro ao atualizar perfil." };
  }

  revalidatePath("/painel/meus-dados");
  revalidatePath("/painel");
  return { success: true };
}

export async function addSavedPassenger(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const full_name = formData.get("full_name") as string;
  const cpf = formData.get("cpf") as string;
  const rg = formData.get("rg") as string;
  const orgao_emissor = formData.get("orgao_emissor") as string;
  const birth_date = formData.get("birth_date") as string;

  if (!full_name || full_name.trim().length < 3 || !cpf) {
    return { error: "Nome completo e CPF são obrigatórios." };
  }

  const unmaskedCpf = cpf.replace(/\D/g, "");

  const { error } = await supabase.from("saved_passengers").insert({
    owner_id: user.id,
    full_name,
    cpf: unmaskedCpf,
    rg: rg || null,
    orgao_emissor: orgao_emissor || null,
    birth_date: birth_date || null
  });

  if (error) {
    console.error("Error adding passenger:", error);
    return { error: "Erro ao adicionar passageiro." };
  }

  revalidatePath("/painel/meus-viajantes");
  return { success: true };
}

export async function updateSavedPassenger(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const full_name = formData.get("full_name") as string;
  const cpf = formData.get("cpf") as string;
  const rg = formData.get("rg") as string;
  const orgao_emissor = formData.get("orgao_emissor") as string;
  const birth_date = formData.get("birth_date") as string;

  if (!full_name || full_name.trim().length < 3 || !cpf) {
    return { error: "Nome completo e CPF são obrigatórios." };
  }

  const unmaskedCpf = cpf.replace(/\D/g, "");

  const { error } = await supabase.from("saved_passengers").update({
    full_name,
    cpf: unmaskedCpf,
    rg: rg || null,
    orgao_emissor: orgao_emissor || null,
    birth_date: birth_date || null
  }).eq("id", id).eq("owner_id", user.id); // Ensure user owns this passenger

  if (error) {
    console.error("Error updating passenger:", error);
    return { error: "Erro ao atualizar passageiro." };
  }

  revalidatePath("/painel/meus-viajantes");
  return { success: true };
}

export async function deleteSavedPassenger(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from("saved_passengers").delete()
    .eq("id", id).eq("owner_id", user.id);

  if (error) {
    console.error("Error deleting passenger:", error);
    return { error: "Erro ao excluir passageiro." };
  }

  revalidatePath("/painel/meus-viajantes");
  return { success: true };
}
