import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, Link as LinkIcon, DollarSign, ArrowUpRight } from "lucide-react";

export default async function AfiliadosAdminPage() {
  const supabase = await createClient();

  const { data: promoters } = await supabase
    .from("promoters")
    .select(`
      id,
      referral_code,
      commission_percentage,
      total_earnings,
      created_at,
      profiles (full_name, email)
    `)
    .order("created_at", { ascending: false });

  // Calculate global stats
  const totalPromoters = promoters?.length || 0;
  const totalCommissions = promoters?.reduce((sum, p) => sum + Number(p.total_earnings), 0) || 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)]">
            Afiliados & Promotores
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gestão do programa de indicações e comissionamento.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl gradient-cta text-on-cta text-sm font-semibold shadow-sm hover:shadow-glow-cta transition-all">
          + Novo Promotor
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary-container/30 rounded-3xl p-6 border border-primary/10">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant mb-1">Total de Promotores</p>
          <p className="text-3xl font-bold text-primary">{totalPromoters}</p>
        </div>

        <div className="bg-success-container/30 rounded-3xl p-6 border border-success/10">
          <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center text-success mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant mb-1">Comissões Geradas</p>
          <p className="text-3xl font-bold text-success">{formatBRL(totalCommissions)}</p>
        </div>
      </div>

      {/* Tabela de Promotores */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container/50 border-b border-outline-variant/30 text-on-surface-variant uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Promotor</th>
                <th className="px-6 py-4 font-bold">Código de Indicação</th>
                <th className="px-6 py-4 font-bold">Comissão (%)</th>
                <th className="px-6 py-4 font-bold">Ganhos Totais</th>
                <th className="px-6 py-4 font-bold">Data de Adesão</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {promoters && promoters.length > 0 ? (
                promoters.map((p) => {
                  const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                  return (
                    <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">
                            {profile?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{profile?.full_name}</p>
                            <p className="text-xs text-on-surface-variant">{profile?.email || "Email não encontrado"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
                          <LinkIcon className="w-3 h-3" />
                          {p.referral_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-on-surface">{p.commission_percentage}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-success">{formatBRL(Number(p.total_earnings))}</span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <ArrowUpRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Nenhum promotor cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
