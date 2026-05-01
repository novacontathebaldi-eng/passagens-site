"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationType =
  | "NEW_RESERVATION"
  | "RESERVATION_APPROVED"
  | "RESERVATION_EXPIRED"
  | "RESERVATION_CANCELLED"
  | "RESERVATION_REFUNDED"
  | "NEW_CLIENT"
  | "EXCURSION_SOLD_OUT"
  | "WAITLIST_SPOT_OPENED"
  | "SYSTEM_ALERT";

export type Notification = {
  id: string;
  recipient_role: string;
  recipient_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(limit = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Stable supabase reference — createClient() is a singleton but the
  // reference identity can change between renders, so we memoize it.
  const supabase = useMemo(() => createClient(), []);

  // Keep limit in a ref so the realtime callback always sees the latest value
  // without needing it in the dependency array.
  const limitRef = useRef(limit);
  limitRef.current = limit;

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limitRef.current);

      if (cancelled) return;

      if (!error && data) {
        const typed = data as Notification[];
        setNotifications(typed);
        setUnreadCount(typed.filter((n) => !n.is_read).length);
      }
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Real-time subscription — create channel, attach listeners, THEN subscribe.
  // Cleanup removes the channel before React re-runs the effect (StrictMode).
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-rt-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((prev) =>
            [incoming, ...prev].slice(0, limitRef.current)
          );
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => {
            const next = prev.map((n) => (n.id === updated.id ? updated : n));
            setUnreadCount(next.filter((n) => !n.is_read).length);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return { error };
    },
    [supabase]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    }
    return { error };
  }, [supabase, notifications]);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limitRef.current);

    if (!error && data) {
      const typed = data as Notification[];
      setNotifications(typed);
      setUnreadCount(typed.filter((n) => !n.is_read).length);
    }
  }, [supabase]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
