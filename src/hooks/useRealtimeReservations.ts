import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { changeReservationStatus, ReservationStatus } from "@/app/actions/reservas";

export type Reservation = {
  id: string;
  total_amount: number;
  status: ReservationStatus;
  created_at: string;
  expires_at: string;
  profiles: { full_name: string; phone: string; cpf: string } | null;
  excursions: { 
    departure_date: string;
    tour_packages: { title: string } | null;
  } | null;
  passenger_tickets: { id: string }[];
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
        expires_at,
        profiles ( full_name, phone, cpf ),
        excursions ( 
          departure_date,
          tour_packages ( title )
        ),
        passenger_tickets ( id )
      `)
      .order("created_at", { ascending: false });

    if (excursionId !== "ALL") {
      query = query.eq("excursion_id", excursionId);
    }

    const { data } = await query;
    
    if (data) {
      setReservations(data as unknown as Reservation[]);
    }
    setIsLoading(false);
  }, [excursionId, supabase]);

  useEffect(() => {
    // Inline initial load to avoid calling setState via external function
    (async () => {
      setIsLoading(true);
      let query = supabase
        .from("reservations")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          expires_at,
          profiles ( full_name, phone, cpf ),
          excursions ( 
            departure_date,
            tour_packages ( title )
          ),
          passenger_tickets ( id )
        `)
        .order("created_at", { ascending: false });

      if (excursionId !== "ALL") {
        query = query.eq("excursion_id", excursionId);
      }

      const { data } = await query;
      if (data) setReservations(data as unknown as Reservation[]);
      setIsLoading(false);
    })();

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
          if (payload.eventType === 'UPDATE') {
            setReservations(prev => prev.map(res => 
              res.id === payload.new.id 
                ? { ...res, status: payload.new.status } 
                : res
            ));
          } else {
            // For INSERT or DELETE, we refetch to get joined data or remove items easily
            fetchReservations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations, supabase, excursionId]);

  const updateStatus = async (id: string, newStatus: ReservationStatus, notes?: string) => {
    // Optimistic UI update
    setReservations(prev => prev.map(res => res.id === id ? { ...res, status: newStatus } : res));

    const result = await changeReservationStatus(id, newStatus, notes);

    if (result.error) {
      console.error(result.error);
      alert(result.error);
      // Revert optimism by refetching
      fetchReservations();
      return { error: new Error(result.error) };
    }
    return { error: null };
  };

  return { reservations, isLoading, updateStatus, refetch: fetchReservations };
}
