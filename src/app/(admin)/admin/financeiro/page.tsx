import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import { redirect } from "next/navigation";
import { PeriodFilters } from "./PeriodFilters";
import { FinanceiroChart } from "./FinanceiroChart";
import { ExportReportButton } from "./ExportReportButton";
import Link from "next/link";
import { startOfDay, subDays, startOfMonth, startOfYear, format } from "date-fns";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Financeiro — Admin ${settings.company_name}`,
    robots: "noindex, nofollow",
  };
}

interface SearchParams {
  period?: string;
  [key: string]: string | string[] | undefined;
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "este_mes";
  
  const supabase = await createClient();

  // 1. Verificar Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Verificar Nível de Acesso (Apenas ADMIN pode ver o financeiro)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/admin");
  }

  // 3. Configurações Globais (Nome e Logo)
  const settings = await getSiteSettings();

  // 4. Calcular Datas Baseado no Período
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
  }

  // 5. Buscar Reservas do Supabase
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

  // 6. Processar Dados e KPIs
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
    const clientName = res.profiles?.full_name || "Cliente Desconhecido";
    const excursionTitle = res.excursions?.tour_packages?.title || "Excursão Genérica";

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

  // Formatadores de moeda
  const formatCurrency = (val: number) => 
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const translateStatus = (status: string) => {
    switch (status) {
      case "APPROVED": return { label: "Aprovado", color: "bg-green-500", bg: "bg-green-500/10", text: "text-green-600" };
      case "PENDING_PIX": 
      case "AWAITING_MANUAL_CHECK": return { label: "Aguardando PIX", color: "bg-orange-500", bg: "bg-orange-500/10", text: "text-orange-600", pulse: true };
      case "REFUNDED": return { label: "Reembolsado", color: "bg-red-500", bg: "bg-red-500/10", text: "text-red-600" };
      case "CANCELLED": return { label: "Cancelado", color: "bg-gray-500", bg: "bg-gray-500/10", text: "text-gray-600" };
      case "EXPIRED": return { label: "Expirado", color: "bg-gray-500", bg: "bg-gray-500/10", text: "text-gray-600" };
      default: return { label: status, color: "bg-gray-500", bg: "bg-gray-500/10", text: "text-gray-600" };
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">
            Financeiro
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gestão de fluxo de caixa e relatórios de vendas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportReportButton 
            transactions={formattedTransactions}
            companyName={settings.company_name}
            logoUrl={settings.logo_url || ""}
            periodLabel={periodLabel}
            kpis={{
              receita: receitaAprovada,
              ticketMedio,
              pendente: valorPendente,
              reembolsado: valorReembolsado
            }}
          />
        </div>
      </div>

      {/* FILTROS DE PERÍODO */}
      <PeriodFilters />

      {/* KPIs GLOBAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-on-surface-variant text-sm font-medium">Receita Aprovada</p>
            <div className="p-2 bg-green-500/10 text-green-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(receitaAprovada)}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-on-surface-variant text-sm font-medium">Ticket Médio</p>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(ticketMedio)}</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-2">Por transação aprovada</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-on-surface-variant text-sm font-medium">Aguardando PIX</p>
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(valorPendente)}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-on-surface-variant text-sm font-medium">Reembolsado</p>
            <div className="p-2 bg-red-500/10 text-red-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(valorReembolsado)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)]">
              Evolução da Receita
            </h2>
            <span className="text-sm font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {periodLabel}
            </span>
          </div>
          <FinanceiroChart data={chartData} />
        </div>

        {/* RESUMO POR MEIO DE PAGAMENTO */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col">
          <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)] mb-6">
            Meios de Pagamento
          </h2>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    PIX
                  </span>
                  <span className="text-sm font-bold text-on-surface">100%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-surface-container-high"></div>
                    Cartão de Crédito
                  </span>
                  <span className="text-sm font-bold text-on-surface-variant">0%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-surface-container-high h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 mt-auto">
              <p className="text-xs text-primary font-medium text-center">
                Atualmente, todas as transações da plataforma são processadas exclusivamente via PIX.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES RECENTES */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)]">
            Transações no Período
          </h2>
        </div>
        
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-surface-container-low z-10 shadow-sm">
              <tr className="text-xs uppercase tracking-wider text-on-surface-variant font-medium border-b border-outline-variant/20">
                <th className="p-4 pl-6 whitespace-nowrap">ID Reserva</th>
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Excursão</th>
                <th className="p-4 whitespace-nowrap">Data</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 pr-6 text-right whitespace-nowrap">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              {formattedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Nenhuma transação encontrada para este período.
                  </td>
                </tr>
              ) : (
                formattedTransactions.map((t: any) => {
                  const statusUI = translateStatus(t.status);
                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4 pl-6 text-on-surface-variant font-mono text-xs whitespace-nowrap" title={t.id}>
                        {t.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4 font-medium text-on-surface whitespace-nowrap">{t.clientName}</td>
                      <td className="p-4 text-on-surface-variant min-w-[200px]">{t.excursionTitle}</td>
                      <td className="p-4 text-on-surface-variant whitespace-nowrap">
                        {format(new Date(t.date), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusUI.bg} ${statusUI.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusUI.color} ${statusUI.pulse ? 'animate-pulse' : ''}`}></span>
                          {statusUI.label}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right font-bold text-on-surface whitespace-nowrap">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant/20 flex justify-center bg-surface-container-lowest z-10">
          <Link href="/admin/reservas" className="text-primary text-sm font-medium hover:underline">
            Ver todas as reservas cadastradas
          </Link>
        </div>
      </div>
    </div>
  );
}
