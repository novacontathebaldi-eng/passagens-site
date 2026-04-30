"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusFront, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MotoristaBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 w-full rounded-t-3xl z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-[0_-8px_30px_rgb(0,0,0,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
      {/* Viagens */}
      <Link
        href="/motorista"
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl px-8 py-2 transition-colors active:scale-90 duration-150 ease-in-out",
          pathname === "/motorista"
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200"
            : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300"
        )}
      >
        <BusFront className={cn("mb-1", pathname === "/motorista" ? "fill-current" : "")} />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-wider">Viagens</span>
      </Link>

      {/* Ajustes */}
      <Link
        href="/motorista/configs"
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl px-8 py-2 transition-colors active:scale-90 duration-150 ease-in-out",
          pathname.startsWith("/motorista/configs")
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200"
            : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300"
        )}
      >
        <Settings className={cn("mb-1", pathname.startsWith("/motorista/configs") ? "fill-current" : "")} />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-wider">Ajustes</span>
      </Link>
    </nav>
  );
}
