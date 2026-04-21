"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, formatCPF, validateCPF } from "@/lib/utils";
import { createReservation } from "./actions";

interface CheckoutClientProps {
  excursion: any;
  user: any;
  occupiedSeats: string[];
}

import Cookies from "js-cookie";
import { useRealtimeSeats } from "@/hooks/useRealtimeSeats";

export default function CheckoutClient({ excursion, user, occupiedSeats }: CheckoutClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveOccupiedSeats = useRealtimeSeats(excursion.id, occupiedSeats);

  const totalAmount = quantity * excursion.price_per_seat;
  const capacity = excursion.vehicle_layouts?.capacity || 0;
  const availableCount = capacity - liveOccupiedSeats.length;

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (quantity < 1 || quantity > availableCount) {
        setError("Quantidade inválida ou sem vagas suficientes.");
        return;
      }
      // Initialize passenger array
      setPassengers(
        Array.from({ length: quantity }).map((_, i) => passengers[i] || { full_name: "", cpf: "", rg: "" })
      );
    }
    
    if (step === 2) {
      // Validate passengers
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        if (!p.full_name || !p.cpf) {
          setError(`Preencha o Nome e CPF do Passageiro ${i + 1}.`);
          return;
        }
        if (!validateCPF(p.cpf)) {
          setError(`O CPF do Passageiro ${i + 1} é inválido.`);
          return;
        }
      }
      if (!excursion.allow_seat_selection) {
        setStep(4); // Pular mapa de assentos
        return;
      }
    }

    if (step === 3) {
      if (selectedSeats.length !== quantity) {
        setError(`Você precisa selecionar exatamente ${quantity} poltrona(s).`);
        return;
      }
    }

    setStep(s => s + 1);
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const referralCode = Cookies.get("viajaedu_ref");
      const res = await createReservation({
        excursionId: excursion.id,
        quantity,
        passengers,
        selectedSeats,
        totalAmount,
        referralCode
      });
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        router.push(`/sucesso/${res.reservationId}`);
      }
    } catch (err: any) {
      setError(err.message || "Erro interno ao processar reserva.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Main Form Area ── */}
      <div className="w-full lg:w-2/3">
        {/* ProgressBar */}
        <div className="mb-8 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-container-high -z-10 -translate-y-1/2 rounded-full" />
          {[1, 2, 3, 4].map((i) => {
            if (i === 3 && !excursion.allow_seat_selection) return null; // hide step 3 visually if hidden
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

        {error && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20 flex items-center gap-3">
            <span className="text-xl">⚠️</span> {error}
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
              
              <div className="space-y-6">
                {passengers.map((p, idx) => (
                  <div key={idx} className="p-5 border border-outline-variant/50 rounded-2xl bg-surface-container-lowest relative">
                    <div className="absolute top-0 left-0 bg-primary/10 text-primary px-3 py-1 rounded-br-2xl rounded-tl-2xl font-bold text-sm">
                      Passageiro {idx + 1} {idx === 0 && "(Titular)"}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-on-surface mb-1">Nome Completo *</label>
                        <input 
                          type="text" 
                          value={p.full_name}
                          onChange={e => {
                            const newP = [...passengers];
                            newP[idx].full_name = e.target.value;
                            setPassengers(newP);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface" 
                          placeholder="Nome igual ao RG"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-on-surface mb-1">CPF *</label>
                        <input 
                          type="text" 
                          value={p.cpf}
                          onChange={e => {
                            const newP = [...passengers];
                            newP[idx].cpf = formatCPF(e.target.value);
                            setPassengers(newP);
                          }}
                          maxLength={14}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface" 
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: POLTRONAS */}
          {step === 3 && excursion.allow_seat_selection && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-on-surface mb-2">Escolha as Poltronas</h2>
              <p className="text-on-surface-variant mb-6">Selecione <strong className="text-primary">{quantity}</strong> poltrona(s) no mapa do ônibus.</p>
              
              <div className="bg-surface-container p-6 rounded-2xl flex flex-col items-center">
                {/* Simplified Bus Matrix visualizer for now */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 text-center">
                  <p className="text-sm text-outline-variant mb-4">Mapa de Assentos será renderizado aqui com base no Grid Matrix do layout do veículo.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({length: 20}).map((_, i) => {
                      const code = `P${i+1}`;
                      const isOccupied = liveOccupiedSeats.includes(code);
                      const isSelected = selectedSeats.includes(code);
                      return (
                        <button
                          key={code}
                          disabled={isOccupied}
                          onClick={() => {
                            if (isSelected) setSelectedSeats(s => s.filter(x => x !== code));
                            else if (selectedSeats.length < quantity) setSelectedSeats(s => [...s, code]);
                          }}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                            isOccupied ? 'bg-surface-container-high text-outline cursor-not-allowed' : 
                            isSelected ? 'bg-primary text-on-primary shadow-md' : 'bg-surface border border-outline-variant hover:border-primary'
                          }`}
                        >
                          {i+1}
                        </button>
                      )
                    })}
                  </div>
                </div>
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
                  <div className="flex justify-between">
                    <span>Destino:</span>
                    <span className="font-semibold text-on-surface">{excursion.tour_packages?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data de Saída:</span>
                    <span className="font-semibold text-on-surface">{new Date(excursion.departure_date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantidade:</span>
                    <span className="font-semibold text-on-surface">{quantity} x {formatBRL(excursion.price_per_seat)}</span>
                  </div>
                  {excursion.allow_seat_selection && (
                    <div className="flex justify-between">
                      <span>Poltronas Selecionadas:</span>
                      <span className="font-semibold text-on-surface">{selectedSeats.join(", ") || "Nenhuma"}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(s => s - 1)}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl text-on-surface font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              onClick={handleNextStep}
              className="px-8 py-3 rounded-xl gradient-cta text-on-cta font-bold shadow-md hover:shadow-glow-cta transition-all"
            >
              Continuar
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
    </div>
  );
}
