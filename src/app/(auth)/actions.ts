"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/auth-emails";
import { addContactToBrevo } from "@/lib/brevo";
import { translateAuthError } from "@/lib/auth-errors";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Read redirect FIRST — before any role checks that could lose it
  const rawRedirect = formData.get("redirect") as string | null;
  const safeRedirect = rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : null;

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", translateAuthError(error.message));
    if (safeRedirect) searchParams.set("redirect", safeRedirect);
    redirect(`/login?${searchParams.toString()}`);
  }

  // Check profile for redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nextParam = safeRedirect ? `?next=${encodeURIComponent(safeRedirect)}` : "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, cpf")
      .eq("id", user.id)
      .single();

    // If profile is incomplete (Google login without CPF), redirect to complete — preserve next
    if (!profile || !profile.cpf) {
      redirect(`/completar-cadastro${nextParam}`);
    }

    // Role-based redirects only when there's no explicit destination
    if (!safeRedirect) {
      if (profile?.role === "ADMIN" || profile?.role === "AGENT") {
        redirect("/admin");
      }
      if (profile?.role === "DRIVER") {
        redirect("/motorista");
      }
    }
  }

  revalidatePath("/", "layout");
  if (safeRedirect) {
    redirect(safeRedirect);
  }
  redirect("/painel");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const acceptsMarketing = formData.get("accepts_marketing") === "on";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        accepts_marketing: acceptsMarketing,
      },
    },
  });

  if (error) {
    const searchParams = new URLSearchParams();
    searchParams.set("error", translateAuthError(error.message));
    redirect(`/cadastro?${searchParams.toString()}`);
  }

  // Send confirmation email
  if (data?.user?.id && data?.user?.email) {
    try {
      await sendConfirmationEmail(data.user.id, data.user.email);
      
      if (acceptsMarketing) {
        await addContactToBrevo(data.user.email, { NOME: fullName });
      }
    } catch (e) {
      console.error("Failed to send welcome/confirmation email or add to Brevo:", e);
    }
  }

  const redirectUrl = formData.get("redirect") as string;
  const nextParam = redirectUrl ? `?next=${encodeURIComponent(redirectUrl)}` : "";

  revalidatePath("/", "layout");
  redirect(`/completar-cadastro${nextParam}`);
}

export async function signInWithGoogle(nextUrl?: string | null) {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const origin = headersList.get("origin") || (host ? `${protocol}://${host}` : null) || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: nextUrl ? `${origin}/auth/callback?next=${encodeURIComponent(nextUrl)}` : `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const origin = headersList.get("origin") || (host ? `${protocol}://${host}` : null) || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    redirect(`/esqueci-senha?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  redirect("/esqueci-senha?success=true");
}

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cpf = formData.get("cpf") as string;
  const phone = formData.get("phone") as string;
  const birthDate = formData.get("birth_date") as string;

  const { error } = await supabase
    .from("profiles")
    .update({
      cpf,
      phone,
      birth_date: birthDate || null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/completar-cadastro?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  // Redirect based on role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");

  const rawNext = formData.get("next") as string | null;
  const safeNext = rawNext && rawNext.startsWith("/") ? rawNext : null;

  if (safeNext) {
    redirect(safeNext);
  }

  if (profile?.role === "ADMIN" || profile?.role === "AGENT") {
    redirect("/admin");
  }
  if (profile?.role === "DRIVER") {
    redirect("/motorista");
  }
  redirect("/painel");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  // Se deu certo, desloga para forçar login com a nova senha ou redireciona
  redirect("/redefinir-senha?success=true");
}
