"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "../actions";
import { formatCPF, formatPhone, validateCPF } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileData {
  full_name: string;
  cpf: string;
  phone: string;
  birth_date: string;
}

export default function MeusDadosForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<ProfileData>({
    full_name: initialData?.full_name || "",
    cpf: initialData?.cpf ? formatCPF(initialData.cpf) : "",
    phone: initialData?.phone ? formatPhone(initialData.phone) : "",
    birth_date: initialData?.birth_date || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "cpf") {
      newValue = formatCPF(value);
    } else if (name === "phone") {
      newValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast.error("O CPF informado é inválido.");
      return;
    }

    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("cpf", formData.cpf);
    data.append("phone", formData.phone);
    data.append("birth_date", formData.birth_date);

    startTransition(async () => {
      const res = await updateProfile(data);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Dados atualizados com sucesso!");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="full_name" className="block text-sm font-semibold text-on-surface">Nome Completo</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Seu nome completo"
            className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cpf" className="block text-sm font-semibold text-on-surface">CPF</label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            maxLength={14}
            value={formData.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
            className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-semibold text-on-surface">Telefone (WhatsApp)</label>
          <input
            id="phone"
            name="phone"
            type="text"
            maxLength={15}
            value={formData.phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="birth_date" className="block text-sm font-semibold text-on-surface">Data de Nascimento</label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:shadow-glow-primary hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </button>
      </div>
    </form>
  );
}
