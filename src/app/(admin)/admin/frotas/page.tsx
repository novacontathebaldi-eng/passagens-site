"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  useEffect(() => {
    async function fetchLayouts() {
      const { data, error } = await supabase
        .from("vehicle_layouts")
        .select("id, name, capacity, amenities, created_at")
        .order("created_at", { ascending: false });

      if (data) {
        setLayouts(data as VehicleLayout[]);
      }
      setIsLoading(false);
    }
    fetchLayouts();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Construtor de Frotas
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gerencie os layouts de ônibus, definindo matrizes de assentos, capacidade e amenidades.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
          + Novo Ônibus / Layout
        </button>
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
                  <td colSpan={4} className="py-8 text-center text-outline">
                    Carregando frota...
                  </td>
                </tr>
              ) : layouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-outline">
                    Nenhum layout de ônibus cadastrado.
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
                        <span className="text-xl">💺</span>
                        <span className="font-semibold text-on-surface">{layout.capacity}</span>
                        <span className="text-sm text-on-surface-variant">poltronas</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        {layout.amenities?.wifi && <span className="text-lg" title="Wi-Fi">📶</span>}
                        {layout.amenities?.ac && <span className="text-lg" title="Ar Condicionado">❄️</span>}
                        {layout.amenities?.bathroom && <span className="text-lg" title="Banheiro">🚻</span>}
                        {layout.amenities?.usb && <span className="text-lg" title="Tomadas USB">🔌</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-primary hover:text-primary-dark text-sm font-medium mr-4 transition-colors">
                        Editar Grid
                      </button>
                      <button className="text-error hover:text-error-light text-sm font-medium transition-colors">
                        Excluir
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
