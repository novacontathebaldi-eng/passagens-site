"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminDesktopNavProps {
  navItems: { href: string; icon: string; label: string }[];
}

export function AdminDesktopNav({ navItems }: AdminDesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <div key={item.href}>
            <Link
              href={item.href}
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
          </div>
        );
      })}
    </nav>
  );
}
