"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCPF, formatPhone, formatDate, USER_ROLE_LABELS } from "@/lib/utils";

type Profile = {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  email_confirmed_at: string | null;
  created_at: string;
  avatar_url: string | null;
};

export default function ClientesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    let result = profiles;
    if (roleFilter !== "ALL") {
      result = result.filter(p => p.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.cpf?.includes(q) ||
        p.phone?.includes(q)
      );
    }
    setFiltered(result);
  }, [profiles, search, roleFilter]);

  async function fetchProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, cpf, phone, role, email_confirmed_at, created_at, avatar_url")
      .order("created_at", { ascending: false });

    if (data) {
      setProfiles(data);
      setFiltered(data);
    }
    setIsLoading(false);
  }

  async function handleRoleChange(profileId: string, newRole: string) {
    setEditingRole(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (error) {
      alert("Erro ao alterar role: " + error.message);
    } else {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    }
    setEditingRole(null);
  }

  const stats = {
    total: profiles.length,
    clients: profiles.filter(p => p.role === "CLIENT").length,
    admins: profiles.filter(p => p.role === "ADMIN").length,
    agents: profiles.filter(p => p.role === "AGENT").length,
    drivers: profiles.filter(p => p.role === "DRIVER").length,
    promoters: profiles.filter(p => p.role === "PROMOTER").length,
  };

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Gestão de Usuários
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Todos os usuários do sistema. Gerencie roles, visualize perfis e monitore registros.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-on-surface" },
          { label: "Clientes", value: stats.clients, color: "text-primary" },
          { label: "Admins", value: stats.admins, color: "text-error" },
          { label: "Agentes", value: stats.agents, color: "text-secondary-dark" },
          { label: "Motoristas", value: stats.drivers, color: "text-success" },
          { label: "Promotores", value: stats.promoters, color: "text-cta" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 text-center">
            <p className="text-xs font-medium text-on-surface-variant">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        >
          <option value="ALL">Todas as Roles</option>
          <option value="CLIENT">Clientes</option>
          <option value="ADMIN">Admins</option>
          <option value="AGENT">Agentes</option>
          <option value="DRIVER">Motoristas</option>
          <option value="PROMOTER">Promotores</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="py-3 px-6 text-sm font-semibold">Usuário</th>
                <th className="py-3 px-6 text-sm font-semibold">CPF</th>
                <th className="py-3 px-6 text-sm font-semibold">Telefone</th>
                <th className="py-3 px-6 text-sm font-semibold">Role</th>
                <th className="py-3 px-6 text-sm font-semibold">Desde</th>
                <th className="py-3 px-6 text-sm font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-outline">Carregando usuários...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-outline">Nenhum usuário encontrado.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-primary">
                            {getInitials(p.full_name || "?")}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-on-surface">{p.full_name}</p>
                          <p className="text-xs text-outline font-mono">{p.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-on-surface-variant">{p.cpf ? formatCPF(p.cpf) : "—"}</td>
                    <td className="py-3 px-6 text-sm text-on-surface-variant">{p.phone ? formatPhone(p.phone) : "—"}</td>
                    <td className="py-3 px-6">
                      <select
                        value={p.role}
                        onChange={e => handleRoleChange(p.id, e.target.value)}
                        disabled={editingRole === p.id}
                        className={`text-xs font-bold rounded-full px-3 py-1 border cursor-pointer transition-colors
                          ${p.role === "ADMIN" ? "bg-error-light text-error border-error/20" : ""}
                          ${p.role === "AGENT" ? "bg-secondary-container text-on-secondary-container border-secondary/20" : ""}
                          ${p.role === "CLIENT" ? "bg-primary-container text-primary border-primary/20" : ""}
                          ${p.role === "DRIVER" ? "bg-success-light text-success border-success/20" : ""}
                          ${p.role === "PROMOTER" ? "bg-warning-light text-warning border-warning/20" : ""}
                        `}
                      >
                        <option value="CLIENT">Cliente</option>
                        <option value="ADMIN">Admin</option>
                        <option value="AGENT">Agente</option>
                        <option value="DRIVER">Motorista</option>
                        <option value="PROMOTER">Promotor</option>
                      </select>
                    </td>
                    <td className="py-3 px-6 text-sm text-on-surface-variant">{formatDate(p.created_at)}</td>
                    <td className="py-3 px-6">
                      {p.email_confirmed_at ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verificado
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-warning">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
