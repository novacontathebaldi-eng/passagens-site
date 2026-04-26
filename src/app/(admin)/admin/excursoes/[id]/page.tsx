"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AdminRelatorioVistoria from "@/components/admin/AdminRelatorioVistoria";

export default function ExcursaoDetalhesPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const [excursion, setExcursion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("excursions")
        .select(`
          id, status, departure_date, price_per_seat, allow_seat_selection, highlight_text,
          tour_packages ( title ),
          vehicle_layouts ( name, capacity )
        `)
        .eq("id", id)
        .single();
        
      setExcursion(data);
      setIsLoading(false);
    }
    load();
  }, [id, supabase]);

  if (isLoading) return <div className="p-8 text-center text-outline">Carregando detalhes...</div>;
  if (!excursion) return <div className="p-8 text-center text-error">Excursão não encontrada.</div>;

  const tourTitle = Array.isArray(excursion.tour_packages) ? excursion.tour_packages[0]?.title : excursion.tour_packages?.title;
  const layoutName = Array.isArray(excursion.vehicle_layouts) ? excursion.vehicle_layouts[0]?.name : excursion.vehicle_layouts?.name;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/excursoes" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Voltar para Excursões
          </Link>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            {tourTitle || "Roteiro Desconhecido"}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 flex items-center gap-2">
            ID: {id.split('-')[0]} • Saída: {new Date(excursion.departure_date).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/reservas?excursion_id=${id}`} className="px-4 py-2.5 bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface">
            Ver Reservas
          </Link>
          <Link href={`/admin/excursoes/${id}/editar`} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm">
            Editar Excursão
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status</h3>
          <p className="text-lg font-medium text-on-surface">{excursion.status}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Preço</h3>
          <p className="text-lg font-medium text-on-surface">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(excursion.price_per_seat)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Frota</h3>
          <p className="text-lg font-medium text-on-surface">{layoutName || "Não Definido"}</p>
        </div>
      </div>

      {/* Relatórios de Vistoria Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] text-on-surface">Relatórios de Vistoria e Ocorrências</h2>
          <p className="text-sm text-on-surface-variant mt-1">Fotos e checklists enviados pelos motoristas desta viagem.</p>
        </div>
        <AdminRelatorioVistoria excursionId={id} />
      </div>
    </div>
  );
}
