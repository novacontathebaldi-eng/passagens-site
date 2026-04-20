"use client";

import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 15,
  mass: 1,
};

// 1. Staggered Hero Reveal (Container)
export const HeroContainer = ({ children, className }: { children: ReactNode; className?: string }) => {
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

// Hero Reveal (Item)
export const FadeInUp = ({ children, className }: { children: ReactNode; className?: string }) => {
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

// 2. Dynamic Floating Bubbles Background
export const FloatingBubbles = () => {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
      <motion.div
        animate={{
          y: ["0%", "-10%", "0%"],
          x: ["0%", "5%", "0%"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"
      />
      <motion.div
        animate={{
          y: ["0%", "15%", "0%"],
          x: ["0%", "-10%", "0%"],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 right-0 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          y: ["0%", "-5%", "0%"],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl"
      />
    </div>
  );
};

// 3. Scroll Reveal for Sections
export const ScrollReveal = ({ children, className }: { children: ReactNode; className?: string }) => {
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

// 4. Staggered Reveal for Cards grid
export const CardGrid = ({ children, className }: { children: ReactNode; className?: string }) => {
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

// 5. Excursion Card with elegant hover
export const MotionCard = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: springTransition },
      }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className={className}
    >
      {children}
    </motion.article>
  );
};
