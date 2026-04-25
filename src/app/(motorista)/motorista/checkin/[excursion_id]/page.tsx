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
  Users,
  Loader2,
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
  // OFFLINE-READY: In offline mode, the counter will be computed from
  // IndexedDB records plus pending sync queue entries.
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
          // Always re-fetch from database to get the true count
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

  // ── Handle check-in result (shared by camera and manual) ──
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

        // Flash green
        setFlashSuccess(true);
        setTimeout(() => setFlashSuccess(false), 600);

        // Re-fetch counter from database to get the true count
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

  // ── Process identifier (called by both camera and manual) ──
  const processCheckin = useCallback(
    async (identifier: string) => {
      // Use ref to prevent concurrent calls (avoids stale closure issues)
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
        // Keep locked for 2 seconds after completion to prevent rapid re-scans
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

      // Pause scanner visual feedback
      setScannerPaused(true);
      processCheckin(code).finally(() => {
        // Re-enable scanner after the 2s lock in processCheckin expires
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

  return (
    <div
      className={`flex flex-col transition-colors duration-300 ${
        flashSuccess ? "!bg-success/10" : "bg-surface"
      }`}
      style={{ height: "calc(100dvh - 56px - 64px)" }}
    >
      {/* ── Header with counter ── */}
      <div className="bg-surface-container-lowest px-4 py-3 border-b border-outline-variant/30 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/motorista"
              className="text-on-surface-variant hover:text-primary p-1.5 bg-surface-container rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-on-surface text-lg">Check-in</h1>
          </div>

          {/* Live counter */}
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4" />
            <span className="text-sm font-bold tabular-nums">
              {boarded}/{total}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${total > 0 ? Math.min((boarded / total) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="px-4 pt-3 shrink-0">
        <div className="bg-surface-container-high rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "camera"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Camera className="w-4 h-4" />
            Câmera
          </button>
          <button
            onClick={() => {
              setActiveTab("manual");
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "manual"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Manual
          </button>
        </div>
      </div>

      {/* ── Content area — fills remaining space ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Camera mode ── */}
        {activeTab === "camera" && (
          <div className="space-y-3">
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] max-h-[55dvh] shadow-lg">
              {!scannerPaused ? (
                <Scanner
                  onScan={handleScan}
                  constraints={{ facingMode }}
                  allowMultiple={false}
                  scanDelay={500}
                  styles={{
                    container: {
                      width: "100%",
                      height: "100%",
                    },
                    video: {
                      objectFit: "cover" as const,
                    },
                  }}
                  components={{
                    finder: true,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-white/80 text-sm font-medium">
                    Processando...
                  </p>
                </div>
              )}
            </div>

            {/* Camera toggle */}
            <button
              onClick={() =>
                setFacingMode((prev) =>
                  prev === "environment" ? "user" : "environment"
                )
              }
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              {facingMode === "environment"
                ? "Usar câmera frontal"
                : "Usar câmera traseira"}
            </button>
          </div>
        )}

        {/* ── Manual mode ── */}
        {activeTab === "manual" && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
            <label className="block text-sm font-bold text-on-surface mb-3">
              Código do Voucher (6 caracteres)
            </label>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={(e) =>
                  setManualCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="EX: M9HZ6E"
                maxLength={6}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-base font-mono uppercase tracking-widest text-center"
              />
              <button
                type="submit"
                disabled={isSubmitting || manualCode.length < 6}
                className="px-5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Last result feedback ── */}
        {lastResult && (
          <div className="bg-success/10 border border-success/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-success text-on-primary rounded-xl flex items-center justify-center text-lg font-bold shrink-0">
              {lastResult.seat}
            </div>
            <div>
              <p className="text-sm text-success font-bold">
                Último check-in
              </p>
              <p className="text-base font-bold text-on-surface">
                {lastResult.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
