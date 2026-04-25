import { createClient } from "@/lib/supabase/server";
import ManifestoClient from "./ManifestoClient";

export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ excursion_id: string }>;
}) {
  const { excursion_id } = await params;
  const supabase = await createClient();

  // Fetch Excursion Details
  const { data: excursion } = await supabase
    .from("excursions")
    .select(`
      id,
      tour_packages (title),
      vehicle_layouts (capacity)
    `)
    .eq("id", excursion_id)
    .single();

  // Fetch Passengers from the secure View (LGPD compliance)
  const { data: passengers } = await supabase
    .from("driver_manifest_view")
    .select("*")
    .eq("excursion_id", excursion_id)
    .order("seat_code", { ascending: true });

  const pkgRaw = excursion?.tour_packages as any;
  const title = Array.isArray(pkgRaw) ? pkgRaw[0]?.title : pkgRaw?.title;

  return (
    <ManifestoClient
      initialPassengers={(passengers as any[]) ?? []}
      excursionId={excursion_id}
      excursionTitle={title ?? "Excursão"}
    />
  );
}
