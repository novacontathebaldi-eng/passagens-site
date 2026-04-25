"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export function ExportReportButton({ transactions, companyName, logoUrl, periodLabel, kpis }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text("Relatório Financeiro", 14, 22);
      
      // Nome da empresa e período
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`${companyName} - Período: ${periodLabel}`, 14, 30);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 36);

      // Resumo de KPIs
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text(`Receita Aprovada: ${formatCurrency(kpis.receita)}`, 14, 46);
      doc.text(`Ticket Médio: ${formatCurrency(kpis.ticketMedio)}`, 100, 46);
      doc.text(`Aguardando PIX: ${formatCurrency(kpis.pendente)}`, 14, 52);
      doc.text(`Reembolsado: ${formatCurrency(kpis.reembolsado)}`, 100, 52);

      // Tabela de Transações
      const tableData = transactions.map(t => [
        t.id.substring(0, 8).toUpperCase(),
        t.clientName,
        t.excursionTitle,
        new Date(t.date).toLocaleDateString("pt-BR"),
        t.status === "APPROVED" ? "Aprovado" : t.status === "PENDING_PIX" ? "Pendente" : t.status === "REFUNDED" ? "Reembolsado" : t.status,
        formatCurrency(t.amount)
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['ID Reserva', 'Cliente', 'Excursão', 'Data', 'Status', 'Valor']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
      });

      doc.save(`Relatorio_Financeiro_${periodLabel.replace(/\s+/g, '_')}.pdf`);
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
