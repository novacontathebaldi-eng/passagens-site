"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type TourPackage = {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
};

export default function RoteirosPage() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from("tour_packages")
        .select("id, title, slug, category, short_description")
        .order("created_at", { ascending: false });

      if (data) {
        setPackages(data);
      }
      setIsLoading(false);
    }
    fetchPackages();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Roteiros Base (Tour Packages)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gerencie os destinos e pacotes turísticos que servirão de base para as suas excursões.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
          + Novo Roteiro
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="py-3 px-6 text-sm font-semibold">Pacote</th>
                <th className="py-3 px-6 text-sm font-semibold">Categoria</th>
                <th className="py-3 px-6 text-sm font-semibold">Slug (URL)</th>
                <th className="py-3 px-6 text-sm font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-outline">
                    Carregando roteiros...
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-outline">
                    Nenhum roteiro cadastrado.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-on-surface">{pkg.title}</div>
                      <div className="text-xs text-on-surface-variant truncate max-w-xs mt-0.5">
                        {pkg.short_description}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                        {pkg.category || "Geral"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-outline">/{pkg.slug}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-primary hover:text-primary-dark text-sm font-medium mr-4 transition-colors">
                        Editar
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
