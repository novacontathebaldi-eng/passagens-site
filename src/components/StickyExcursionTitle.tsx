"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StickyExcursionTitle({ title }: { title: string }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Ajuste o valor limite de acordo com o tamanho do Hero da página
      const heroHeight = window.innerHeight * 0.4;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isScrolled && (
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="pb-4 mb-4 border-b border-outline-variant/30"
        >
          <h2 className="text-2xl font-extrabold text-on-surface leading-tight font-[family-name:var(--font-display)]">
            {title}
          </h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
