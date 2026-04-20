"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function NovoRoteiroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const category = formData.get("category") as string;
    const short_description = formData.get("short_description") as string;
    const description = formData.get("description") as string;

    const { error: insertError } = await supabase.from("tour_packages").insert([
      { title, slug, category, short_description, description }
    ]);

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/admin/roteiros");
      router.refresh();
    }
  }

  // Helper to auto-generate slug
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value;
    const slugInput = document.getElementById("slug") as HTMLInputElement;
    if (slugInput && !slugInput.value.includes("-") && title.length > 0) {
      slugInput.value = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
  }

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-on-surface mb-1.5">Título do Roteiro</label>
              <input type="text" id="title" name="title" required onChange={handleTitleChange} placeholder="Ex: Arraial do Cabo Fim de Semana" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-on-surface mb-1.5">Slug (URL)</label>
              <input type="text" id="slug" name="slug" required placeholder="arraial-do-cabo" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-on-surface mb-1.5">Categoria</label>
            <select id="category" name="category" required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
              <option value="">Selecione uma categoria...</option>
              <option value="Praia">Praia</option>
              <option value="Montanha">Montanha</option>
              <option value="Bate-volta">Bate-volta</option>
              <option value="Cultural">Cultural</option>
              <option value="Ecoturismo">Ecoturismo</option>
            </select>
          </div>

          <div>
            <label htmlFor="short_description" className="block text-sm font-medium text-on-surface mb-1.5">Breve Descrição (Vitrine)</label>
            <input type="text" id="short_description" name="short_description" required placeholder="Um fim de semana inesquecível no caribe brasileiro." className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-1.5">Descrição Completa</label>
            <textarea id="description" name="description" rows={5} placeholder="Detalhes completos do roteiro, roteiro dia a dia, etc..." className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"></textarea>
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant/30">
            <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
              {isLoading ? "Salvando..." : "Salvar Roteiro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
