"use client";

import { useState, useTransition } from "react";
import { changeUserRole } from "./actions";
import { toast } from "sonner";

export default function RoleSelect({ userId, initialRole }: { userId: string; initialRole: string }) {
  const [role, setRole] = useState(initialRole);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    const oldRole = role;
    setRole(newRole);

    startTransition(async () => {
      try {
        await changeUserRole(userId, newRole);
        toast.success("Role alterada com sucesso!");
      } catch (error: any) {
        toast.error("Erro ao alterar role: " + error.message);
        setRole(oldRole); // revert
      }
    });
  };

  return (
    <select
      value={role}
      onChange={handleRoleChange}
      disabled={isPending}
      className={`text-xs font-bold rounded-full px-3 py-1 border cursor-pointer transition-colors
        ${role === "ADMIN" ? "bg-error-light text-error border-error/20" : ""}
        ${role === "AGENT" ? "bg-secondary-container text-on-secondary-container border-secondary/20" : ""}
        ${role === "CLIENT" ? "bg-primary-container text-primary border-primary/20" : ""}
        ${role === "DRIVER" ? "bg-success-light text-success border-success/20" : ""}
        ${role === "PROMOTER" ? "bg-warning-light text-warning border-warning/20" : ""}
        ${isPending ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <option value="CLIENT">Cliente</option>
      <option value="ADMIN">Admin</option>
      <option value="AGENT">Agente</option>
      <option value="DRIVER">Motorista</option>
      <option value="PROMOTER">Promotor</option>
    </select>
  );
}
