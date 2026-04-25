"use client";

import { useState } from "react";

interface ExportReportButtonProps {
  transactions: any[];
  companyName: string;
  logoUrl?: string;
  periodLabel: string;
  kpis: {
    receita: number;
    ticketMedio: number;
    pendente: number;
    reembolsado: number;
  };
}

export function ExportReportButton(props: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch("/api/financeiro/exportar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(props),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o relatório");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Financeiro_${props.periodLabel.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm disabled:opacity-70"
    >
      {isExporting ? (
        <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
      {isExporting ? "Gerando PDF..." : "Exportar Relatório"}
    </button>
  );
}
