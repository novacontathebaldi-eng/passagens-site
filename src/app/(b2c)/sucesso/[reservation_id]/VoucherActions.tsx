"use client";

import { useState } from "react";

interface VoucherActionsProps {
  reservationId: string;
  userEmail: string;
}

export default function VoucherActions({ reservationId, userEmail }: VoucherActionsProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/voucher/download-pdf?reservation_id=${reservationId}`);
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "voucher.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailLoading(true);
    setEmailError("");
    setEmailSent(false);
    try {
      const res = await fetch("/api/voucher/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar email");
      }
      setEmailSent(true);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="no-print flex flex-col sm:flex-row gap-3 mt-8">
      <button
        onClick={handlePrint}
        className="flex-1 py-3.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container transition-colors text-sm font-bold text-on-surface flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        Imprimir
      </button>

      <button
        onClick={handleDownloadPDF}
        disabled={pdfLoading}
        className="flex-1 py-3.5 rounded-xl gradient-cta text-on-cta font-bold hover:shadow-glow-cta transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        {pdfLoading ? "Gerando PDF..." : "Baixar PDF"}
      </button>

      <button
        onClick={handleSendEmail}
        disabled={emailLoading || emailSent}
        className="flex-1 py-3.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-dark transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        {emailLoading ? "Enviando..." : emailSent ? `Enviado para ${userEmail}` : "Enviar por E-mail"}
      </button>

      {emailError && (
        <p className="text-error text-xs text-center w-full mt-1">{emailError}</p>
      )}
    </div>
  );
}
