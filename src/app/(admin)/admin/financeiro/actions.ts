"use server";

import { createClient } from "@/lib/supabase/server";
import { startOfDay, subDays, startOfMonth, startOfYear, format } from "date-fns";

export async function getFinanceiroData(
  period: string,
  customDateRange?: { from: string; to: string }
) {
  const supabase = await createClient();

  // Calcular Datas Baseado no Período
  const now = new Date();
  let startDate = new Date();
  let endDate = now;
  let periodLabel = "Este Mês";

  if (period === "personalizado" && customDateRange) {
    startDate = new Date(customDateRange.from);
    endDate = new Date(customDateRange.to);
    // Expand end date to the end of the day
    endDate.setHours(23, 59, 59, 999);
    periodLabel = "Personalizado";
  } else {
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
  }

  const dateRange = {
    from: startDate.toISOString(),
    to: endDate.toISOString()
  };

  // Buscar Reservas do Supabase
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id,
      total_amount,
      discount_applied,
      gateway_provider,
      status,
      created_at,
      profiles ( full_name ),
      excursions (
        tour_packages ( title )
      ),
      passenger_tickets ( count )
    `)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
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

    // Extrair Pax
    const paxRaw = res.passenger_tickets as unknown;
    const paxCount = Array.isArray(paxRaw) && paxRaw.length > 0 
      ? Number(paxRaw[0].count) 
      : (paxRaw && typeof (paxRaw as any).count !== 'undefined' ? Number((paxRaw as any).count) : 0);

    return {
      id: res.id,
      amount,
      discount: Number(res.discount_applied || 0),
      gateway: res.gateway_provider || "N/A",
      pax: paxCount,
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
    dateRange,
    receitaAprovada,
    valorPendente,
    valorReembolsado,
    ticketMedio,
    totalTransactions: formattedTransactions.length,
    chartData,
    formattedTransactions,
  };
}
