"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CellType = "SEAT" | "AISLE" | "DOOR" | "BATHROOM" | "EMPTY";

export default function EditarFrotaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [matrix, setMatrix] = useState<CellType[][]>([]);
  const [amenities, setAmenities] = useState({ wifi: true, ac: true, bathroom: true, usb: true });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("vehicle_layouts")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setName(data.name || "");
        setMatrix(data.grid_matrix || []);
        setAmenities(data.amenities || { wifi: true, ac: true, bathroom: true, usb: true });
      } else {
        setError("Layout não encontrado.");
      }
      setIsFetching(false);
    }
    load();
  }, [id, supabase]);

  function updateCell(r: number, c: number, type: CellType) {
    const newMatrix = matrix.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? type : cell)) : row
    );
    setMatrix(newMatrix);
  }

  function addRow() {
    const cols = matrix[0]?.length || 5;
    setMatrix([...matrix, Array(cols).fill("SEAT") as CellType[]]);
  }

  function removeRow() {
    if (matrix.length > 1) setMatrix(matrix.slice(0, -1));
  }

  const capacity = matrix.flat().filter(cell => cell === "SEAT").length;
  const cols = matrix[0]?.length || 5;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("vehicle_layouts")
      .update({ name, capacity, grid_matrix: matrix, amenities })
      .eq("id", id);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/admin/frotas");
      router.refresh();
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin/frotas" className="text-sm text-primary hover:underline mb-2 inline-block">
          ← Voltar para Frotas
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Editar Layout de Ônibus
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-error-light text-error rounded-xl text-sm border border-error/20">{error}</div>
      )}

      {isFetching ? (
        <div className="py-12 text-center text-outline">Carregando layout...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-1 space-y-6">
            <form id="frota-form" onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">Nome do Layout</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-3">Amenidades Inclusas</label>
                <div className="space-y-3">
                  {Object.entries({ wifi: "Wi-Fi a bordo", ac: "Ar Condicionado", bathroom: "Banheiro", usb: "Tomadas USB" }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={amenities[key as keyof typeof amenities]}
                        onChange={e => setAmenities({ ...amenities, [key]: e.target.checked })}
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-on-surface">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-on-surface">Capacidade Calculada:</span>
                  <span className="text-xl font-bold text-primary">{capacity} lugares</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addRow} className="flex-1 bg-surface-container-high text-on-surface text-sm font-medium py-2 rounded-lg hover:bg-surface-container-highest transition-colors">
                    + Linha
                  </button>
                  <button type="button" onClick={removeRow} className="flex-1 bg-surface-container-high text-on-surface text-sm font-medium py-2 rounded-lg hover:bg-surface-container-highest transition-colors">
                    - Linha
                  </button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Grid Builder */}
          <div className="lg:col-span-2">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 flex flex-col items-center">
              <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface mb-6 w-full">Construtor de Grid Visual</h2>

              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50 max-w-sm w-full overflow-x-auto relative">
                <div className="w-full text-center text-xs font-bold text-outline uppercase tracking-widest mb-6">Frente do Ônibus</div>

                <div className="grid gap-3 mx-auto" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {matrix.map((row, rIndex) =>
                    row.map((cell, cIndex) => (
                      <div key={`${rIndex}-${cIndex}`} className="aspect-square relative group">
                        <select
                          value={cell}
                          onChange={e => updateCell(rIndex, cIndex, e.target.value as CellType)}
                          className={`w-full h-full text-center flex items-center justify-center rounded-lg border-2 text-xs font-bold cursor-pointer transition-all appearance-none
                            ${cell === 'SEAT' ? 'bg-primary-container border-primary text-primary-dark' : ''}
                            ${cell === 'AISLE' ? 'bg-transparent border-transparent text-transparent hover:border-outline-variant' : ''}
                            ${cell === 'BATHROOM' ? 'bg-surface-dim border-outline text-outline-variant' : ''}
                            ${cell === 'DOOR' ? 'bg-secondary-container border-secondary text-secondary-dark' : ''}
                            ${cell === 'EMPTY' ? 'bg-surface-container border-outline/20 text-transparent' : ''}
                          `}
                        >
                          <option value="SEAT">S</option>
                          <option value="AISLE">--</option>
                          <option value="BATHROOM">B</option>
                          <option value="DOOR">D</option>
                          <option value="EMPTY">X</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>

                <div className="w-full text-center text-xs font-bold text-outline uppercase tracking-widest mt-6">Fundo do Ônibus</div>
              </div>

              <div className="flex gap-4 mt-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-container border border-primary"></span> Poltrona</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-transparent border border-outline-variant"></span> Corredor</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-dim border border-outline"></span> Banheiro</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary-container border border-secondary"></span> Porta</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
