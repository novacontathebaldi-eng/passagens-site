"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type TourPackage = { id: string; title: string };
type VehicleLayout = { id: string; name: string; capacity: number };

export default function EditarExcursaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tourPackages, setTourPackages] = useState<TourPackage[]>([]);
  const [vehicleLayouts, setVehicleLayouts] = useState<VehicleLayout[]>([]);

  const [form, setForm] = useState({
    tour_package_id: "",
    vehicle_layout_id: "",
    price_per_seat: "",
    departure_date: "",
    return_date: "",
    allow_seat_selection: false,
    status: "DRAFT",
    highlight_text: "",
  });

  useEffect(() => {
    async function load() {
      const [pkgsRes, layoutsRes, excRes] = await Promise.all([
        supabase.from("tour_packages").select("id, title").order("title"),
        supabase.from("vehicle_layouts").select("id, name, capacity").order("name"),
        supabase.from("excursions").select("*").eq("id", id).single(),
      ]);

      if (pkgsRes.data) setTourPackages(pkgsRes.data);
      if (layoutsRes.data) setVehicleLayouts(layoutsRes.data);

      if (excRes.data) {
        const e = excRes.data;
        setForm({
          tour_package_id: e.tour_package_id || "",
          vehicle_layout_id: e.vehicle_layout_id || "",
          price_per_seat: String(e.price_per_seat),
          departure_date: e.departure_date ? new Date(e.departure_date).toISOString().slice(0, 16) : "",
          return_date: e.return_date ? new Date(e.return_date).toISOString().slice(0, 16) : "",
          allow_seat_selection: e.allow_seat_selection || false,
          status: e.status || "DRAFT",
          highlight_text: e.highlight_text || "",
        });
      } else {
        setError("Excursão não encontrada.");
      }
      setIsFetching(false);
    }
    load();
  }, [id, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("excursions")
      .update({
        tour_package_id: form.tour_package_id,
        vehicle_layout_id: form.vehicle_layout_id,
        price_per_seat: parseFloat(form.price_per_seat),
        departure_date: new Date(form.departure_date).toISOString(),
        return_date: form.return_date ? new Date(form.return_date).toISOString() : null,
        allow_seat_selection: form.allow_seat_selection,
        status: form.status,
        highlight_text: form.highlight_text || null,
      })
      .eq("id", id);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/admin/excursoes");
      router.refresh();
    }
  }

  const inputClass = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/excursoes" className="text-sm text-primary hover:underline mb-2 inline-block">
          ← Voltar para Excursões
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Editar Excursão
        </h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-error-light text-error rounded-xl text-sm border border-error/20">{error}</div>
        )}

        {isFetching ? (
          <div className="py-12 text-center text-outline">Carregando dados da excursão...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="tour_package_id" className="block text-sm font-medium text-on-surface mb-1.5">Roteiro Base</label>
                <select id="tour_package_id" value={form.tour_package_id} onChange={e => setForm({ ...form, tour_package_id: e.target.value })} required className={inputClass}>
                  <option value="">Selecione o roteiro...</option>
                  {tourPackages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="vehicle_layout_id" className="block text-sm font-medium text-on-surface mb-1.5">Layout / Ônibus</label>
                <select id="vehicle_layout_id" value={form.vehicle_layout_id} onChange={e => setForm({ ...form, vehicle_layout_id: e.target.value })} required className={inputClass}>
                  <option value="">Selecione a frota...</option>
                  {vehicleLayouts.map(l => <option key={l.id} value={l.id}>{l.name} ({l.capacity} lugares)</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="price_per_seat" className="block text-sm font-medium text-on-surface mb-1.5">Preço por Poltrona (R$)</label>
                <input type="number" step="0.01" min="0" id="price_per_seat" value={form.price_per_seat} onChange={e => setForm({ ...form, price_per_seat: e.target.value })} required className={inputClass} />
              </div>

              <div>
                <label htmlFor="departure_date" className="block text-sm font-medium text-on-surface mb-1.5">Data e Hora de Saída</label>
                <input type="datetime-local" id="departure_date" value={form.departure_date} onChange={e => setForm({ ...form, departure_date: e.target.value })} required className={inputClass} />
              </div>

              <div>
                <label htmlFor="return_date" className="block text-sm font-medium text-on-surface mb-1.5">Data e Hora de Retorno</label>
                <input type="datetime-local" id="return_date" value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} className={inputClass} />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="highlight_text" className="block text-sm font-medium text-on-surface mb-1.5">Texto de Destaque (opcional)</label>
                <input type="text" id="highlight_text" value={form.highlight_text} onChange={e => setForm({ ...form, highlight_text: e.target.value })} placeholder="Ex: Última vaga! | Promoção Relâmpago" className={inputClass} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/50 bg-surface-container-low flex items-start gap-4">
              <div className="flex items-center h-6">
                <input type="checkbox" id="allow_seat_selection" checked={form.allow_seat_selection} onChange={e => setForm({ ...form, allow_seat_selection: e.target.checked })} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="allow_seat_selection" className="font-medium text-on-surface block">Permitir Seleção de Poltrona no Checkout</label>
                <p className="text-sm text-on-surface-variant mt-1">Se ativado, o cliente verá a planta do ônibus e escolherá a poltrona.</p>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-on-surface mb-1.5">Status da Excursão</label>
              <select id="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} required className={inputClass}>
                <option value="DRAFT">Rascunho (Não visível no site)</option>
                <option value="PUBLISHED">Publicado (Visível e vendendo)</option>
                <option value="SOLD_OUT">Esgotado</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Link href="/admin/excursoes" className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">
                Cancelar
              </Link>
              <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
