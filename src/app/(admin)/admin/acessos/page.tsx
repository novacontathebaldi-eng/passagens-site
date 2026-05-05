"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  role: "ADMIN" | "AGENT" | "PROMOTER" | "DRIVER" | "CLIENT";
  full_name: string;
  cpf: string | null;
  email_confirmed_at: string | null;
  created_at: string;
};

export default function GestaoAcessosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  async function fetchProfiles() {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, role, full_name, cpf, email_confirmed_at, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      setProfiles(data as Profile[]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, role, full_name, cpf, email_confirmed_at, created_at")
        .order("created_at", { ascending: false });
      if (!cancelled && data) setProfiles(data as Profile[]);
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  async function handleRoleChange(profileId: string, newRole: string) {
    const confirmChange = confirm(`Tem certeza que deseja mudar a role deste usuário para ${newRole}?`);
    if (!confirmChange) return;

    // Optimistic update
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole as Profile["role"] } : p));

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (error) {
      toast.error("Erro ao atualizar papel: " + error.message);
      fetchProfiles(); // Revert on error
    } else {
      // In a robust system, we would also add to audit_logs
      // For now, alert success visually or silently
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Gestão de Acessos (RBAC)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gerencie os níveis de permissão dos usuários da plataforma.
          </p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-[250px]"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 font-bold">Nome</th>
                <th className="px-6 py-4 font-bold">CPF</th>
                <th className="px-6 py-4 font-bold">Status (Email)</th>
                <th className="px-6 py-4 font-bold">Data de Cadastro</th>
                <th className="px-6 py-4 font-bold text-right">Nível de Acesso (Role)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-outline">Carregando usuários...</td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-outline">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{profile.full_name || "Sem nome"}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{profile.cpf || "Não informado"}</td>
                    <td className="px-6 py-4">
                      {profile.email_confirmed_at ? (
                        <span className="bg-success/10 text-success px-2 py-1 rounded-full text-xs font-bold">Verificado</span>
                      ) : (
                        <span className="bg-warning/10 text-warning px-2 py-1 rounded-full text-xs font-bold">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                        className={`bg-surface border border-outline-variant rounded-lg px-3 py-1.5 outline-none font-semibold text-sm cursor-pointer
                          ${profile.role === 'ADMIN' ? 'text-error border-error/50' : ''}
                          ${profile.role === 'AGENT' ? 'text-primary border-primary/50' : ''}
                          ${profile.role === 'DRIVER' ? 'text-warning border-warning/50' : ''}
                        `}
                      >
                        <option value="CLIENT">CLIENT (Passageiro)</option>
                        <option value="PROMOTER">PROMOTER (Afiliado)</option>
                        <option value="DRIVER">DRIVER (Motorista)</option>
                        <option value="AGENT">AGENT (Comercial)</option>
                        <option value="ADMIN">ADMIN (Acesso Total)</option>
                      </select>
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
