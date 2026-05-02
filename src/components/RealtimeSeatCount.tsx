"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface RealtimeSeatCountProps {
  excursionId: string;
  capacity: number;
  initialOccupied: number;
}

export default function RealtimeSeatCount({
  excursionId,
  capacity,
  initialOccupied,
}: RealtimeSeatCountProps) {
  const [occupied, setOccupied] = useState(initialOccupied);
  const supabase = useMemo(() => createClient(), []);

  const available = Math.max(0, capacity - occupied);

  useEffect(() => {
    const channel = supabase
      .channel(`occupancy-${excursionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "excursion_occupancy",
          filter: `excursion_id=eq.${excursionId}`,
        },
        (payload) => {
          const newOccupied = payload.new.occupied_seats;
          if (typeof newOccupied === "number") {
            setOccupied(newOccupied);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, excursionId]);

  if (available <= 0) {
    return (
      <span className="text-xs font-bold bg-error/10 text-error px-2 py-1 rounded">
        ESGOTADO
      </span>
    );
  }

  if (available <= 5) {
    return (
      <span className="text-error font-bold flex items-center gap-1 animate-pulse">
        🔥 Últimas {available} vagas!
      </span>
    );
  }

  return (
    <span className="text-success font-medium">
      {available} vagas
    </span>
  );
}
