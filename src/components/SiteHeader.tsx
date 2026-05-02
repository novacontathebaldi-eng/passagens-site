"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";
import {
  Menu,
  X,
  User as UserIcon,
  Map,
  Info,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

// Types
interface SiteSettings {
  company_name: string;
  logo_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

}

interface SiteHeaderProps {
  user: User | null;
  settings: SiteSettings;
  /**
   * The user's role fetched server-side from `profiles.role`.
   * Used to conditionally render the Admin shortcut.
   * NOTE: This is a UI convenience — the real route protection is in middleware.ts.
   */
  userRole?: string | null;
}

function LogoMark({ logoUrl, companyName, size = 28 }: { logoUrl?: string | null; companyName?: string; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={companyName || "Partiu Turismo"}
        width={size}
        height={size}
        className="object-cover rounded-full ring-1 ring-outline/20"
        unoptimized
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 10L16 24L24 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10L16 18L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

const navLinks = [
  { name: "Excursões", href: "/#excursoes", isScroll: true, icon: Map },
  { name: "Sobre", href: "/sobre", isScroll: false, icon: Info },
  { name: "Contato", href: "/contato", isScroll: false, icon: MessageCircle },
];

const ADMIN_ROLES = ["ADMIN", "AGENT"];

export function SiteHeader({ user, settings, userRole }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAdmin = userRole != null && ADMIN_ROLES.includes(userRole);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll and handle Esc key when menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-outline-variant/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50 relative">
            <LogoMark logoUrl={settings.logo_url} companyName={settings.company_name} size={28} />
            <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-primary group-hover:text-primary-dark transition-colors">
              {settings.company_name}
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
            {navLinks.map((link) => {
              const isActive = pathname === link.href && !link.isScroll;
              if (link.isScroll) {
                return (
                  <SmoothScrollLink
                    key={link.name}
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </SmoothScrollLink>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors ${isActive ? "text-primary font-bold" : "hover:text-primary"}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-2 md:gap-3 z-50 relative">
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                /* ── Desktop User Dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-dark transition-colors"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    id="user-menu-button"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">
                      {user.user_metadata?.full_name?.split(" ")[0] || "Minha Conta"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-outline-variant/30 shadow-xl overflow-hidden"
                        role="menu"
                        aria-labelledby="user-menu-button"
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-outline-variant/20">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {user.user_metadata?.full_name || "Usuário"}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-1.5">
                          {/* Meu Painel — visible for all logged-in users */}
                          <Link
                            href="/painel"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                            role="menuitem"
                          >
                            <LayoutDashboard className="w-4 h-4 text-on-surface-variant" />
                            Meu Painel
                          </Link>

                          {/*
                           * Admin shortcut — UI convenience only.
                           * Real route protection is enforced by middleware.ts (lines 40-60).
                           * This button is NOT rendered in the DOM for non-admin users (server-side prop).
                           */}
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                              role="menuitem"
                            >
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              <span className="font-medium">Admin</span>
                            </Link>
                          )}
                        </div>

                        {/* Separator + Logout */}
                        <div className="border-t border-outline-variant/20 py-1.5">
                          <form action={logout}>
                            <button
                              type="submit"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors"
                              role="menuitem"
                            >
                              <LogOut className="w-4 h-4" />
                              Sair
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary-container/40 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="px-4 py-2 rounded-xl gradient-cta text-on-cta text-sm font-semibold shadow-sm hover:shadow-glow-cta transition-all"
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </div>

            {/* Mobile User Icon (Quick Access) */}
            <div className="md:hidden flex items-center">
              <Link 
                href={user ? "/painel" : "/login"}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
                aria-label="Perfil"
              >
                <UserIcon className="w-6 h-6" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high relative z-50"
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-surface z-50 md:hidden flex flex-col shadow-2xl overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              {/* Drawer Header (Logo inside drawer) */}
              <div className="h-16 px-4 flex items-center border-b border-outline-variant/30 shrink-0">
                <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
                  <LogoMark logoUrl={settings.logo_url} companyName={settings.company_name} size={28} />
                  <span className="text-xl font-extrabold font-[family-name:var(--font-display)] text-primary">
                    {settings.company_name}
                  </span>
                </Link>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 py-6 px-4 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href && !link.isScroll;
                  const Icon = link.icon;
                  
                  if (link.isScroll) {
                    return (
                      <SmoothScrollLink
                        key={link.name}
                        href={link.href}
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface hover:bg-surface-container-high transition-colors font-medium"
                      >
                        <Icon className="w-5 h-5 text-on-surface-variant" />
                        {link.name}
                      </SmoothScrollLink>
                    );
                  }
                  
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium ${
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-on-surface-variant"}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Drawer Footer (Auth & Social) */}
              <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest shrink-0">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/painel"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold hover:bg-primary-dark transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Meu Painel
                    </Link>

                    {/*
                     * Admin shortcut (mobile drawer) — UI convenience only.
                     * Real route protection is enforced by middleware.ts (lines 40-60).
                     * This button is NOT rendered in the DOM for non-admin users (server-side prop).
                     */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-surface-container border border-primary/30 text-primary font-semibold hover:bg-primary/10 transition-colors"
                      >
                        <ShieldCheck className="w-5 h-5" />
                        Painel Admin
                      </Link>
                    )}

                    <form action={logout} className="w-full">
                      <button 
                        type="submit" 
                        onClick={closeMenu}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-error font-medium transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Sair da conta
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/cadastro"
                      onClick={closeMenu}
                      className="flex items-center justify-center w-full py-3 rounded-2xl gradient-cta text-on-cta font-semibold shadow-sm hover:shadow-glow-cta transition-all"
                    >
                      Cadastre-se
                    </Link>
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="flex items-center justify-center w-full py-3 rounded-2xl border-2 border-outline-variant text-primary font-semibold hover:bg-primary/5 hover:border-primary transition-colors"
                    >
                      Entrar
                    </Link>
                  </div>
                )}
                
                <div className="mt-6 text-center text-xs text-outline font-medium">
                  © {new Date().getFullYear()} {settings.company_name}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
