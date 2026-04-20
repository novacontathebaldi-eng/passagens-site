"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function ConfirmEmailBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSendEmail = async () => {
    try {
      setStatus("loading");
      const res = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar e-mail.");
      }

      setStatus("success");
      setMessage("E-mail enviado! Verifique sua caixa de entrada.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Aguarde um momento antes de solicitar novamente.");
    }
  };

  if (status === "success") {
    return (
      <div className="mb-8 p-4 rounded-2xl bg-success/10 border border-success/20 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-success" />
        <p className="text-sm font-medium text-success">{message}</p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-700">Confirme seu e-mail</h3>
          <p className="text-xs text-amber-600/80">Para sua segurança e garantia da recuperação da conta, confirme seu endereço de e-mail.</p>
          {status === "error" && <p className="text-xs text-error font-medium mt-1">{message}</p>}
        </div>
      </div>
      <button 
        onClick={handleSendEmail} 
        disabled={status === "loading"}
        className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[200px]"
      >
        {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar código de confirmação"}
      </button>
    </div>
  );
}
