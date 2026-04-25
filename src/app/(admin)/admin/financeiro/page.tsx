import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Financeiro — Admin Partiu Turismo",
  robots: "noindex, nofollow",
};

export default async function FinanceiroPage() {
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
    redirect("/admin"); // Redireciona para o dashboard se não for ADMIN pleno
  }

  // TODO: Fetch real data for KPIs and Transactions

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
          {/* Export Button Placeholder */}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* FILTROS DE PERÍODO */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 hide-scrollbar">
        {["Hoje", "Últimos 7 dias", "Este Mês", "Personalizado"].map((filter, i) => (
          <button
            key={filter}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              i === 2
                ? "bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container/50"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* KPIs GLOBAIS (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Receita Total */}
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
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">R$ 0,00</h3>
            <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              +0% comparado ao período anterior
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
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
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">R$ 0,00</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-2">Por transação aprovada</p>
          </div>
        </div>

        {/* Valor Pendente */}
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
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">R$ 0,00</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-2">Reservas PENDING_PIX</p>
          </div>
        </div>

        {/* Reembolsos */}
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
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">R$ 0,00</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-2">Status REFUNDED</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO (Ocupa 2/3 da tela) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)]">
              Evolução da Receita
            </h2>
            <select className="bg-surface-container border border-outline-variant/30 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
              <option>Últimos 30 dias</option>
              <option>Últimos 3 meses</option>
              <option>Últimos 12 meses</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/50">
            <p className="text-on-surface-variant text-sm text-center">
              Gráfico será inserido aqui
              <br />
              <span className="text-xs opacity-70">(Utilizando Recharts)</span>
            </p>
          </div>
        </div>

        {/* RESUMO POR MEIO DE PAGAMENTO */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/20 flex flex-col">
          <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)] mb-6">
            Meios de Pagamento
          </h2>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="space-y-4">
              {/* PIX */}
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
              
              {/* Cartão de Crédito (Futuro) */}
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
            
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <p className="text-xs text-primary font-medium text-center">
                Atualmente, 100% das transações são processadas via PIX Manual Assíncrono.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES RECENTES */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-on-surface font-[family-name:var(--font-display)]">
            Transações Recentes
          </h2>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Buscar por ID ou Nome..." 
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant font-medium border-b border-outline-variant/20">
                <th className="p-4 pl-6">ID Reserva</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Excursão</th>
                <th className="p-4">Data</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              <tr className="hover:bg-surface-container-low/50 transition-colors">
                <td className="p-4 pl-6 text-on-surface-variant font-mono text-xs">#A1B2C3D</td>
                <td className="p-4 font-medium text-on-surface">João Silva</td>
                <td className="p-4 text-on-surface-variant">Capitólio - Feriadão</td>
                <td className="p-4 text-on-surface-variant">25/04/2026</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Aprovado
                  </span>
                </td>
                <td className="p-4 pr-6 text-right font-bold text-on-surface">R$ 450,00</td>
              </tr>
              <tr className="hover:bg-surface-container-low/50 transition-colors">
                <td className="p-4 pl-6 text-on-surface-variant font-mono text-xs">#E4F5G6H</td>
                <td className="p-4 font-medium text-on-surface">Maria Oliveira</td>
                <td className="p-4 text-on-surface-variant">Cabo Frio</td>
                <td className="p-4 text-on-surface-variant">24/04/2026</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    Pendente
                  </span>
                </td>
                <td className="p-4 pr-6 text-right font-bold text-on-surface">R$ 380,00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant/20 flex justify-center">
          <button className="text-primary text-sm font-medium hover:underline">
            Ver todas as transações
          </button>
        </div>
      </div>
    </div>
  );
}
