import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { motion, AnimatePresence } from "framer-motion";

interface AdminMobileMenuProps {
  navItems: { href: string; icon: string; label: string }[];
  profile: { full_name: string; role: string; avatar_url: string | null };
  initials: string;
}

export function AdminMobileMenu({ navItems, profile, initials }: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-on-surface hover:bg-surface-container rounded-lg transition-all active:scale-95"
        aria-label="Abrir menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-[#1A1C1E] text-white flex flex-col shadow-2xl border-r border-white/5"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <path d="M8 10L16 24L24 10" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg font-[family-name:var(--font-display)] tracking-tight">
                    ViajaEdu<span className="text-primary">!</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
                {navItems.map((item, idx) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.03 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                          isActive 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <svg className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-white" : "text-white/30 group-hover:text-primary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 shadow-inner"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        {initials}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success border-2 border-[#1A1C1E] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-tight">
                      {profile.full_name}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-black text-primary/70 mt-0.5">
                      {profile.role}
                    </p>
                  </div>
                </div>
                <form action={logout} className="mt-5">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white/30 hover:text-error hover:bg-error/10 border border-white/5 hover:border-error/20 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    ENCERRAR SESSÃO
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
