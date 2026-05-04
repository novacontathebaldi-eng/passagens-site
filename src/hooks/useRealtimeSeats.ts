import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeSeats(excursionId: string, initialOccupiedSeats: string[]) {
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>(initialOccupiedSeats);
  const supabase = createClient();

  // Keep state in sync if parent server component passes new initial props
  const prevSeatsKey = useRef(JSON.stringify(initialOccupiedSeats));
  const seatsKey = JSON.stringify(initialOccupiedSeats);
  if (prevSeatsKey.current !== seatsKey) {
    prevSeatsKey.current = seatsKey;
    setOccupiedSeats(initialOccupiedSeats);
  }

  const fetchSeats = useCallback(async () => {
    const { data: seats } = await supabase
      .rpc('get_occupied_seat_codes', { p_excursion_id: excursionId });
      
    if (seats) {
      setOccupiedSeats(seats);
    }
  }, [excursionId, supabase]);

  useEffect(() => {
    const channel = supabase.channel(`seats-${excursionId}`);
    
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'passenger_tickets',
      filter: `excursion_id=eq.${excursionId}`
    }, () => {
      console.log('Realtime change in passenger_tickets');
      fetchSeats();
    });
    
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'reservations'
      // Note: we can't filter reservations by excursion_id directly here if it doesn't have it, 
      // but reservations DOES have excursion_id in the schema!
      // Wait, let's verify if reservations has excursion_id. Yes, it does.
      , filter: `excursion_id=eq.${excursionId}`
    }, () => {
      console.log('Realtime change in reservations');
      fetchSeats();
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime Seats Subscribed for excursion ${excursionId}!`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [excursionId, fetchSeats, supabase]);

  return occupiedSeats;
}
