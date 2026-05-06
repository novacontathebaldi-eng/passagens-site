"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface Props {
  targetId: string;
  price: number;
}

export default function MobileFloatingReserve({ targetId, price }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Configura o IntersectionObserver para observar quando a seção alvo entra ou sai da tela
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Se a seção alvo NÃO estiver visível (ou tiver muito pouca visibilidade), mostramos o botão
        // Usamos !entry.isIntersecting para exibir quando o alvo estiver fora da viewport
        setIsVisible(!entry.isIntersecting);
      },
      { 
        // 0 significa que se 1 pixel da seção original não estiver visível, considera fora (isso seria ruim).
        // Um valor de threshold um pouco maior evita piscar. Vamos usar rootMargin para começar a observar
        // antes mesmo de sair totalmente, ou threshold de 0.
        threshold: 0.1 
      }
    );

    const target = document.getElementById(targetId);
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [targetId]);

  const scrollToTarget = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-4 right-4 z-50 md:hidden"
        >
          <div className="bg-surface/90 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold leading-tight">
                A partir de
              </span>
              <span className="text-xl font-black text-primary leading-tight">
                {formatBRL(price)}
              </span>
            </div>
            <button 
              onClick={scrollToTarget}
              className="flex-1 bg-on-surface text-surface py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg whitespace-nowrap"
            >
              Reservar Vaga
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
