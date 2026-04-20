"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type VehicleLayout = {
  id: string;
  name: string;
  capacity: number;
  amenities: { wifi: boolean; ac: boolean; bathroom: boolean; usb: boolean };
  created_at: string;
};

export default function FrotasPage() {
  const [layouts, setLayouts] = useState<VehicleLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchLayouts();
  }, []);

  async function fetchLayouts() {
    const { data } = await supabase
      .from("vehicle_layouts")
      .select("id, name, capacity, amenities, created_at")
      .order("created_at", { ascending: false });

    if (data) setLayouts(data as VehicleLayout[]);
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este layout de ônibus? Excursões vinculadas serão afetadas.")) return;

    setDeletingId(id);
    const { error } = await supabase.from("vehicle_layouts").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      setLayouts(prev => prev.filter(l => l.id !== id));
    }
    setDeletingId(null);
  }

  const amenityIcons: { key: keyof VehicleLayout["amenities"]; label: string; icon: string }[] = [
    { key: "wifi", label: "Wi-Fi", icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" },
    { key: "ac", label: "Ar Condicionado", icon: "M12 3v18m-4.5-6l4.5 3 4.5-3M7.5 9l4.5-3 4.5 3" },
    { key: "bathroom", label: "Banheiro", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
    { key: "usb", label: "Tomadas USB", icon: "M5 12h14M12 5l7 7-7 7" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Construtor de Frotas
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gerencie os layouts de ônibus, definindo matrizes de assentos, capacidade e amenidades.
          </p>
        </div>
        <Link
          href="/admin/frotas/novo"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap text-center"
        >
          + Novo Ônibus / Layout
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="py-3 px-6 text-sm font-semibold">Nome do Modelo</th>
                <th className="py-3 px-6 text-sm font-semibold">Capacidade</th>
                <th className="py-3 px-6 text-sm font-semibold">Amenidades</th>
                <th className="py-3 px-6 text-sm font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-outline">Carregando frota...</td>
                </tr>
              ) : layouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-outline">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Nenhum layout de ônibus cadastrado.
                    <Link href="/admin/frotas/novo" className="block mt-2 text-primary hover:underline text-sm font-medium">
                      Criar primeiro layout →
                    </Link>
                  </td>
                </tr>
              ) : (
                layouts.map((layout) => (
                  <tr key={layout.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-on-surface">{layout.name}</div>
                      <div className="text-xs text-outline mt-0.5">Criado em {new Date(layout.created_at).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                        <span className="font-semibold text-on-surface">{layout.capacity}</span>
                        <span className="text-sm text-on-surface-variant">poltronas</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {amenityIcons.map(a => layout.amenities?.[a.key] && (
                          <span key={a.key} title={a.label} className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center">
                            <svg className="w-4 h-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                            </svg>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/frotas/${layout.id}/editar`}
                        className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                      >
                        Editar Grid
                      </Link>
                      <button
                        onClick={() => handleDelete(layout.id)}
                        disabled={deletingId === layout.id}
                        className="text-error hover:text-error-light text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {deletingId === layout.id ? "..." : "Excluir"}
                      </button>
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
