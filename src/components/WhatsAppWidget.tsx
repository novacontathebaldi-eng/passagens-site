"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ExternalLink } from "lucide-react";

interface WhatsAppWidgetProps {
  phoneNumbers: string[];
  companyName: string;
  operatingHours?: string | null;
}

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a3.8 3.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={WHATSAPP_ICON_PATH} />
    </svg>
  );
}

export function WhatsAppWidget({
  phoneNumbers,
  companyName,
  operatingHours,
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasDismissedTooltip, setHasDismissedTooltip] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Context-aware pre-filled WhatsApp message
  const getContextMessage = useCallback(() => {
    if (pathname.startsWith("/excursao/"))
      return "Olá! Tenho dúvidas sobre uma das excursões que vi no site.";
    if (pathname.startsWith("/checkout/"))
      return "Olá! Preciso de ajuda para concluir minha reserva.";
    if (pathname.startsWith("/painel"))
      return "Olá! Preciso de ajuda com minha conta ou minhas viagens.";
    if (pathname.startsWith("/sucesso"))
      return "Olá! Tenho uma dúvida sobre meu pagamento/reserva.";
    if (pathname === "/contato")
      return "Olá! Vi a página de contato e gostaria de falar com vocês.";
    return "Olá! Gostaria de mais informações sobre as excursões.";
  }, [pathname]);

  // Context-aware greeting
  const getGreeting = () => {
    if (pathname.startsWith("/excursao/"))
      return "Dúvidas sobre esta viagem?";
    if (pathname.startsWith("/checkout/"))
      return "Ajuda com sua reserva?";
    if (pathname.startsWith("/sucesso"))
      return "Dúvidas sobre o pagamento?";
    return "Olá! Como podemos ajudar?";
  };

  // Show tooltip after 3s on first load (once per session)
  useEffect(() => {
    if (hasDismissedTooltip) return;

    const tooltipShown = sessionStorage.getItem("wa-tooltip-shown");
    if (tooltipShown) {
      setHasDismissedTooltip(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowTooltip(true);
      sessionStorage.setItem("wa-tooltip-shown", "1");
      // Auto-hide after 4s
      setTimeout(() => {
        setShowTooltip(false);
        setHasDismissedTooltip(true);
      }, 4000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasDismissedTooltip]);

  // Close popover on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close popover on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Don't render if no phone numbers configured
  if (!phoneNumbers || phoneNumbers.length === 0) return null;

  const cleanNumber = (num: string) => num.replace(/\D/g, "");

  const firstHoursLine = operatingHours
    ? operatingHours.split("\n")[0]
    : null;

  return (
    <div
      ref={popoverRef}
      className="fixed bottom-6 right-4 sm:right-6 z-[45] flex flex-col items-end gap-3"
    >
      {/* ── Popover Card ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden"
          >
            {/* Header — WhatsApp brand green */}
            <div className="bg-[#075E54] px-5 py-4 text-white relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-lg font-bold leading-tight pr-8">
                {getGreeting()}
              </p>
              <p className="text-sm text-white/80 mt-1">
                {companyName} • Resposta rápida
              </p>
              {firstHoursLine && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-white/70">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{firstHoursLine}</span>
                </div>
              )}
            </div>

            {/* Body — Phone number list */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-on-surface-variant">
                Toque para iniciar a conversa:
              </p>
              {phoneNumbers.map((num, i) => (
                <a
                  key={i}
                  href={`https://wa.me/${cleanNumber(num)}?text=${encodeURIComponent(getContextMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl border border-outline-variant/30 hover:bg-[#25D366]/10 hover:border-[#25D366]/40 transition-all group"
                >
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">
                      {num}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Toque para conversar
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 pb-3">
              <p className="text-[10px] text-center text-outline">
                Atendimento via WhatsApp • {companyName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tooltip (first visit only) ── */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-on-surface text-surface text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap pointer-events-none"
          >
            Precisa de ajuda? 💬
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB (Floating Action Button) ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, delay: 1.2 }}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setShowTooltip(false);
          setHasDismissedTooltip(true);
        }}
        className="group relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        style={{
          backgroundColor: isOpen ? "var(--color-on-surface)" : "#25D366",
        }}
        aria-label={isOpen ? "Fechar WhatsApp" : "Abrir WhatsApp"}
        aria-expanded={isOpen}
      >
        {/* Pulse ring (only when closed) */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] wa-pulse pointer-events-none" />
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={isOpen ? "close" : "whatsapp"}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <WhatsAppIcon className="w-7 h-7 text-white" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
