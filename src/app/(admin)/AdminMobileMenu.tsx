/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { NavItem } from "./layout";

interface AdminMobileMenuProps {
  navItems: NavItem[];
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Auto-expand if current page matches a child
      const autoExpand = new Set<string>();
      navItems.forEach(item => {
        if (item.children?.some(child => pathname.startsWith(child.href))) {
          autoExpand.add(item.label);
        }
      });
      if (autoExpand.size > 0) setExpandedItems(autoExpand);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, navItems, pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

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

              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                {navItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems.has(item.label);
                  const isChildActive = item.children?.some(child => pathname.startsWith(child.href));
                  const isActive = hasChildren ? false : pathname === item.href;
                  const isParentHighlighted = hasChildren && isChildActive;

                  if (hasChildren) {
                    return (
                      <motion.div key={item.label} variants={itemVariants}>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isParentHighlighted
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <svg className={`w-5 h-5 shrink-0 ${isParentHighlighted ? "text-primary" : "text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                          </svg>
                          <span className="flex-1 text-left">{item.label}</span>
                          <svg
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isParentHighlighted ? "text-white/80" : "text-white/30"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Sub-items */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ease-in-out ${
                            isExpanded ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-4 pl-4 border-l border-white/10 space-y-0.5">
                            {item.children!.map(child => {
                              const isChildItemActive = pathname.startsWith(child.href);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setIsOpen(false)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    isChildItemActive
                                      ? "bg-primary/20 text-primary"
                                      : "text-white/50 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildItemActive ? "bg-primary" : "bg-white/20"}`} />
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div key={item.href} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
