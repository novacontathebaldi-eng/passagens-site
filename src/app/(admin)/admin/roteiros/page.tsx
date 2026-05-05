"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchPackages() {
    const { data } = await supabase
      .from("tour_packages")
      .select("id, title, slug, category, short_description")
      .order("created_at", { ascending: false });

    if (data) setPackages(data);
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("tour_packages")
        .select("id, title, slug, category, short_description")
        .order("created_at", { ascending: false });
      if (!cancelled && data) setPackages(data);
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este roteiro? Excursões vinculadas a ele também serão afetadas.")) return;

    setDeletingId(id);
    const { error } = await supabase.from("tour_packages").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      setPackages(prev => prev.filter(p => p.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Roteiros Base (Tour Packages)
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Gerencie os destinos e pacotes turísticos que servirão de base para as suas excursões.
          </p>
        </div>
        <Link
          href="/admin/roteiros/novo"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap text-center"
        >
          + Novo Roteiro
        </Link>
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
                  <td colSpan={4} className="py-8 text-center text-outline">Carregando roteiros...</td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-outline">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Nenhum roteiro cadastrado.
                    <Link href="/admin/roteiros/novo" className="block mt-2 text-primary hover:underline text-sm font-medium">
                      Criar primeiro roteiro →
                    </Link>
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
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/roteiros/${pkg.id}/editar`}
                        className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        disabled={deletingId === pkg.id}
                        className="text-error hover:text-error-light text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {deletingId === pkg.id ? "..." : "Excluir"}
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
