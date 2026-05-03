import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReservationDetailClient from "./ReservationDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch reservation with related data
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      expires_at,
      notes,
      gateway_provider,
      profiles ( full_name, phone, cpf ),
      excursions (
        id,
        departure_date,
        return_date,
        tour_packages ( title, slug )
      ),
      passenger_tickets (
        id,
        full_name,
        cpf,
        rg,
        seat_code,
        boarding_location_id,
        check_in_status,
        checked_in_at,
        emergency_contact_name,
        emergency_contact_phone
      )
    `)
    .eq("id", id)
    .single();

  if (error || !reservation) {
    notFound();
  }

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, old_data, new_data")
    .eq("entity_type", "reservations")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  return (
    <ReservationDetailClient
      reservation={reservation as any}
      auditLogs={(auditLogs as any) || []}
    />
  );
}
