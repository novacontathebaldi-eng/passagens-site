"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cookies from "js-cookie";
import { User, Pencil, ChevronLeft, LogOut, X } from "lucide-react";

import { formatBRL, formatCPF, validateCPF } from "@/lib/utils";
import { createReservation } from "./actions";
import { useRealtimeSeats } from "@/hooks/useRealtimeSeats";

interface Passenger {
  id: string; // uuid from DB
  full_name: string;
  cpf: string;
  rg?: string;
  orgao_emissor?: string;
}

interface CheckoutClientProps {
  excursion: any;
  user: any;
  profile: any;
  savedPassengers: Passenger[];
  occupiedSeats: string[];
  backHref: string;
}

const passengerSchema = z.object({
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().refine((val) => validateCPF(val), { message: "CPF inválido" }),
  rg: z.string().optional(),
  orgao_emissor: z.string().optional(),
  save_passenger: z.boolean(),
  source: z.enum(["manual", "profile", "saved"]),
});

const checkoutSchema = z.object({
  passengers: z.array(passengerSchema),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutClient({ excursion, user, profile, savedPassengers, occupiedSeats, backHref }: CheckoutClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [editFromReview, setEditFromReview] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const validOccupiedSeats = occupiedSeats.filter(seat => !seat.startsWith('WAITING_ALLOCATION'));
  const liveOccupiedSeats = useRealtimeSeats(excursion.id, validOccupiedSeats);
  const totalAmount = quantity * excursion.price_per_seat;
  const capacity = excursion.vehicle_layouts?.capacity || 0;
  const availableCount = capacity - liveOccupiedSeats.length;

  const {
    register,
    control,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { passengers: [] }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "passengers",
  });

  const watchedPassengers = watch("passengers");

  // Load draft from LocalStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(`checkout_draft_${excursion.id}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Only restore if valid array
          if ('full_name' in parsed[0]) {
            setQuantity(parsed.length);
            replace(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [excursion.id, replace]);

  // Save draft whenever passengers change
  useEffect(() => {
    if (watchedPassengers && watchedPassengers.length > 0) {
       localStorage.setItem(`checkout_draft_${excursion.id}`, JSON.stringify(watchedPassengers));
    }
  }, [watchedPassengers, excursion.id]);

  // Sync passengers count with quantity when moving from step 1
  useEffect(() => {
    if (step === 2) {
      const currentCount = fields.length;
      if (quantity > currentCount) {
        for (let i = currentCount; i < quantity; i++) {
          append({ full_name: "", cpf: "", rg: "", orgao_emissor: "", save_passenger: true, source: "manual" });
        }
      } else if (quantity < currentCount) {
        for (let i = currentCount - 1; i >= quantity; i--) {
          remove(i);
        }
      }
    }
  }, [step, quantity, append, remove, fields.length]);

  const handleNextStep = async () => {
    setGlobalError(null);

    if (step === 1) {
      if (quantity < 1 || quantity > availableCount) {
        setGlobalError("Quantidade inválida ou sem vagas suficientes.");
        return;
      }
    }

    if (step === 2) {
      const isValid = await trigger("passengers");
      if (!isValid) return;

      // Check for duplicate CPFs
      const cpfs = getValues("passengers").map(p => p.cpf.replace(/\D/g, ""));
      const uniqueCpfs = new Set(cpfs);
      if (uniqueCpfs.size !== cpfs.length) {
        setGlobalError("Há CPFs duplicados. Cada viajante deve ter um CPF único.");
        return;
      }

      // If editing from review, go straight back to review
      if (editFromReview) {
        setEditFromReview(false);
        setStep(4);
        return;
      }

      if (!excursion.allow_seat_selection) {
        setStep(4);
        return;
      }
    }

    if (step === 3) {
      if (selectedSeats.length !== quantity) {
        setGlobalError(`Você precisa selecionar exatamente ${quantity} poltrona(s).`);
        return;
      }

      // If editing from review, go straight back to review
      if (editFromReview) {
        setEditFromReview(false);
        setStep(4);
        return;
      }
    }

    setStep(s => s + 1);
  };

  const handleBack = () => {
    setGlobalError(null);
    if (step === 1) {
      setShowExitConfirm(true);
      return;
    }
    // Step 4 going back: skip step 3 if seat selection is disabled
    if (step === 4 && !excursion.allow_seat_selection) {
      setStep(2);
      return;
    }
    setStep(s => s - 1);
  };

  const goToStepFromReview = (targetStep: number) => {
    setEditFromReview(true);
    setGlobalError(null);
    setStep(targetStep);
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const referralCode = Cookies.get("partiuturismo_ref") || Cookies.get("viajaedu_ref");
      const passengersData = getValues("passengers");

      const res = await createReservation({
        excursionId: excursion.id,
        quantity,
        passengers: passengersData,
        selectedSeats,
        totalAmount,
        referralCode
      });

      if (res.error) {
        setGlobalError(res.error);
        setIsLoading(false);
      } else {
        localStorage.removeItem(`checkout_draft_${excursion.id}`);
        router.push(`/sucesso/${res.reservationId}`);
      }
    } catch (err: any) {
      setGlobalError(err.message || "Erro interno ao processar reserva.");
      setIsLoading(false);
    }
  };

  // Helpers for autofill
  const isProfileUsed = watchedPassengers.some(p => p.cpf.replace(/\D/g, "") === profile?.cpf?.replace(/\D/g, ""));
  
  const fillWithProfile = (index: number) => {
    setValue(`passengers.${index}.full_name`, profile.full_name);
    setValue(`passengers.${index}.cpf`, profile.cpf);
    setValue(`passengers.${index}.source`, "profile");
    setValue(`passengers.${index}.save_passenger`, false);
    trigger(`passengers.${index}`);
  };

  const fillWithSaved = (index: number, saved: Passenger) => {
    setValue(`passengers.${index}.full_name`, saved.full_name);
    setValue(`passengers.${index}.cpf`, saved.cpf);
    setValue(`passengers.${index}.rg`, saved.rg || "");
    setValue(`passengers.${index}.orgao_emissor`, saved.orgao_emissor || "");
    setValue(`passengers.${index}.source`, "saved");
    setValue(`passengers.${index}.save_passenger`, false);
    trigger(`passengers.${index}`);
  };

  const handleFieldChange = (index: number, field: "full_name" | "cpf" | "rg" | "orgao_emissor", val: string) => {
    if (field === "cpf") {
      val = formatCPF(val);
    }
    setValue(`passengers.${index}.${field}`, val, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Main Form Area ── */}
      <div className="w-full lg:w-2/3">
        {/* ProgressBar */}
        <div className="mb-8 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full" />
          {[1, 2, 3, 4].map((i) => {
            if (i === 3 && !excursion.allow_seat_selection) return null;
            const isActive = step === i;
            const isPast = step > i;
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${isActive ? 'bg-primary text-on-primary ring-4 ring-primary/20' : isPast ? 'bg-success text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {isPast ? "✓" : i}
                </div>
                <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {i === 1 ? "Quantidade" : i === 2 ? "Passageiros" : i === 3 ? "Poltronas" : "Revisão"}
                </span>
              </div>
            );
          })}
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20 flex items-center gap-3">
            <span className="text-xl">⚠️</span> {globalError}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm min-h-[400px]">
          
          {/* STEP 1: QUANTIDADE */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-on-surface mb-2">Quantas pessoas vão viajar?</h2>
              <p className="text-on-surface-variant mb-8">Selecione o número de lugares que deseja reservar. Vagas disponíveis: <strong className="text-primary">{availableCount}</strong></p>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-xl text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  -
                </button>
                <span className="text-4xl font-extrabold text-on-surface">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(availableCount, q + 1))}
                  className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-xl text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PASSAGEIROS */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-on-surface mb-6">Dados dos Passageiros</h2>
              
              <div className="space-y-8">
                {fields.map((field, idx) => {
                  const currentSource = watchedPassengers[idx]?.source || "manual";
                  const isProfile = currentSource === "profile";
                  const isSaved = currentSource === "saved";
                  
                  return (
                    <div key={field.id} className="p-5 sm:p-6 border border-outline-variant/50 rounded-2xl bg-surface-container-lowest relative shadow-sm transition-all">
                      <div className="absolute top-0 left-0 bg-primary/10 text-primary px-4 py-1.5 rounded-br-2xl rounded-tl-2xl font-bold text-sm">
                        Viajante {idx + 1}
                      </div>

                      {/* Quick Actions (Auto-fill) */}
                      <div className="mt-8 mb-4 flex flex-wrap gap-2 items-center">
                        {!isProfileUsed && profile?.cpf && currentSource === "manual" && (
                          <button 
                            onClick={() => fillWithProfile(idx)}
                            className="flex items-center gap-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full font-medium transition-colors"
                          >
                            <User className="w-4 h-4" /> Usar meus dados
                          </button>
                        )}
                        
                        {savedPassengers.length > 0 && currentSource === "manual" && savedPassengers.map(sp => {
                          const isAlreadyUsed = watchedPassengers.some(p => p.cpf?.replace(/\D/g, "") === sp.cpf.replace(/\D/g, ""));
                          if (isAlreadyUsed) return null;
                          return (
                            <button 
                              key={sp.id}
                              onClick={() => fillWithSaved(idx, sp)}
                              className="flex items-center gap-1.5 text-sm border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-full transition-colors"
                            >
                              <User className="w-4 h-4" /> {sp.full_name.split(" ")[0]}
                            </button>
                          );
                        })}
                      </div>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nome */}
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Nome Completo *</label>
                          <input 
                            {...register(`passengers.${idx}.full_name`)}
                            onChange={(e) => handleFieldChange(idx, "full_name", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.passengers?.[idx]?.full_name ? 'border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'} focus:ring-1 outline-none bg-surface transition-colors`} 
                            placeholder="Igual ao documento"
                          />
                          {errors.passengers?.[idx]?.full_name && (
                            <p className="text-error text-xs mt-1 font-medium">{errors.passengers[idx].full_name?.message}</p>
                          )}
                        </div>

                        {/* CPF */}
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">CPF *</label>
                          <input 
                            {...register(`passengers.${idx}.cpf`)}
                            onChange={(e) => handleFieldChange(idx, "cpf", e.target.value)}
                            maxLength={14}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.passengers?.[idx]?.cpf ? 'border-error focus:ring-error' : 'border-outline-variant focus:border-primary focus:ring-primary'} focus:ring-1 outline-none bg-surface transition-colors`} 
                            placeholder="000.000.000-00"
                          />
                          {errors.passengers?.[idx]?.cpf && (
                            <p className="text-error text-xs mt-1 font-medium">{errors.passengers[idx].cpf?.message}</p>
                          )}
                        </div>

                        {/* RG */}
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">RG <span className="text-on-surface-variant font-normal">(Opcional)</span></label>
                          <input 
                            {...register(`passengers.${idx}.rg`)}
                            onChange={(e) => handleFieldChange(idx, "rg", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface transition-colors" 
                            placeholder="Número do RG"
                          />
                        </div>

                        {/* Orgao Emissor */}
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Órgão Emissor <span className="text-on-surface-variant font-normal">(Opcional)</span></label>
                          <input 
                            {...register(`passengers.${idx}.orgao_emissor`)}
                            onChange={(e) => handleFieldChange(idx, "orgao_emissor", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface transition-colors" 
                            placeholder="Ex: SSP/SP"
                          />
                        </div>
                      </div>

                      {/* Auto-save checkbox only for strictly new passengers */}
                      {currentSource === "manual" && (
                        <div className="mt-5 flex items-start sm:items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`save_passenger_${idx}`}
                            {...register(`passengers.${idx}.save_passenger`)}
                            className="w-4 h-4 mt-0.5 sm:mt-0 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor={`save_passenger_${idx}`} className="text-sm font-medium text-on-surface-variant cursor-pointer select-none">
                            Salvar este passageiro para compras mais rápidas no futuro
                          </label>
                        </div>
                      )}
                      
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: POLTRONAS */}
          {step === 3 && excursion.allow_seat_selection && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-on-surface mb-2">Escolha as Poltronas</h2>
              <p className="text-on-surface-variant mb-6">Selecione <strong className="text-primary">{quantity}</strong> poltrona(s) no mapa do ônibus.</p>
              
              <div className="bg-surface-container p-4 sm:p-6 rounded-2xl flex flex-col items-center">
                {(() => {
                  const gridMatrix = excursion.vehicle_layouts?.grid_matrix;
                  const isV2 = gridMatrix?.version === 2;
                  
                  if (!isV2 || !gridMatrix.decks || gridMatrix.decks.length === 0) {
                    return (
                      <div className="p-8 text-center bg-surface-container-high rounded-xl w-full">
                        <p className="text-on-surface-variant">Mapa de assentos não disponível para este veículo.</p>
                      </div>
                    );
                  }

                  const deck = gridMatrix.decks[activeDeckIndex];

                  return (
                    <div className="w-full max-w-sm">
                      {gridMatrix.decks.length > 1 && (
                        <div className="flex gap-2 mb-6 bg-surface-container-high p-1 rounded-xl">
                          {gridMatrix.decks.map((d: any, idx: number) => (
                            <button
                              key={d.id}
                              onClick={() => setActiveDeckIndex(idx)}
                              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                activeDeckIndex === idx
                                  ? 'bg-surface text-primary shadow-sm'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col items-center relative overflow-hidden">
                        {/* Frente do onibus decorativo */}
                        <div className="w-3/4 h-12 border-4 border-b-0 border-outline-variant/30 rounded-t-full mb-6 relative">
                          <div className="absolute inset-x-4 bottom-2 h-4 border-2 border-outline-variant/20 rounded-t-xl opacity-50" />
                        </div>
                        
                        <div
                          className="grid gap-2 mb-6 w-full max-w-[280px] mx-auto"
                          style={{
                            gridTemplateColumns: `repeat(${deck.cols}, minmax(0, 1fr))`
                          }}
                        >
                          {deck.cells.map((cell: any) => {
                            const isOccupied = liveOccupiedSeats.includes(cell.label);
                            const isSelected = selectedSeats.includes(cell.label);
                            
                            // Cell classes based on type
                            let cellClasses = "flex items-center justify-center font-bold text-xs sm:text-sm rounded-lg transition-all ";
                            let content: React.ReactNode = "";
                            let disabled = true;
                            let onClick = undefined;

                            if (cell.type === 'seat') {
                              if (isOccupied) {
                                cellClasses += "bg-surface-container-high text-outline cursor-not-allowed";
                              } else if (isSelected) {
                                cellClasses += "bg-primary text-on-primary shadow-md hover:bg-primary/90 cursor-pointer ring-2 ring-primary ring-offset-1";
                              } else {
                                cellClasses += "bg-surface border border-outline-variant text-on-surface hover:border-primary cursor-pointer shadow-sm";
                              }
                              content = cell.label;
                              disabled = isOccupied;
                              onClick = () => {
                                if (isSelected) setSelectedSeats(s => s.filter(x => x !== cell.label));
                                else if (selectedSeats.length < quantity) setSelectedSeats(s => [...s, cell.label]);
                              };
                            } else if (cell.type === 'corridor') {
                                cellClasses += "bg-transparent";
                            } else if (cell.type === 'driver') {
                                cellClasses += "bg-surface-container text-on-surface-variant border border-outline-variant/30 text-[10px] sm:text-xs";
                                content = "Mot.";
                            } else if (cell.type === 'bathroom') {
                                cellClasses += "bg-blue-50 text-blue-400 border border-blue-100 text-[10px] sm:text-xs";
                                content = "WC";
                            } else if (cell.type === 'door') {
                                cellClasses += "bg-emerald-50 text-emerald-500 border border-emerald-100 text-[10px] sm:text-xs";
                                content = "Porta";
                            } else if (cell.type === 'stairs') {
                                cellClasses += "bg-amber-50 text-amber-500 border border-amber-100 text-[10px] sm:text-xs";
                                content = "Escada";
                            } else {
                                cellClasses += "bg-transparent";
                            }

                            return (
                              <button
                                key={cell.id}
                                disabled={disabled}
                                onClick={onClick}
                                className={cellClasses}
                                style={{
                                  gridRow: `span ${cell.rowSpan}`,
                                  gridColumn: `span ${cell.colSpan}`,
                                  aspectRatio: cell.type === 'seat' ? '1 / 1' : 'auto',
                                  minHeight: cell.type === 'seat' ? '36px' : 'auto'
                                }}
                                title={cell.type === 'seat' ? `Poltrona ${cell.label}` : cell.type}
                              >
                                {content}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Fundo do onibus decorativo */}
                        <div className="w-full h-8 border-4 border-t-0 border-outline-variant/30 rounded-b-3xl relative" />
                      </div>

                      {/* Legenda */}
                      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-surface border border-outline-variant shadow-sm" /> Livre
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-primary shadow-sm" /> Selecionada
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-surface-container-high text-outline" /> Ocupada
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 4: REVISAO E PAGAMENTO */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-on-surface mb-6">Revise seu pedido</h2>
              
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <span>📌</span> Regras da Reserva (PIX Assíncrono)
                </h3>
                <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside">
                  <li>Sua vaga só é garantida após o envio do comprovante.</li>
                  <li>Você terá <strong>24 horas</strong> para enviar o PIX.</li>
                  <li>Caso o pagamento não seja confirmado, a reserva será cancelada.</li>
                </ul>
              </div>

              <div className="border border-outline-variant/30 rounded-2xl overflow-hidden mb-6">
                <div className="bg-surface-container-lowest p-4 border-b border-outline-variant/30 flex justify-between items-center">
                  <span className="font-bold text-on-surface">Resumo da Viagem</span>
                </div>
                <div className="p-4 space-y-3 text-sm text-on-surface-variant">
                  {/* Quantidade */}
                  <div className="flex justify-between items-center">
                    <span>Quantidade:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-on-surface">{quantity} x {formatBRL(excursion.price_per_seat)}</span>
                      <button onClick={() => goToStepFromReview(1)} className="text-primary hover:text-primary/80 transition-colors" title="Editar quantidade">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Destino:</span>
                    <span className="font-semibold text-on-surface text-right max-w-[200px] sm:max-w-xs">{excursion.tour_packages?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data de Saída:</span>
                    <span className="font-semibold text-on-surface">{new Date(excursion.departure_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {excursion.allow_seat_selection && (
                    <div className="flex justify-between items-center">
                      <span>Poltronas:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{selectedSeats.join(", ") || "Nenhuma"}</span>
                        <button onClick={() => goToStepFromReview(3)} className="text-primary hover:text-primary/80 transition-colors" title="Editar poltronas">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t border-outline-variant/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Viajantes:</span>
                      <button onClick={() => goToStepFromReview(2)} className="text-primary hover:text-primary/80 text-xs font-medium flex items-center gap-1 transition-colors">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    </div>
                    {watchedPassengers.map((p, i) => (
                      <div key={i} className="text-sm font-medium text-on-surface bg-surface-container px-3 py-2.5 rounded-lg mb-2 flex justify-between items-center">
                        <span className="truncate pr-4">{p.full_name}</span>
                        <span className="shrink-0">{p.cpf}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button 
            onClick={handleBack}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl text-on-surface font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Sair" : "Voltar"}
          </button>
          
          {step < 4 ? (
            <button 
              onClick={handleNextStep}
              className="px-8 py-3 rounded-xl gradient-cta text-on-cta font-bold shadow-md hover:shadow-glow-cta transition-all"
            >
              {editFromReview ? "Confirmar" : "Continuar"}
            </button>
          ) : (
            <button 
              onClick={handleFinalize}
              disabled={isLoading}
              className="px-8 py-3 rounded-xl gradient-cta text-on-cta font-bold shadow-md hover:shadow-glow-cta transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...
                </>
              ) : "Finalizar Reserva"}
            </button>
          )}
        </div>

      </div>

      {/* ── Sidebar Summary ── */}
      <div className="w-full lg:w-1/3">
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-md sticky top-24">
          <h3 className="font-bold text-on-surface mb-6 pb-4 border-b border-outline-variant/30">Total a pagar</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Valor unitário</span>
              <span className="font-medium text-on-surface">{formatBRL(excursion.price_per_seat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Quantidade</span>
              <span className="font-medium text-on-surface">{quantity}x</span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end">
            <span className="text-sm font-semibold text-on-surface">Total</span>
            <span className="text-2xl font-extrabold text-primary">{formatBRL(totalAmount)}</span>
          </div>

        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="relative bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Sair do checkout?</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Seu progresso será salvo automaticamente. Você pode retomar a compra a qualquer momento.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors text-sm"
              >
                Continuar comprando
              </button>
              <button
                onClick={() => router.push(backHref)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
