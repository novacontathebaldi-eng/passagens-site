"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full bg-white rounded-[1rem] p-5 shadow-[0_8px_30px_rgba(25,28,30,0.04)] flex items-center justify-center gap-3 text-red-600 hover:bg-red-50 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <LogOut className="w-6 h-6" />
      )}
      <span>Sair da conta</span>
    </button>
  );
}
