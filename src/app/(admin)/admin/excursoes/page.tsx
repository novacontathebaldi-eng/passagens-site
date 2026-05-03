"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Excursion = {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "SOLD_OUT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  price_per_seat: number;
  departure_date: string;
  allow_seat_selection: boolean;
  tour_packages: { title: string };
  vehicle_layouts: { name: string; capacity: number } | null;
};

export default function ExcursoesPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchExcursions() {
    const { data } = await supabase
      .from("excursions")
      .select(`
        id,
        status,
        price_per_seat,
        departure_date,
        allow_seat_selection,
        tour_packages ( title ),
        vehicle_layouts ( name, capacity )
      `)
      .order("departure_date", { ascending: true });

    if (data) {
      setExcursions(data as unknown as Excursion[]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchExcursions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta excursão? Esta ação não pode ser desfeita.")) return;

    setDeletingId(id);
    const { error } = await supabase.from("excursions").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setExcursions(prev => prev.filter(e => e.id !== id));
    }
    setDeletingId(null);
  }

  async function handleStatusToggle(id: string, current: Excursion["status"]) {
    const newStatus = current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setExcursions(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));

    const { error } = await supabase
      .from("excursions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      fetchExcursions();
    }
  }

  const getStatusBadge = (status: Excursion["status"]) => {
    const map: Record<string, { cls: string; label: string }> = {
      PUBLISHED: { cls: "bg-success-light text-success", label: "Publicado" },
      DRAFT: { cls: "bg-surface-container-high text-on-surface-variant", label: "Rascunho" },
      SOLD_OUT: { cls: "bg-error-light text-error", label: "Esgotado" },
      IN_PROGRESS: { cls: "bg-secondary-container text-on-secondary-container", label: "Em Andamento" },
      COMPLETED: { cls: "bg-surface-container-high text-on-surface-variant", label: "Concluído" },
      CANCELLED: { cls: "bg-error-light text-error", label: "Cancelado" },
    };
    const s = map[status] || { cls: "bg-surface-container-high text-on-surface-variant", label: status };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Excursões Agendadas
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Programe datas, frotas e preços para os roteiros cadastrados.
          </p>
        </div>
        <Link
          href="/admin/excursoes/novo"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap text-center"
        >
          + Nova Excursão
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="py-3 px-6 text-sm font-semibold">Excursão (Roteiro)</th>
                <th className="py-3 px-6 text-sm font-semibold">Saída</th>
                <th className="py-3 px-6 text-sm font-semibold">Ônibus / Mapa</th>
                <th className="py-3 px-6 text-sm font-semibold">Preço</th>
                <th className="py-3 px-6 text-sm font-semibold">Status</th>
                <th className="py-3 px-6 text-sm font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline">
                    Carregando excursões...
                  </td>
                </tr>
              ) : excursions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-outline">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Nenhuma excursão agendada.
                    <Link href="/admin/excursoes/novo" className="block mt-2 text-primary hover:underline text-sm font-medium">
                      Agendar primeira excursão →
                    </Link>
                  </td>
                </tr>
              ) : (
                excursions.map((exc) => {
                  const tourTitle = Array.isArray(exc.tour_packages) ? exc.tour_packages[0]?.title : exc.tour_packages?.title;
                  const layoutName = Array.isArray(exc.vehicle_layouts) ? exc.vehicle_layouts[0]?.name : exc.vehicle_layouts?.name;
                  const layoutCapacity = Array.isArray(exc.vehicle_layouts) ? exc.vehicle_layouts[0]?.capacity : exc.vehicle_layouts?.capacity;

                  return (
                    <tr key={exc.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-on-surface">{tourTitle || "Roteiro Desconhecido"}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">ID: {exc.id.split('-')[0]}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium">
                          {new Date(exc.departure_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-outline">
                          {new Date(exc.departure_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">{layoutName || "Padrão"} ({layoutCapacity || 42} lugares)</div>
                        <div className="text-xs mt-0.5">
                          {exc.allow_seat_selection ? (
                            <span className="text-secondary-dark flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary-dark"></span> Mapa Aberto
                            </span>
                          ) : (
                            <span className="text-outline flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Alocação Oculta
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-primary-dark">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exc.price_per_seat)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleStatusToggle(exc.id, exc.status)}
                          title="Clique para alternar status"
                          className="cursor-pointer"
                        >
                          {getStatusBadge(exc.status)}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/admin/excursoes/${exc.id}`}
                          className="text-primary hover:text-primary-dark text-sm font-bold transition-colors"
                        >
                          Detalhes
                        </Link>
                        <Link
                          href={`/admin/excursoes/${exc.id}/editar`}
                          className="text-outline hover:text-on-surface text-sm font-medium transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(exc.id)}
                          disabled={deletingId === exc.id}
                          className="text-error hover:text-error-light text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === exc.id ? "..." : "Excluir"}
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
    </div>
  );
}
