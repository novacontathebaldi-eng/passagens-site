import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./CheckoutClient";

type Params = Promise<{ excursion_id: string }>;

export default async function CheckoutPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const excursionId = resolvedParams.excursion_id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Obrigar login antes do checkout
  if (!user) {
    redirect(`/login?redirect=/checkout/${excursionId}`);
  }

  // Buscar perfil e passageiros salvos
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, cpf, phone, birth_date")
    .eq("id", user.id)
    .single();

  const { data: savedPassengers } = await supabase
    .from("saved_passengers")
    .select("*")
    .eq("owner_id", user.id);

  // Buscar a excursão, pacote e veículo
  const { data: excursion, error: excursionError } = await supabase
    .from("excursions")
    .select(`
      *,
      tour_packages (title, slug, short_description, images),
      vehicle_layouts (name, capacity, grid_matrix)
    `)
    .eq("id", excursionId)
    .single();

  if (excursionError) {
    console.error("Checkout: Erro ao buscar excursão:", excursionError.message);
  }

  if (!excursion || excursion.status !== "PUBLISHED") {
    notFound();
  }

  // Buscar poltronas já ocupadas para esta excursão
  const { data: tickets } = await supabase
    .from("passenger_tickets")
    .select("seat_code, reservations(status)")
    .eq("excursion_id", excursionId)
    .neq("reservations.status", "CANCELLED")
    .neq("reservations.status", "EXPIRED");

  // Apenas as cadeiras que não estão canceladas nem expiradas contam como ocupadas
  const occupiedSeats = tickets?.filter(t => t.reservations !== null).map(t => t.seat_code) || [];

  const backHref = excursion.tour_packages?.slug
    ? `/excursao/${excursion.tour_packages.slug}`
    : "/";

  return (
    <div className="min-h-screen bg-surface py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecalho Simplificado */}
        <div className="mb-8 border-b border-outline-variant/30 pb-6">
          <h1 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">Checkout</h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <span className="font-semibold text-primary">{excursion.tour_packages?.title}</span>
            <span className="w-1 h-1 rounded-full bg-outline"></span>
            <span>{new Date(excursion.departure_date).toLocaleDateString("pt-BR")}</span>
          </p>
        </div>

        {/* Client Component */}
        <CheckoutClient 
          excursion={excursion} 
          user={user} 
          profile={profile}
          savedPassengers={savedPassengers || []}
          occupiedSeats={occupiedSeats}
          backHref={backHref}
        />

      </div>
    </div>
  );
}
