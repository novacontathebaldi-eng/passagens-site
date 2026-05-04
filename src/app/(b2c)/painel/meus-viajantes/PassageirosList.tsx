"use client";

import { useState, useTransition } from "react";
import { addSavedPassenger, updateSavedPassenger, deleteSavedPassenger } from "../actions";
import { CheckCircle2, AlertCircle, Plus, Edit2, Trash2, UserCircle2 } from "lucide-react";
import { formatCPF, validateCPF } from "@/lib/utils";

interface Passenger {
  id: string;
  full_name: string;
  cpf: string;
  rg: string | null;
  orgao_emissor: string | null;
  birth_date: string | null;
}

export default function PassageirosList({ initialPassengers }: { initialPassengers: Passenger[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    rg: "",
    orgao_emissor: "",
    birth_date: "",
  });

  const openNewModal = () => {
    setEditingPassenger(null);
    setFormData({
      full_name: "",
      cpf: "",
      rg: "",
      orgao_emissor: "",
      birth_date: "",
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    setFormData({
      full_name: passenger.full_name,
      cpf: formatCPF(passenger.cpf),
      rg: passenger.rg || "",
      orgao_emissor: passenger.orgao_emissor || "",
      birth_date: passenger.birth_date || "",
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "cpf") {
      newValue = formatCPF(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.cpf && !validateCPF(formData.cpf)) {
      setMessage({ type: "error", text: "O CPF informado é inválido." });
      return;
    }

    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("cpf", formData.cpf);
    data.append("rg", formData.rg);
    data.append("orgao_emissor", formData.orgao_emissor);
    data.append("birth_date", formData.birth_date);

    startTransition(async () => {
      let res;
      if (editingPassenger) {
        res = await updateSavedPassenger(editingPassenger.id, data);
      } else {
        res = await addSavedPassenger(data);
      }

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setIsModalOpen(false);
        setMessage({ type: "success", text: editingPassenger ? "Passageiro atualizado!" : "Passageiro adicionado!" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este passageiro?")) return;

    startTransition(async () => {
      const res = await deleteSavedPassenger(id);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Passageiro excluído." });
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-on-surface">Lista de Passageiros</h2>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:shadow-glow-primary transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Passageiro
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-success/10 border border-success/20 text-success" 
            : "bg-error/10 border border-error/20 text-error"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {initialPassengers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-outline-variant/30 rounded-2xl">
          <UserCircle2 className="w-12 h-12 text-outline-variant mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-on-surface">Nenhum passageiro salvo</h3>
          <p className="text-sm text-on-surface-variant mt-1">Adicione seus dependentes para agilizar o check-out nas suas próximas compras.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialPassengers.map(passenger => (
            <div key={passenger.id} className="border border-outline-variant/40 rounded-2xl p-5 hover:border-primary/50 transition-colors bg-surface relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-on-surface">{passenger.full_name}</h3>
                  <div className="text-sm text-on-surface-variant mt-1 space-y-1">
                    <p>CPF: {formatCPF(passenger.cpf)}</p>
                    {passenger.rg && <p>RG: {passenger.rg} {passenger.orgao_emissor ? `(${passenger.orgao_emissor})` : ''}</p>}
                    {passenger.birth_date && <p>Nasc: {new Date(passenger.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>}
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(passenger)}
                    disabled={isPending}
                    className="p-2 bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors disabled:opacity-50"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(passenger.id)}
                    disabled={isPending}
                    className="p-2 bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Glassmorphism */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-surface rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl border border-outline-variant/30 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-on-surface mb-6">
              {editingPassenger ? "Editar Passageiro" : "Novo Passageiro"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface">Nome Completo *</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">CPF *</label>
                  <input
                    name="cpf"
                    type="text"
                    required
                    maxLength={14}
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">Data de Nascimento</label>
                  <input
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">RG (Opcional)</label>
                  <input
                    name="rg"
                    type="text"
                    value={formData.rg}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface">Órgão Emissor</label>
                  <input
                    name="orgao_emissor"
                    type="text"
                    value={formData.orgao_emissor}
                    onChange={handleChange}
                    placeholder="SSP/SP"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-5 py-2.5 font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:shadow-glow-primary hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
