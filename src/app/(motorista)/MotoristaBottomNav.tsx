"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusFront, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MotoristaBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed z-50 bg-white/80 backdrop-blur-lg flex justify-around items-center px-4 py-3
      bottom-0 left-0 right-0 w-full rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.06)] border-t border-slate-100
      md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[600px] md:rounded-[2rem] md:shadow-[0_8px_30px_rgb(0,0,0,0.12)] md:border md:border-slate-200">
      {/* Viagens */}
      <Link
        href="/motorista"
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl px-8 md:px-12 py-2 transition-colors active:scale-90 duration-150 ease-in-out",
          pathname === "/motorista"
            ? "bg-blue-50 text-blue-900"
            : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
        )}
      >
        <BusFront className={cn("mb-1 w-6 h-6", pathname === "/motorista" ? "fill-current" : "")} />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-wider">Viagens</span>
      </Link>

      {/* Ajustes */}
      <Link
        href="/motorista/configs"
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl px-8 md:px-12 py-2 transition-colors active:scale-90 duration-150 ease-in-out",
          pathname.startsWith("/motorista/configs")
            ? "bg-blue-50 text-blue-900"
            : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
        )}
      >
        <Settings className={cn("mb-1 w-6 h-6", pathname.startsWith("/motorista/configs") ? "fill-current" : "")} />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-wider">Ajustes</span>
      </Link>
    </nav>
  );
}
