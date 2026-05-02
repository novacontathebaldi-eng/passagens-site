"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExcursionItem } from "@/lib/search-utils";

export function useRealtimeOccupancy(excursions: ExcursionItem[]) {
  // Inicializa o mapa a partir dos dados recebidos via SSR
  const [occupancyMap, setOccupancyMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    excursions.forEach(exc => {
      if (exc.vehicle_capacity !== null && exc.available_count !== null) {
        initial[exc.id] = exc.vehicle_capacity - exc.available_count;
      }
    });
    return initial;
  });

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("home_occupancy_sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "excursion_occupancy",
        },
        (payload) => {
          const newRecord = payload.new as { excursion_id: string; occupied_seats: number } | null;
          if (newRecord && newRecord.excursion_id) {
            setOccupancyMap((prev) => ({
              ...prev,
              [newRecord.excursion_id]: newRecord.occupied_seats,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return occupancyMap;
}
