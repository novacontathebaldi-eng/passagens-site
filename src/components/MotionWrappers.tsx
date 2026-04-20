"use client";

import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 15,
  mass: 1,
};

// Instant / no-motion transition for mobile
const instantTransition: Transition = {
  duration: 0,
};

// Light fade for mobile (cheap, no layout shift)
const lightFade: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

// ──────────────────────────────────────────
// 1. Staggered Hero Reveal (Container)
// ──────────────────────────────────────────
export const HeroContainer = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  // Before hydration, render static content to avoid flash
  if (!isLoaded) {
    return <div className={className}>{children}</div>;
  }

  if (shouldReduceEffects) {
    // Mobile: simple opacity fade without stagger (no spring physics)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ──────────────────────────────────────────
// 2. Hero Reveal (Item)
// ──────────────────────────────────────────
export const FadeInUp = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  if (!isLoaded) {
    return <div className={className}>{children}</div>;
  }

  if (shouldReduceEffects) {
    // Mobile: already revealed by the parent's simple fade
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: springTransition },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ──────────────────────────────────────────
// 3. Floating Bubbles — DESKTOP ONLY
//    This is the #1 performance killer on mobile:
//    3 huge elements with blur-3xl animating infinitely
//    cause constant GPU recomposition on mobile GPUs.
//
//    Desktop: full animated blur bubbles
//    Mobile: static gradient glow (CSS only, zero JS cost)
// ──────────────────────────────────────────
export const FloatingBubbles = () => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  if (!isLoaded) {
    return null;
  }

  if (shouldReduceEffects) {
    // Mobile: static decorative glow — pure CSS, no animation, no JS overhead
    return (
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-white/30 blur-2xl" />
        <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-secondary/20 blur-2xl" />
      </div>
    );
  }

  // Desktop: full animated floating bubbles
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
      <motion.div
        animate={{
          y: ["0%", "-10%", "0%"],
          x: ["0%", "5%", "0%"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl will-change-transform"
      />
      <motion.div
        animate={{
          y: ["0%", "15%", "0%"],
          x: ["0%", "-10%", "0%"],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-3xl will-change-transform"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          y: ["0%", "-5%", "0%"],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl will-change-transform"
      />
    </div>
  );
};

// ──────────────────────────────────────────
// 4. Scroll Reveal for Sections
// ──────────────────────────────────────────
export const ScrollReveal = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  if (!isLoaded) {
    return <div className={className}>{children}</div>;
  }

  if (shouldReduceEffects) {
    // Mobile: lightweight opacity-only reveal (no Y translation = no layout shift)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={lightFade}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={springTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ──────────────────────────────────────────
// 5. Staggered Reveal for Cards grid
// ──────────────────────────────────────────
export const CardGrid = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  if (!isLoaded) {
    return <div className={className}>{children}</div>;
  }

  if (shouldReduceEffects) {
    // Mobile: instant reveal, no stagger (avoids multiple spring calculations)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={lightFade}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ──────────────────────────────────────────
// 6. Excursion Card with elegant hover
// ──────────────────────────────────────────
export const MotionCard = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { shouldReduceEffects, isLoaded } = useReducedMotion();

  if (!isLoaded) {
    return <article className={className}>{children}</article>;
  }

  if (shouldReduceEffects) {
    // Mobile: no hover effect (useless on touch), no entry animation
    // Cards are revealed by the parent's simple fade
    return <article className={className}>{children}</article>;
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: springTransition },
      }}
      whileHover={{
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className={className}
    >
      {children}
    </motion.article>
  );
};
