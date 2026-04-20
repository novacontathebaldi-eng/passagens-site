"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CellType = "SEAT" | "AISLE" | "DOOR" | "BATHROOM" | "EMPTY";

export default function NovaFrotaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grid Builder State
  const [rows, setRows] = useState(14);
  const [cols, setCols] = useState(5); // e.g. Window, Aisle, Center, Aisle, Window (typical 2x2 with center aisle is 5 cols: Seat, Seat, Aisle, Seat, Seat)
  const [matrix, setMatrix] = useState<CellType[][]>(
    Array.from({ length: 14 }, () => ["SEAT", "SEAT", "AISLE", "SEAT", "SEAT"])
  );

  const [amenities, setAmenities] = useState({
    wifi: true,
    ac: true,
    bathroom: true,
    usb: true,
  });

  function updateCell(r: number, c: number, type: CellType) {
    const newMatrix = [...matrix];
    newMatrix[r] = [...newMatrix[r]];
    newMatrix[r][c] = type;
    setMatrix(newMatrix);
  }

  // Generate capacity based on SEAT count
  const capacity = matrix.flat().filter(cell => cell === "SEAT").length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const { error: insertError } = await supabase.from("vehicle_layouts").insert([
      { 
        name, 
        capacity, 
        grid_matrix: matrix, 
        amenities 
      }
    ]);

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/admin/frotas");
      router.refresh();
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/frotas" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Voltar para Frotas
          </Link>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Novo Layout de Ônibus
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-1 space-y-6">
          <form id="frota-form" onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 space-y-6">
            {error && (
              <div className="p-4 bg-error-light text-error rounded-xl text-sm border border-error/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">Nome do Layout</label>
              <input type="text" id="name" name="name" required placeholder="Ex: Paradiso 1200 - Leito" className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-3">Amenidades Inclusas</label>
              <div className="space-y-3">
                {Object.entries({
                  wifi: "Wi-Fi a bordo",
                  ac: "Ar Condicionado",
                  bathroom: "Banheiro",
                  usb: "Tomadas USB"
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={amenities[key as keyof typeof amenities]} 
                      onChange={(e) => setAmenities({...amenities, [key]: e.target.checked})}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-on-surface">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-on-surface">Capacidade Calculada:</span>
                <span className="text-xl font-bold text-primary">{capacity} lugares</span>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                {isLoading ? "Salvando..." : "Salvar Frota"}
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
                {matrix.map((row, rIndex) => (
                  row.map((cell, cIndex) => (
                    <div key={`${rIndex}-${cIndex}`} className="aspect-square relative group">
                      <select 
                        value={cell}
                        onChange={(e) => updateCell(rIndex, cIndex, e.target.value as CellType)}
                        className={`w-full h-full text-center flex items-center justify-center rounded-lg border-2 text-xs font-bold cursor-pointer transition-all appearance-none
                          ${cell === 'SEAT' ? 'bg-primary-container border-primary text-primary-dark' : ''}
                          ${cell === 'AISLE' ? 'bg-transparent border-transparent text-transparent hover:border-outline-variant' : ''}
                          ${cell === 'BATHROOM' ? 'bg-surface-dim border-outline text-outline-variant' : ''}
                          ${cell === 'DOOR' ? 'bg-secondary-container border-secondary text-secondary-dark' : ''}
                          ${cell === 'EMPTY' ? 'bg-surface-container border-outline/20 text-transparent' : ''}
                        `}
                      >
                        <option value="SEAT">💺</option>
                        <option value="AISLE">--</option>
                        <option value="BATHROOM">🚻</option>
                        <option value="DOOR">🚪</option>
                        <option value="EMPTY">✕</option>
                      </select>
                    </div>
                  ))
                ))}
              </div>
              
              <div className="w-full text-center text-xs font-bold text-outline uppercase tracking-widest mt-6">Fundo do Ônibus</div>
            </div>
            
            <p className="text-xs text-outline mt-6 text-center">
              Dica: Clique nos quadrados para alterar o tipo de espaço (Poltrona, Corredor, Banheiro, Porta ou Vazio).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
