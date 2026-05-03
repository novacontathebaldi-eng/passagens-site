"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";

export default function ClientsSearchForm() {
  const searchParams = useSearchParams();
  const currentQ = searchParams.get("q") || "";
  const currentRole = searchParams.get("role") || "ALL";

  return (
    <Form action="/admin/clientes" className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        name="q"
        defaultValue={currentQ}
        placeholder="Buscar por nome, CPF ou telefone..."
        className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      >
        <option value="ALL">Todas as Roles</option>
        <option value="CLIENT">Clientes</option>
        <option value="ADMIN">Admins</option>
        <option value="AGENT">Agentes</option>
        <option value="DRIVER">Motoristas</option>
        <option value="PROMOTER">Promotores</option>
      </select>
      <button 
        type="submit"
        className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-dark transition-colors"
      >
        Filtrar
      </button>
    </Form>
  );
}
