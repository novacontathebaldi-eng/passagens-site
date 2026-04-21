"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import TourImageManager from "@/components/admin/TourImageManager";

export default function NovoRoteiroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPackageId, setSavedPackageId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    short_description: "",
    description: "",
  });

  function handleTitleChange(value: string) {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("tour_packages")
      .insert([{
        title: form.title,
        slug: form.slug,
        category: form.category,
        short_description: form.short_description,
        description: form.description,
      }])
      .select("id")
      .single();

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setSavedPackageId(data.id);
    }
  }

  const inputClass = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/roteiros" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Voltar para Roteiros
          </Link>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Novo Roteiro
          </h1>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-error-light text-error rounded-xl text-sm border border-error/20">
            {error}
          </div>
        )}

        {savedPackageId ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-200 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Roteiro "<strong>{form.title}</strong>" salvo com sucesso! Agora adicione as imagens.
            </div>

            <TourImageManager packageId={savedPackageId} />

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Link
                href="/admin/roteiros"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Concluir e Voltar
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-1.5">Título do Roteiro</label>
                <input type="text" id="title" value={form.title} onChange={e => handleTitleChange(e.target.value)} required placeholder="Ex: Arraial do Cabo Fim de Semana" className={inputClass} />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-on-surface mb-1.5">Slug (URL)</label>
                <input type="text" id="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required placeholder="arraial-do-cabo" className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-on-surface mb-1.5">Categoria</label>
              <select id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className={inputClass}>
                <option value="">Selecione uma categoria...</option>
                <option value="Praia">Praia</option>
                <option value="Montanha">Montanha</option>
                <option value="Bate-volta">Bate-volta</option>
                <option value="Cultural">Cultural</option>
                <option value="Ecoturismo">Ecoturismo</option>
                <option value="Religioso">Religioso</option>
                <option value="Serra">Serra</option>
              </select>
            </div>

            <div>
              <label htmlFor="short_description" className="block text-sm font-medium text-on-surface mb-1.5">Breve Descrição (Vitrine)</label>
              <input type="text" id="short_description" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} required placeholder="Um fim de semana inesquecível no caribe brasileiro." className={inputClass} />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-1.5">Descrição Completa</label>
              <textarea id="description" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes completos do roteiro, roteiro dia a dia, etc..." className={inputClass}></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant/30">
              <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                {isLoading ? "Salvando..." : "Salvar e Adicionar Imagens →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

