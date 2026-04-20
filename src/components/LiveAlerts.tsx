"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export function LiveAlerts() {
  const [alert, setAlert] = useState<{ id: string; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("global_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          setAlert({
            id: payload.new.id,
            message: `Nova reserva recebida! Valor: R$ ${payload.new.total_amount}`,
          });
          router.refresh();
          
          setTimeout(() => setAlert(null), 5000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations", filter: "status=eq.APPROVED" },
        (payload) => {
          if (payload.old.status !== "APPROVED") {
            setAlert({
              id: payload.new.id,
              message: `Reserva aprovada! (PIX confirmado)`,
            });
            router.refresh();

            setTimeout(() => setAlert(null), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (!alert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-primary text-on-primary px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 pr-12 relative border border-white/20">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <p className="font-bold text-sm">{alert.message}</p>
        
        <button 
          onClick={() => setAlert(null)}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
