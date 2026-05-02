"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  
  const [
    { count: totalExcursions },
    { count: publishedExcursions },
    { count: totalReservations },
    { count: pendingReservations },
    { count: approvedReservations },
    { count: totalClients },
    { data: revenueData },
    { data: recentExcursions },
    { data: recentReservations },
  ] = await Promise.all([
    supabase.from("excursions").select("*", { count: "exact", head: true }),
    supabase
      .from("excursions")
      .select("*", { count: "exact", head: true })
      .eq("status", "PUBLISHED"),
    supabase.from("reservations").select("*", { count: "exact", head: true }),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING_PIX"),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "APPROVED"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CLIENT"),
    supabase
      .from("reservations")
      .select("total_amount")
      .eq("status", "APPROVED"),
    supabase
      .from("excursions")
      .select(
        `
        id, status, price_per_seat, departure_date, highlight_text,
        tour_packages (title, slug, category)
      `
      )
      .order("departure_date", { ascending: true })
      .limit(5),
    supabase
      .from("reservations")
      .select(
        `
        id, status, total_amount, created_at,
        profiles (full_name),
        excursions (tour_packages (title))
      `
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalRevenue = (revenueData || []).reduce(
    (sum, r) => sum + Number(r.total_amount),
    0
  );

  return {
    totalExcursions: totalExcursions ?? 0,
    publishedExcursions: publishedExcursions ?? 0,
    totalReservations: totalReservations ?? 0,
    pendingReservations: pendingReservations ?? 0,
    approvedReservations: approvedReservations ?? 0,
    totalClients: totalClients ?? 0,
    totalRevenue,
    recentExcursions: recentExcursions || [],
    recentReservations: recentReservations || [],
  };
}
