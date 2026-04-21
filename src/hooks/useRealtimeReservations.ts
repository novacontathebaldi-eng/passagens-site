import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type Reservation = {
  id: string;
  total_amount: number;
  status: "PENDING_PIX" | "AWAITING_MANUAL_CHECK" | "APPROVED" | "REFUNDED" | "CANCELLED" | "EXPIRED";
  created_at: string;
  profiles: { full_name: string; phone: string } | null;
  excursions: { 
    departure_date: string;
    tour_packages: { title: string } | null;
  } | null;
};

export function useRealtimeReservations(excursionId: string = "ALL") {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from("reservations")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        profiles ( full_name, phone ),
        excursions ( 
          departure_date,
          tour_packages ( title )
        )
      `)
      .order("created_at", { ascending: false });

    if (excursionId !== "ALL") {
      query = query.eq("excursion_id", excursionId);
    }

    const { data, error } = await query;
    
    if (data) {
      setReservations(data as unknown as Reservation[]);
    }
    setIsLoading(false);
  }, [excursionId, supabase]);

  useEffect(() => {
    fetchReservations();

    const channelName = excursionId === "ALL" ? 'public:reservations' : `reservations-${excursionId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'reservations',
          filter: excursionId !== "ALL" ? `excursion_id=eq.${excursionId}` : undefined
        },
        (payload) => {
          console.log("Realtime event received for reservation:", payload);
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations, supabase]);

  const updateStatus = async (id: string, newStatus: Reservation["status"]) => {
    // Optimistic UI update
    setReservations(prev => prev.map(res => res.id === id ? { ...res, status: newStatus } : res));

    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      // Revert optimism by refetching
      fetchReservations();
      return { error };
    }
    return { error: null };
  };

  return { reservations, isLoading, updateStatus, refetch: fetchReservations };
}
