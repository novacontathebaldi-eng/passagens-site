"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfDay, subDays, startOfMonth, startOfYear, format } from "date-fns";

export async function getFinanceiroData(period: string) {
  const supabase = await createClient();

  // Calcular Datas Baseado no Período
  const now = new Date();
  let startDate = new Date();
  let periodLabel = "Este Mês";

  switch (period) {
    case "hoje":
      startDate = startOfDay(now);
      periodLabel = "Hoje";
      break;
    case "7_dias":
      startDate = subDays(now, 7);
      periodLabel = "Últimos 7 Dias";
      break;
    case "este_mes":
      startDate = startOfMonth(now);
      periodLabel = "Este Mês";
      break;
    case "30_dias":
      startDate = subDays(now, 30);
      periodLabel = "Últimos 30 Dias";
      break;
    case "este_ano":
      startDate = startOfYear(now);
      periodLabel = "Este Ano";
      break;
    default:
      startDate = startOfMonth(now);
      periodLabel = "Este Mês";
  }

  // Buscar Reservas do Supabase
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      profiles ( full_name ),
      excursions (
        tour_packages ( title )
      )
    `)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", now.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar reservas:", error);
  }

  const rawReservations = reservations || [];

  // Processar Dados e KPIs
  let receitaAprovada = 0;
  let valorPendente = 0;
  let valorReembolsado = 0;
  let qtdAprovadas = 0;

  const chartDataMap = new Map<string, number>();

  const formattedTransactions = rawReservations.map((res: any) => {
    const amount = Number(res.total_amount);
    
    if (res.status === "APPROVED") {
      receitaAprovada += amount;
      qtdAprovadas++;
      
      // Chart aggregation
      const dateStr = format(new Date(res.created_at), "dd/MM");
      chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + amount);
    } else if (res.status === "PENDING_PIX" || res.status === "AWAITING_MANUAL_CHECK") {
      valorPendente += amount;
    } else if (res.status === "REFUNDED") {
      valorReembolsado += amount;
    }

    // Extrair nomes com segurança
    const profileRaw = res.profiles as unknown;
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { full_name: string } | null;
    const clientName = profile?.full_name || "Cliente Desconhecido";
    
    const excursionRaw = res.excursions as unknown;
    const excursion = (Array.isArray(excursionRaw) ? excursionRaw[0] : excursionRaw) as { tour_packages: { title: string } | { title: string }[] | null } | null;
    const tourPackageRaw = excursion?.tour_packages;
    const tourPackage = (Array.isArray(tourPackageRaw) ? tourPackageRaw[0] : tourPackageRaw) as { title: string } | null;
    const excursionTitle = tourPackage?.title || "Excursão Genérica";

    return {
      id: res.id,
      amount,
      status: res.status,
      date: res.created_at,
      clientName,
      excursionTitle,
    };
  });

  const ticketMedio = qtdAprovadas > 0 ? receitaAprovada / qtdAprovadas : 0;

  // Formatar dados do gráfico (ordenados por data)
  const chartData = Array.from(chartDataMap.entries())
    .map(([date, receita]) => ({ date, receita }))
    .reverse(); // As transações estão desc, então revertemos para o gráfico ficar asc (cronológico)

  return {
    periodLabel,
    receitaAprovada,
    valorPendente,
    valorReembolsado,
    ticketMedio,
    chartData,
    formattedTransactions,
  };
}
