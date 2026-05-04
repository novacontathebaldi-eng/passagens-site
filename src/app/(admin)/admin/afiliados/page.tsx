"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBRL, formatDate } from "@/lib/utils";

type Promoter = {
  id: string;
  referral_code: string;
  commission_percentage: number;
  total_earnings: number;
  created_at: string;
  profiles: { full_name: string } | null;
};

export default function AfiliadosAdminPage() {
  const supabase = createClient();

  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal form state
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [commission, setCommission] = useState("10");
  const [isSaving, setIsSaving] = useState(false);

  async function fetchPromoters() {
    const { data } = await supabase
      .from("promoters")
      .select("id, referral_code, commission_percentage, total_earnings, created_at, profiles (full_name)")
      .order("created_at", { ascending: false });

    if (data) setPromoters(data as unknown as Promoter[]);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("promoters")
        .select("id, referral_code, commission_percentage, total_earnings, created_at, profiles (full_name)")
        .order("created_at", { ascending: false });
      if (!cancelled && data) setPromoters(data as unknown as Promoter[]);
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  async function handleSearchUser() {
    setSearchError(null);
    setFoundUser(null);

    if (!searchEmail.trim()) { setSearchError("Digite um nome para buscar."); return; }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${searchEmail}%`)
      .limit(1)
      .single();

    if (error || !data) {
      setSearchError("Usuário não encontrado. Verifique o nome.");
    } else {
      setFoundUser(data);
      setReferralCode(data.full_name.split(" ")[0].toUpperCase() + Math.floor(Math.random() * 1000));
    }
  }

  async function handleCreatePromoter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!foundUser) return;
    setIsSaving(true);

    // First, update user role to PROMOTER
    await supabase.from("profiles").update({ role: "PROMOTER" }).eq("id", foundUser.id);

    // Then create promoter record
    const { error } = await supabase.from("promoters").insert([{
      profile_id: foundUser.id,
      referral_code: referralCode,
      commission_percentage: parseFloat(commission),
    }]);

    setIsSaving(false);

    if (error) {
      setSearchError("Erro ao criar promotor: " + error.message);
    } else {
      setShowModal(false);
      setSearchEmail("");
      setFoundUser(null);
      fetchPromoters();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este promotor?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("promoters").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setPromoters(prev => prev.filter(p => p.id !== id));
    }
    setDeletingId(null);
  }

  const totalPromoters = promoters.length;
  const totalCommissions = promoters.reduce((sum, p) => sum + Number(p.total_earnings), 0);

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
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl gradient-cta text-on-cta text-sm font-semibold shadow-sm hover:shadow-glow-cta transition-all"
        >
          + Novo Promotor
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-container/30 rounded-3xl p-6 border border-primary/10">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-on-surface-variant mb-1">Total de Promotores</p>
          <p className="text-3xl font-bold text-primary">{totalPromoters}</p>
        </div>
        <div className="bg-success-container/30 rounded-3xl p-6 border border-success/10">
          <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center text-success mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-on-surface-variant mb-1">Comissões Geradas</p>
          <p className="text-3xl font-bold text-success">{formatBRL(totalCommissions)}</p>
        </div>
      </div>

      {/* Tabela */}
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
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-outline">Carregando...</td></tr>
              ) : promoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    Nenhum promotor cadastrado ainda.
                  </td>
                </tr>
              ) : (
                promoters.map(p => {
                  const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                  const initial = profile?.full_name?.charAt(0) || "?";
                  return (
                    <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">{initial}</div>
                          <span className="font-bold text-on-surface">{profile?.full_name || "Desconhecido"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.247a4.5 4.5 0 00-6.364-6.364L4.34 6.182a4.5 4.5 0 006.364 6.364" />
                          </svg>
                          {p.referral_code}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="font-bold text-on-surface">{p.commission_percentage}%</span></td>
                      <td className="px-6 py-4"><span className="font-bold text-success">{formatBRL(Number(p.total_earnings))}</span></td>
                      <td className="px-6 py-4 text-on-surface-variant">{formatDate(p.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-error hover:text-error-light text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === p.id ? "..." : "Remover"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal — Novo Promotor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-xl border border-outline-variant/30 w-full max-w-md mx-4 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Vincular Promotor</h2>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step 1: Search User */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-on-surface">Buscar Usuário pelo Nome</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do usuário..."
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button onClick={handleSearchUser} className="bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
                  Buscar
                </button>
              </div>
              {searchError && <p className="text-error text-sm">{searchError}</p>}
            </div>

            {/* Step 2: Configure */}
            {foundUser && (
              <form onSubmit={handleCreatePromoter} className="space-y-4 border-t border-outline-variant/30 pt-4">
                <div className="p-3 bg-success-light/50 rounded-xl text-success text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Encontrado: {foundUser.full_name}
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Código de Indicação</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value)}
                    required
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Comissão (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={e => setCommission(e.target.value)}
                    required
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {isSaving ? "Criando..." : "Criar Promotor"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
