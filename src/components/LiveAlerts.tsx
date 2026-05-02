"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type NotificationType =
  | "NEW_RESERVATION"
  | "RESERVATION_APPROVED"
  | "RESERVATION_EXPIRED"
  | "RESERVATION_CANCELLED"
  | "RESERVATION_REFUNDED"
  | "NEW_CLIENT"
  | "EXCURSION_SOLD_OUT"
  | "WAITLIST_SPOT_OPENED"
  | "SYSTEM_ALERT";

const TOAST_VARIANT: Record<NotificationType, "info" | "success" | "warning" | "error"> = {
  NEW_RESERVATION: "info",
  RESERVATION_APPROVED: "success",
  RESERVATION_EXPIRED: "warning",
  RESERVATION_CANCELLED: "error",
  RESERVATION_REFUNDED: "info",
  NEW_CLIENT: "info",
  EXCURSION_SOLD_OUT: "warning",
  WAITLIST_SPOT_OPENED: "success",
  SYSTEM_ALERT: "info",
};

interface LiveAlertsProps {
  role?: string;
}

export function LiveAlerts({ role }: LiveAlertsProps) {
  const isAdmin = role === "ADMIN" || role === "AGENT";
  const supabase = useMemo(() => (isAdmin ? createClient() : null), [isAdmin]);

  useEffect(() => {
    if (!supabase) return;

    const channelId = `live-alerts-toast-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as {
            type: NotificationType;
            title: string;
            message: string;
          };

          const variant = TOAST_VARIANT[n.type] || "info";
          toast[variant](n.title, {
            description: n.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Rendering is handled by the global <Toaster /> in the root layout
  return null;
}
