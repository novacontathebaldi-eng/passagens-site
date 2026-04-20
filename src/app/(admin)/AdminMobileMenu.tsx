"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";

interface AdminMobileMenuProps {
  navItems: { href: string; icon: string; label: string }[];
  profile: { full_name: string; role: string; avatar_url: string | null };
  initials: string;
}

export function AdminMobileMenu({ navItems, profile, initials }: AdminMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-on-surface text-white flex flex-col animate-in slide-in-from-left-full duration-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
                  <path d="M8 10L16 24L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-bold font-[family-name:var(--font-display)]">
                  Admin
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-primary text-white" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-white/50">{profile.role}</p>
                </div>
              </div>
              <form action={logout} className="mt-3">
                <button
                  type="submit"
                  className="w-full text-xs text-white/40 hover:text-white/80 transition-colors text-left"
                >
                  ← Sair
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
