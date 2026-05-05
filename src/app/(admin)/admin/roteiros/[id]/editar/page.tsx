"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import TourImageManager from "@/components/admin/TourImageManager";
import { toast } from "sonner";

export default function EditarRoteiroPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    short_description: "",
    description: "",
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tour_packages")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          category: data.category || "",
          short_description: data.short_description || "",
          description: data.description || "",
        });
      } else {
        toast.error("Roteiro não encontrado.");
      }
      setIsFetching(false);
    }
    load();
  }, [id, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const { error: updateError } = await supabase
      .from("tour_packages")
      .update({
        title: form.title,
        slug: form.slug,
        category: form.category,
        short_description: form.short_description,
        description: form.description,
      })
      .eq("id", id);

    setIsLoading(false);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Roteiro salvo com sucesso!");
    }
  }

  function handleTitleChange(value: string) {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }));
  }

  const inputClass = "w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/roteiros" className="text-sm text-primary hover:underline mb-2 inline-block">
          ← Voltar para Roteiros
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Editar Roteiro
        </h1>
      </div>

      {/* Formulário de dados textuais */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">

        {isFetching ? (
          <div className="py-12 text-center text-outline">Carregando roteiro...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-1.5">Título do Roteiro</label>
                <input type="text" id="title" value={form.title} onChange={e => handleTitleChange(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-on-surface mb-1.5">Slug (URL)</label>
                <input type="text" id="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-on-surface mb-1.5">Categoria</label>
              <select id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className={inputClass}>
                <option value="">Selecione...</option>
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
              <input type="text" id="short_description" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} required className={inputClass} />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-1.5">Descrição Completa</label>
              <textarea id="description" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass}></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Link href="/admin/roteiros" className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">
                Cancelar
              </Link>
              <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Gerenciador de Imagens */}
      {!isFetching && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">
          <TourImageManager packageId={id} />
        </div>
      )}
    </div>
  );
}

