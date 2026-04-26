"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type GridCellType = "seat" | "corridor" | "bathroom" | "door" | "stairs" | "driver" | "empty";

interface GridCell {
  id: string;
  row: number;
  col: number;
  type: GridCellType;
  label?: string;
  isBookable?: boolean;
  colSpan?: number;
  rowSpan?: number;
}

export const BUS_TYPES = [
  { value: "CONVENCIONAL", label: "Convencional (Sem AC/WC)" },
  { value: "EXECUTIVO", label: "Executivo (Com AC/WC)" },
  { value: "SEMI_LEITO", label: "Semi-Leito (Maior reclinação)" },
  { value: "LEITO", label: "Leito (Poltronas largas)" },
  { value: "CAMA", label: "Leito Cama (Deita 180º)" },
  { value: "DD_LEITO_CAMA", label: "Double Decker (Leito Cama / Leito)" },
  { value: "MICRO", label: "Micro-ônibus" },
  { value: "VAN", label: "Van de Passageiros" }
];

interface Deck {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: GridCell[];
}

interface GridMatrix {
  version: 2;
  decks: Deck[];
}

function generateDeck(id: string, name: string, rows: number, cols: number): Deck {
  const cells: GridCell[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      let type: GridCellType = "seat";
      if (cols === 5 && c === 3) type = "corridor";
      cells.push({ id: `${id}-r${r}-c${c}`, row: r, col: c, type, colSpan: 1, rowSpan: 1 });
    }
  }
  return { id, name, rows, cols, cells };
}

function renumberSeats(decks: Deck[]) {
  let counter = 1;
  return decks.map(deck => ({
    ...deck,
    cells: deck.cells.map(cell => {
      if (cell.type === "seat") {
        const label = counter.toString().padStart(2, "0");
        counter++;
        return { ...cell, label, isBookable: true };
      }
      return { ...cell, label: undefined, isBookable: false };
    })
  }));
}

export default function EditarFrotaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [busType, setBusType] = useState("EXECUTIVO");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>("");
  const [amenities, setAmenities] = useState({ wifi: true, ac: true, bathroom: true, usb: true, tv: false, blanket: false, reclining_seats: false });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("vehicle_layouts")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setName(data.name || "");
        setBusType(data.bus_type || "EXECUTIVO");
        setAmenities({ wifi: true, ac: true, bathroom: true, usb: true, tv: false, blanket: false, reclining_seats: false, ...(data.amenities || {}) });
        
        if (data.grid_matrix?.version === 2) {
          setDecks(data.grid_matrix.decks);
          if (data.grid_matrix.decks.length > 0) {
            setActiveDeckId(data.grid_matrix.decks[0].id);
          }
        } else {
          // Fallback if not V2 (shouldn't happen post-migration, but just in case)
          const fallbackDeck = generateDeck("deck-1", "Piso Único", 14, 5);
          setDecks([fallbackDeck]);
          setActiveDeckId("deck-1");
        }
      } else {
        setError("Layout não encontrado.");
      }
      setIsFetching(false);
    }
    load();
  }, [id, supabase]);

  useEffect(() => {
    if (decks.length > 0) {
      setDecks(prev => {
        const renumbered = renumberSeats(prev);
        if (JSON.stringify(prev) !== JSON.stringify(renumbered)) return renumbered;
        return prev;
      });
    }
  }, [decks]);

  function updateCellType(deckId: string, row: number, col: number, type: GridCellType) {
    setDecks(decks.map(deck => {
      if (deck.id !== deckId) return deck;
      return {
        ...deck,
        cells: deck.cells.map(cell => {
          if (cell.row === row && cell.col === col) {
            const needsSpan = type === 'bathroom' || type === 'driver' || type === 'door';
            return { 
              ...cell, 
              type,
              colSpan: needsSpan ? (cell.colSpan || 1) : 1,
              rowSpan: needsSpan ? (cell.rowSpan || 1) : 1
            };
          }
          return cell;
        })
      };
    }));
  }

  function updateCellSpan(deckId: string, row: number, col: number, spanType: 'colSpan' | 'rowSpan', value: number) {
    setDecks(decks.map(deck => {
      if (deck.id !== deckId) return deck;
      return {
        ...deck,
        cells: deck.cells.map(cell => {
          if (cell.row === row && cell.col === col) {
            return { ...cell, [spanType]: Math.max(1, value) };
          }
          return cell;
        })
      };
    }));
  }

  function addDeck() {
    if (decks.length >= 2) return;
    setDecks([...decks, generateDeck(`deck-${decks.length + 1}`, "Piso Superior", 14, 5)]);
    setActiveDeckId(`deck-${decks.length + 1}`);
  }

  function removeDeck(deckId: string) {
    if (decks.length <= 1) return;
    const newDecks = decks.filter(d => d.id !== deckId);
    setDecks(newDecks);
    setActiveDeckId(newDecks[0].id);
  }

  function updateDeckSize(deckId: string, newRows: number) {
    setDecks(decks.map(deck => {
      if (deck.id !== deckId) return deck;
      const newCells = [...deck.cells];
      if (newRows > deck.rows) {
        for (let r = deck.rows + 1; r <= newRows; r++) {
          for (let c = 1; c <= deck.cols; c++) {
            let type: GridCellType = "seat";
            if (deck.cols === 5 && c === 3) type = "corridor";
            newCells.push({ id: `${deck.id}-r${r}-c${c}`, row: r, col: c, type, colSpan: 1, rowSpan: 1 });
          }
        }
      } else if (newRows < deck.rows) {
        return { ...deck, rows: newRows, cells: newCells.filter(c => c.row <= newRows) };
      }
      return { ...deck, rows: newRows, cells: newCells };
    }));
  }

  const capacity = decks.reduce((acc, deck) => acc + deck.cells.filter(c => c.type === "seat").length, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const gridMatrix: GridMatrix = { version: 2, decks };

    const { error: updateError } = await supabase
      .from("vehicle_layouts")
      .update({ name, bus_type: busType, capacity, grid_matrix: gridMatrix as any, amenities })
      .eq("id", id);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/admin/frotas");
      router.refresh();
    }
  }

  const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
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
            <form id="frota-form" onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 space-y-6 sticky top-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">Nome do Layout</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Tipo do Veículo</label>
                <select 
                  value={busType}
                  onChange={(e) => setBusType(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  {BUS_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-3">Amenidades Inclusas</label>
                <div className="space-y-3">
                  {Object.entries({ wifi: "Wi-Fi a bordo", ac: "Ar Condicionado", bathroom: "Banheiro", usb: "Tomadas USB", tv: "TV", blanket: "Cobertor", reclining_seats: "Reclinação de Assento" }).map(([key, label]) => (
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
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-on-surface">Capacidade:</span>
                  <span className="text-xl font-bold text-primary">{capacity} lugares</span>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Grid Builder */}
          {activeDeck && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">Construtor de Grid</h2>
                  <div className="flex gap-2">
                    {decks.map(deck => (
                      <button
                        key={deck.id}
                        type="button"
                        onClick={() => setActiveDeckId(deck.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDeckId === deck.id ? 'bg-primary text-white' : 'bg-surface-container border border-outline-variant hover:bg-surface-container-high'}`}
                      >
                        {deck.name}
                      </button>
                    ))}
                    {decks.length < 2 && (
                      <button
                        type="button"
                        onClick={addDeck}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors"
                      >
                        + Andar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex justify-between items-center w-full max-w-sm mb-4">
                    <span className="text-sm font-medium text-on-surface">Linhas: {activeDeck.rows}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateDeckSize(activeDeck.id, Math.max(1, activeDeck.rows - 1))} className="px-3 py-1 bg-surface-container rounded border border-outline-variant hover:bg-surface-container-high">-</button>
                      <button type="button" onClick={() => updateDeckSize(activeDeck.id, activeDeck.rows + 1)} className="px-3 py-1 bg-surface-container rounded border border-outline-variant hover:bg-surface-container-high">+</button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50 max-w-sm w-full overflow-x-auto relative">
                    <div className="w-full text-center text-xs font-bold text-outline uppercase tracking-widest mb-6">Frente</div>
                    
                    {(() => {
                      const hiddenCells = new Set<string>();
                      activeDeck.cells.forEach(c => {
                        if ((c.colSpan && c.colSpan > 1) || (c.rowSpan && c.rowSpan > 1)) {
                          for (let r = c.row; r < c.row + (c.rowSpan || 1); r++) {
                            for (let col = c.col; col < c.col + (c.colSpan || 1); col++) {
                              if (r === c.row && col === c.col) continue;
                              hiddenCells.add(`r${r}-c${col}`);
                            }
                          }
                        }
                      });

                      return (
                        <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${activeDeck.cols}, minmax(0, 1fr))` }}>
                          {activeDeck.cells
                            .sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row)
                            .filter(c => !hiddenCells.has(`r${c.row}-c${c.col}`))
                            .map((cell) => (
                            <div 
                              key={cell.id} 
                              className="relative group"
                              style={{
                                gridRow: `span ${cell.rowSpan || 1}`,
                                gridColumn: `span ${cell.colSpan || 1}`,
                                aspectRatio: cell.colSpan === cell.rowSpan ? '1 / 1' : 'auto',
                                minHeight: '36px'
                              }}
                            >
                              <select 
                                value={cell.type}
                                onChange={(e) => updateCellType(activeDeck.id, cell.row, cell.col, e.target.value as GridCellType)}
                                className={`w-full h-full text-center flex flex-col items-center justify-center rounded-lg border-2 text-xs font-bold cursor-pointer transition-all appearance-none
                                  ${cell.type === 'seat' ? 'bg-primary-container border-primary text-primary-dark' : ''}
                                  ${cell.type === 'corridor' ? 'bg-transparent border-transparent text-transparent hover:border-outline-variant' : ''}
                                  ${cell.type === 'bathroom' ? 'bg-surface-dim border-outline text-outline-variant' : ''}
                                  ${cell.type === 'door' ? 'bg-secondary-container border-secondary text-secondary-dark' : ''}
                                  ${cell.type === 'stairs' ? 'bg-tertiary-container border-tertiary text-tertiary-dark' : ''}
                                  ${cell.type === 'empty' ? 'bg-surface-container border-outline/20 text-transparent' : ''}
                                  ${cell.type === 'driver' ? 'bg-surface border-outline-variant/50 text-on-surface-variant' : ''}
                                `}
                              >
                                <option value="seat">{cell.label || "S"}</option>
                                <option value="corridor">--</option>
                                <option value="bathroom">WC</option>
                                <option value="door">🚪</option>
                                <option value="stairs">🪜</option>
                                <option value="driver">MOT</option>
                                <option value="empty">✕</option>
                              </select>

                              {(cell.type === 'bathroom' || cell.type === 'driver' || cell.type === 'door' || cell.type === 'stairs') && (
                                <div className="absolute -top-2 -right-2 bg-surface shadow-md rounded-md border border-outline-variant hidden group-hover:flex flex-col z-10 p-1 gap-1">
                                  <div className="flex gap-1 items-center">
                                    <span className="text-[10px] text-outline px-1">↔</span>
                                    <button type="button" onClick={() => updateCellSpan(activeDeck.id, cell.row, cell.col, 'colSpan', (cell.colSpan || 1) - 1)} className="w-4 h-4 bg-surface-container rounded text-xs leading-none flex items-center justify-center hover:bg-surface-container-high">-</button>
                                    <button type="button" onClick={() => updateCellSpan(activeDeck.id, cell.row, cell.col, 'colSpan', (cell.colSpan || 1) + 1)} className="w-4 h-4 bg-surface-container rounded text-xs leading-none flex items-center justify-center hover:bg-surface-container-high">+</button>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <span className="text-[10px] text-outline px-1">↕</span>
                                    <button type="button" onClick={() => updateCellSpan(activeDeck.id, cell.row, cell.col, 'rowSpan', (cell.rowSpan || 1) - 1)} className="w-4 h-4 bg-surface-container rounded text-xs leading-none flex items-center justify-center hover:bg-surface-container-high">-</button>
                                    <button type="button" onClick={() => updateCellSpan(activeDeck.id, cell.row, cell.col, 'rowSpan', (cell.rowSpan || 1) + 1)} className="w-4 h-4 bg-surface-container rounded text-xs leading-none flex items-center justify-center hover:bg-surface-container-high">+</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    
                    <div className="w-full text-center text-xs font-bold text-outline uppercase tracking-widest mt-6">Fundo</div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-6 text-xs text-on-surface-variant justify-center">
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-primary-container border border-primary"></span> Poltrona</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-transparent border border-outline-variant"></span> Corredor</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-surface-dim border border-outline"></span> Banheiro</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-secondary-container border border-secondary"></span> Porta</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-tertiary-container border border-tertiary"></span> Escada</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-surface-container border border-outline/20"></span> Vazio</span>
                  </div>
                  
                  {decks.length > 1 && (
                    <button type="button" onClick={() => removeDeck(activeDeck.id)} className="mt-8 text-sm text-error hover:underline">
                      Remover este andar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
