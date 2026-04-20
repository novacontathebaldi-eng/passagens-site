"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function WaitlistButton({ excursionId, user }: { excursionId: string; user: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/excursao/${excursionId}`); // It needs slug, but this is a fallback
      return;
    }

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: err } = await supabase
      .from("waitlist")
      .insert({
        excursion_id: excursionId,
        user_id: user.id,
        requested_seats: 1 // default
      });

    setIsLoading(false);

    if (err) {
      if (err.code === '23505') { // Unique violation
        setIsSuccess(true); // Already in waitlist, consider it a success visually
      } else {
        setError("Erro ao entrar na lista. Tente novamente.");
      }
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4 bg-success/10 rounded-xl border border-success/20 animate-in fade-in zoom-in duration-300">
        <p className="text-success font-bold flex items-center justify-center gap-2">
          <span>✓</span> Você está na lista!
        </p>
        <p className="text-xs text-success/80 mt-1">Avisaremos via WhatsApp se uma vaga abrir.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {error && <p className="text-error text-xs mb-2 font-bold">{error}</p>}
      <button 
        onClick={handleJoin}
        disabled={isLoading}
        className="w-full py-3 rounded-xl gradient-cta text-on-cta font-bold shadow-md hover:shadow-glow-cta transition-all disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "🔔 Avisar quando abrir vaga"
        )}
      </button>
    </div>
  );
}
