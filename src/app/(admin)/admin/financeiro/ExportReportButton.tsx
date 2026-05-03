"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export function ExportReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [period, setPeriod] = useState("este_mes");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleExport = async () => {
    if (period === "personalizado" && (!customFrom || !customTo)) {
      alert("Por favor, selecione as datas de início e fim.");
      return;
    }

    try {
      setIsExporting(true);
      
      const payload = {
        period,
        customDateRange: period === "personalizado" ? { from: customFrom, to: customTo } : undefined
      };

      const response = await fetch("/api/financeiro/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o relatório");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Financeiro_${period}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const periodOptions = [
    { value: "hoje", label: "Hoje" },
    { value: "7_dias", label: "Últimos 7 dias" },
    { value: "este_mes", label: "Este Mês" },
    { value: "30_dias", label: "Últimos 30 dias" },
    { value: "este_ano", label: "Este Ano" },
    { value: "personalizado", label: "Período Personalizado" },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm text-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar Relatório
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-on-surface mb-4">Exportar Relatório</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Selecione o período</label>
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {period === "personalizado" && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">De</label>
                    <input 
                      type="date" 
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Até</label>
                    <input 
                      type="date" 
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="px-4 py-2 text-on-surface-variant font-medium hover:bg-surface-container rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                    Gerando...
                  </>
                ) : (
                  "Exportar"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
        )}
    </>
  );
}
