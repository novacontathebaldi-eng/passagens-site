"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export function GoogleOneTap() {
  const router = useRouter();
  const supabase = createClient();
  const hasPrompted = useRef(false);

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (error) {
          console.error("[GoogleOneTap] signInWithIdToken error:", error.message);
          toast.error("Não foi possível fazer login com Google. Tente novamente.");
          return;
        }

        // Check if profile needs completion (first-time Google login without CPF)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("cpf, role")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.cpf) {
          // First access — close popup and redirect to complete registration
          window.google?.accounts.id.cancel();
          router.push("/completar-cadastro");
          return;
        }

        // Returning user — close popup immediately, then refresh layout
        window.google?.accounts.id.cancel();
        router.refresh();
      } catch (err) {
        console.error("[GoogleOneTap] Unexpected error:", err);
        toast.error("Erro inesperado ao fazer login. Tente novamente.");
      }
    },
    [supabase, router]
  );

  const handleScriptLoad = useCallback(() => {
    if (!window.google || hasPrompted.current) return;
    hasPrompted.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: true,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.prompt();
  }, [handleCredentialResponse]);

  // Don't render anything if client ID is missing
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={handleScriptLoad}
    />
  );
}
