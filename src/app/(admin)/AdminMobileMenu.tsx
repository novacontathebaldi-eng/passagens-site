"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface AdminMobileMenuProps {
  navItems: { href: string; icon: string; label: string }[];
  profile: { full_name: string; role: string; avatar_url: string | null };
  initials: string;
  logoUrl?: string | null;
  companyName?: string | null;
}

const panelVariants: Variants = {
  hidden: { x: "-100%" },
  visible: { 
    x: 0,
    transition: { 
      type: "spring", 
      bounce: 0, 
      duration: 0.4, 
      staggerChildren: 0.05, 
      delayChildren: 0.1 
    }
  },
  exit: { 
    x: "-100%", 
    transition: { type: "spring", bounce: 0, duration: 0.3 } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export function AdminMobileMenu({ navItems, profile, initials, logoUrl, companyName }: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-on-surface hover:bg-surface-container rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.aside 
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-72 bg-[#1A1C1E] text-white flex flex-col rounded-r-2xl shadow-2xl overflow-hidden border-r border-white/5"
            >
              <div className="flex flex-col border-b border-white/10 shrink-0 bg-white/[0.02]">
                <div className="h-16 flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className="w-9 h-9 rounded-full ring-1 ring-white/10 shadow-sm shrink-0 overflow-hidden bg-white">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
                        <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
                        <path d="M8 10L16 24L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className="font-bold text-lg font-[family-name:var(--font-display)] truncate">
                      {companyName || "Partiu Turismo"}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0 -mr-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="px-6 pb-4 -mt-1">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold ring-1 ring-primary/30 shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                        {profile.full_name}
                      </p>
                      <div className="flex items-center mt-0.5">
                        <span className="text-[8px] px-1 py-[1px] rounded bg-primary/10 text-primary font-bold uppercase tracking-wider leading-none">
                          {profile.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div key={item.href} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                          isActive 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <svg className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                <div className="space-y-1">
                  <Link
                    href="/"
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 text-white/60 hover:text-white hover:bg-white/5"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Voltar ao Site
                  </Link>

                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair da conta
                    </button>
                  </form>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
