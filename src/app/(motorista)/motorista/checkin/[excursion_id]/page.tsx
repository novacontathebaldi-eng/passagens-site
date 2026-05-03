"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Keyboard,
  Search,
  RefreshCcw,
  Loader2,
  List,
  CheckCircle2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { performCheckin, fetchCheckinCount } from "../actions";
import type { CheckInResult } from "../checkin-types";

type TabMode = "camera" | "manual";

export default function CheckinPage() {
  const params = useParams();
  const excursionId = params.excursion_id as string;

  // UI state
  const [activeTab, setActiveTab] = useState<TabMode>("camera");
  const [manualCode, setManualCode] = useState("");
  const [scannerPaused, setScannerPaused] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [lastResult, setLastResult] = useState<{
    name: string;
    seat: string;
  } | null>(null);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counter state — only updated from the database, never locally
  const [total, setTotal] = useState(0);
  const [boarded, setBoarded] = useState(0);

  // Ref-based processing lock to avoid stale closure issues with useCallback
  const processingRef = useRef(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load initial count from database ──
  useEffect(() => {
    fetchCheckinCount(excursionId).then((count) => {
      setTotal(count.total);
      setBoarded(count.boarded);
    });
  }, [excursionId]);

  // ── Real-time counter via Supabase channel ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`checkin-${excursionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "passenger_tickets",
          filter: `excursion_id=eq.${excursionId}`,
        },
        () => {
          fetchCheckinCount(excursionId).then((count) => {
            setTotal(count.total);
            setBoarded(count.boarded);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [excursionId]);

  // ── Handle check-in result ──
  const handleResult = useCallback(
    (result: CheckInResult) => {
      if (result.success) {
        setLastResult({
          name: result.passenger.full_name,
          seat: result.passenger.seat_code,
        });

        toast.success(
          `✅ ${result.passenger.full_name} — Poltrona ${result.passenger.seat_code}`,
          { duration: 3000 }
        );

        setFlashSuccess(true);
        setTimeout(() => setFlashSuccess(false), 600);

        fetchCheckinCount(excursionId).then((count) => {
          setTotal(count.total);
          setBoarded(count.boarded);
        });
      } else {
        switch (result.error) {
          case "ALREADY_CHECKED_IN":
            toast.warning("⚠️ Passageiro já embarcou", { duration: 3000 });
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }
            break;
          case "NOT_FOUND":
            toast.error("❌ Código não encontrado", { duration: 3000 });
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(200);
            }
            break;
          case "WRONG_EXCURSION":
            toast.error("❌ Este voucher é de outra viagem", {
              duration: 3000,
            });
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(200);
            }
            break;
          case "INVALID_RESERVATION":
            toast.error(
              "❌ Reserva não confirmada — entre em contato com o suporte",
              { duration: 4000 }
            );
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(200);
            }
            break;
          case "UNAUTHORIZED":
            toast.error("❌ Você não tem permissão para realizar check-in", {
              duration: 4000,
            });
            break;
        }
      }
    },
    [excursionId]
  );

  // ── Process identifier ──
  const processCheckin = useCallback(
    async (identifier: string) => {
      if (processingRef.current || !identifier.trim()) return;

      processingRef.current = true;
      setIsSubmitting(true);
      try {
        const result = await performCheckin({
          identifier: identifier.trim(),
          excursion_id: excursionId,
        });
        handleResult(result);
      } catch {
        toast.error("❌ Erro de conexão — tente novamente", { duration: 3000 });
      } finally {
        setIsSubmitting(false);
        setTimeout(() => {
          processingRef.current = false;
        }, 2000);
      }
    },
    [excursionId, handleResult]
  );

  // ── QR Scanner callback ──
  const handleScan = useCallback(
    (detectedCodes: { rawValue: string }[]) => {
      if (processingRef.current) return;

      const code = detectedCodes?.[0]?.rawValue;
      if (!code) return;

      setScannerPaused(true);
      processCheckin(code).finally(() => {
        setTimeout(() => setScannerPaused(false), 2200);
      });
    },
    [processCheckin]
  );

  // ── Manual submit ──
  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualCode.trim() || processingRef.current) return;

      processCheckin(manualCode.trim()).finally(() => {
        setManualCode("");
        inputRef.current?.focus();
      });
    },
    [manualCode, processCheckin]
  );

  const progressPercent =
    total > 0 ? Math.min((boarded / total) * 100, 100) : 0;

  return (
    <div
      className={`h-[calc(100dvh-72px-96px)] bg-slate-50 flex flex-col relative transition-colors duration-300 font-sans overflow-hidden ${
        flashSuccess ? "!bg-green-50" : ""
      }`}
    >
      {/* ── Header Top Area ── */}
      <header className="w-full z-50 flex flex-col px-4 py-3 bg-white/80 backdrop-blur-md rounded-b-[1.5rem] shadow-[0_32px_64px_rgba(25,28,30,0.06)] shrink-0">
        <div className="flex justify-between items-center w-full mb-2">
          <Link
            href={`/motorista/manifesto/${excursionId}`}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="font-bold tracking-tight text-[#1E40AF] text-lg">
              Check-in
            </h1>
          </div>
          <Link
            href={`/motorista/manifesto/${excursionId}`}
            className="text-slate-500 hover:text-[#1E40AF] transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100"
            title="Ver lista de passageiros"
          >
            <List className="w-5 h-5" />
          </Link>
        </div>

        {/* Status & Progress */}
        <div className="w-full max-w-sm mx-auto flex flex-col gap-1">
          <div className="flex justify-between items-center px-3 py-1 bg-blue-100/50 rounded-full">
            <span className="text-xs font-semibold text-[#1E40AF]">
              Passageiros
            </span>
            <span className="font-bold text-sm text-[#1E40AF] tabular-nums">
              {boarded} / {total}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#1E40AF] h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* ── Main Content Canvas ── */}
      <main className="flex-1 min-h-0 px-4 flex flex-col items-center pt-3 overflow-y-auto">
        {/* Tabs */}
        <div className="bg-slate-200/50 p-1 rounded-full flex gap-1 w-full max-w-xs shadow-inner mb-3 shrink-0">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all ${
              activeTab === "camera"
                ? "bg-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Camera
              className={`w-5 h-5 ${
                activeTab === "camera" ? "text-[#1E40AF]" : ""
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                activeTab === "camera" ? "text-[#1E40AF]" : ""
              }`}
            >
              Câmera
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("manual");
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all ${
              activeTab === "manual"
                ? "bg-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Keyboard
              className={`w-5 h-5 ${
                activeTab === "manual" ? "text-[#1E40AF]" : ""
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                activeTab === "manual" ? "text-[#1E40AF]" : ""
              }`}
            >
              Manual
            </span>
          </button>
        </div>

        {/* ── Camera Viewport ── */}
        {activeTab === "camera" && (
          <div className="w-full max-w-sm flex flex-col items-center gap-3 flex-1 min-h-0">
            <div className="relative w-full aspect-square max-h-[55dvh] bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-[0_16px_48px_rgba(0,40,142,0.15)] flex items-center justify-center flex-1 min-h-0">
              {/* Scanning Frame lines overlay (visual only, actual scanner below) */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="relative w-48 h-48 border-2 border-dashed border-white/40 rounded-xl">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                  {/* Scan Line effect */}
                  {!scannerPaused && (
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#F97316] shadow-[0_0_8px_#F97316] animate-[scan_2s_ease-in-out_infinite]"></div>
                  )}
                </div>
              </div>

              {!scannerPaused ? (
                <Scanner
                  onScan={handleScan}
                  constraints={{ facingMode }}
                  allowMultiple={false}
                  scanDelay={500}
                  styles={{
                    container: {
                      position: "absolute",
                      inset: "0",
                      width: "100%",
                      height: "100%",
                    },
                    video: {
                      objectFit: "cover" as const,
                      width: "100%",
                      height: "100%",
                    },
                  }}
                  components={{
                    finder: false, // We use our custom finder overlay above
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
                  <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                  <p className="text-white/80 text-sm font-medium">
                    Processando...
                  </p>
                </div>
              )}

              {/* Floating Swap Camera Action */}
              <button
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "environment" ? "user" : "environment"
                  )
                }
                className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-30 hover:bg-white/30 transition-colors"
                title="Trocar Câmera"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-medium text-slate-400 text-center max-w-xs shrink-0">
              Aponte para o QR Code do voucher
            </p>
          </div>
        )}

        {/* ── Manual Mode ── */}
        {activeTab === "manual" && (
          <div className="w-full max-w-sm flex flex-col gap-4 flex-1">
            <div className="relative w-full">
              <form onSubmit={handleManualSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={manualCode}
                  onChange={(e) =>
                    setManualCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="CÓDIGO"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  className="w-full bg-white border-none rounded-[1.5rem] py-5 pl-6 pr-16 font-mono text-2xl tracking-[0.2em] text-center text-[#1E40AF] shadow-[0_8px_24px_rgba(25,28,30,0.06)] focus:ring-2 focus:ring-[#1E40AF]/20 placeholder:text-slate-300 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || manualCode.length < 6}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#1E40AF]/10 rounded-full flex items-center justify-center text-[#1E40AF] disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 hover:bg-[#1E40AF]/20 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Search className="w-6 h-6" />
                  )}
                </button>
              </form>
            </div>
            <p className="text-sm font-medium text-slate-500 text-center max-w-xs mx-auto mt-4 shrink-0">
              Digite o código de 6 caracteres do voucher para realizar o check-in manual.
            </p>
          </div>
        )}
      </main>

      {/* ── Feedback Card (Bottom Floating) ── */}
      {lastResult && (
        <div className="fixed bottom-0 left-0 w-full p-4 z-40 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="max-w-sm mx-auto bg-white rounded-3xl p-4 shadow-[0_-16px_48px_rgba(25,28,30,0.08)] flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden">
              <span className="font-extrabold text-green-800 text-xl z-10">
                {lastResult.seat}
              </span>
              {/* Optional: Add an icon or pattern in the background like the reference */}
            </div>
            <div className="flex flex-col flex-grow min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                {lastResult.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold text-sm">Check-in Realizado</span>
              </div>
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Required style for scan line animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-48px); }
          50% { transform: translateY(48px); }
          100% { transform: translateY(-48px); }
        }
      `}</style>
    </div>
  );
}
