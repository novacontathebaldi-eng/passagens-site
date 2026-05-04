"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type TourPackage = { id: string; title: string };
type VehicleLayout = { id: string; name: string; capacity: number };

export default function NovaExcursaoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tourPackages, setTourPackages] = useState<TourPackage[]>([]);
  const [vehicleLayouts, setVehicleLayouts] = useState<VehicleLayout[]>([]);

  useEffect(() => {
    async function loadDependencies() {
      const [pkgsResponse, layoutsResponse] = await Promise.all([
        supabase.from("tour_packages").select("id, title").order("title"),
        supabase.from("vehicle_layouts").select("id, name, capacity").order("name")
      ]);

      if (pkgsResponse.data) setTourPackages(pkgsResponse.data);
      if (layoutsResponse.data) setVehicleLayouts(layoutsResponse.data);
      setIsFetching(false);
    }
    loadDependencies();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const tour_package_id = formData.get("tour_package_id") as string;
    const vehicle_layout_id = formData.get("vehicle_layout_id") as string;
    const price_per_seat = parseFloat(formData.get("price_per_seat") as string);
    const departure_date = formData.get("departure_date") as string;
    const return_date = formData.get("return_date") as string;
    const allow_seat_selection = formData.get("allow_seat_selection") === "on";
    const status = formData.get("status") as string;

    if (return_date && new Date(return_date) <= new Date(departure_date)) {
      toast.error("A data de retorno deve ser posterior à data de saída.");
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("excursions").insert([
      {
        tour_package_id,
        vehicle_layout_id,
        price_per_seat,
        departure_date: new Date(departure_date).toISOString(),
        return_date: return_date ? new Date(return_date).toISOString() : null,
        allow_seat_selection,
        status
      }
    ]);

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/admin/excursoes");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/excursoes" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Voltar para Excursões
          </Link>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Agendar Nova Excursão
          </h1>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-error-light text-error rounded-xl text-sm border border-error/20">
            {error}
          </div>
        )}

        {isFetching ? (
          <div className="py-12 text-center text-outline">Carregando dependências...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="tour_package_id" className="block text-sm font-medium text-on-surface mb-1.5">Roteiro Base</label>
                <select id="tour_package_id" name="tour_package_id" required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                  <option value="">Selecione o roteiro...</option>
                  {tourPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vehicle_layout_id" className="block text-sm font-medium text-on-surface mb-1.5">Layout / Ônibus</label>
                <select id="vehicle_layout_id" name="vehicle_layout_id" required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                  <option value="">Selecione a frota...</option>
                  {vehicleLayouts.map(layout => (
                    <option key={layout.id} value={layout.id}>{layout.name} ({layout.capacity} lugares)</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price_per_seat" className="block text-sm font-medium text-on-surface mb-1.5">Preço por Poltrona (R$)</label>
                <input type="number" step="0.01" min="0" id="price_per_seat" name="price_per_seat" required placeholder="Ex: 150.00" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              <div>
                <label htmlFor="departure_date" className="block text-sm font-medium text-on-surface mb-1.5">Data e Hora de Saída</label>
                <input type="datetime-local" id="departure_date" name="departure_date" required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              <div>
                <label htmlFor="return_date" className="block text-sm font-medium text-on-surface mb-1.5">Data e Hora de Retorno</label>
                <input type="datetime-local" id="return_date" name="return_date" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/50 bg-surface-container-low flex items-start gap-4">
              <div className="flex items-center h-6">
                <input type="checkbox" id="allow_seat_selection" name="allow_seat_selection" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
              </div>
              <div>
                <label htmlFor="allow_seat_selection" className="font-medium text-on-surface block">Permitir Seleção de Poltrona no Checkout</label>
                <p className="text-sm text-on-surface-variant mt-1">Se ativado, o cliente verá a planta do ônibus e escolherá a poltrona. Se desativado, o sistema alocará automaticamente (clustering).</p>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-on-surface mb-1.5">Status da Excursão</label>
              <select id="status" name="status" required defaultValue="DRAFT" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                <option value="DRAFT">Rascunho (Não visível no site)</option>
                <option value="PUBLISHED">Publicado (Visível e vendendo)</option>
                <option value="SOLD_OUT">Esgotado</option>
              </select>
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant/30">
              <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                {isLoading ? "Salvando..." : "Agendar Excursão"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
