import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import SucessoClient from "./SucessoClient";

type Params = Promise<{ reservation_id: string }>;

export default async function SucessoPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const reservationId = resolvedParams.reservation_id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  // Fetch reservation with related data
  const { data: reservation } = await supabase
    .from("reservations")
    .select(`
      *,
      excursions (
        departure_date,
        boarding_locations,
        tour_packages (
          title,
          tour_package_images (url, is_cover)
        )
      )
    `)
    .eq("id", reservationId)
    .single();

  if (!reservation || reservation.user_id !== user.id) {
    notFound();
  }

  // Fetch tickets for this reservation
  const { data: tickets } = await supabase
    .from("passenger_tickets")
    .select("id, full_name, cpf, seat_code, qr_code_token, short_code, boarding_location_id")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });

  const settings = await getSiteSettings();

  // Derive computed values server-side
  const tripTitle = reservation.excursions?.tour_packages?.title ?? "Viagem";
  const departureDate = reservation.excursions?.departure_date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(reservation.excursions.departure_date))
    : "Data a definir";
  const departureDateFull = reservation.excursions?.departure_date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(reservation.excursions.departure_date))
    : "Data a definir";

  const images = reservation.excursions?.tour_packages?.tour_package_images || [];
  const coverImage = (Array.isArray(images) && images.length > 0)
    ? (images.find((img: any) => img.is_cover)?.url || images[0]?.url)
    : "/placeholder-trip.jpg";

  const shortId = reservationId.split("-")[0].toUpperCase();
  const rawNumber = settings.whatsapp_support_numbers?.[0] ? settings.whatsapp_support_numbers[0].replace(/\D/g, "") : "";
  const whatsappNumber = rawNumber.startsWith("55") ? rawNumber : `55${rawNumber}`;

  return (
    <SucessoClient
      reservationId={reservationId}
      initialStatus={reservation.status}
      totalAmount={reservation.total_amount}
      expiresAt={reservation.expires_at}
      tripTitle={tripTitle}
      departureDate={departureDate}
      departureDateFull={departureDateFull}
      coverImage={coverImage}
      shortId={shortId}
      whatsappNumber={whatsappNumber}
      userEmail={user.email ?? ""}
      initialTickets={tickets ?? []}
      settings={{
        company_name: settings.company_name,
        logo_url: settings.logo_url,
        pix_qr_code_url: settings.pix_qr_code_url,
        pix_instructions: settings.pix_instructions,
        pix_keys: settings.pix_keys,
        pix_copy_paste: settings.pix_copy_paste,
        bank_name: settings.bank_name,
        bank_account_holder: settings.bank_account_holder,
        bank_cpf: settings.bank_cpf,
        bank_agency: settings.bank_agency,
        bank_account: settings.bank_account,
        bank_transfer_instructions: settings.bank_transfer_instructions,
        cancellation_policy_text: settings.cancellation_policy_text,
      }}
    />
  );
}
