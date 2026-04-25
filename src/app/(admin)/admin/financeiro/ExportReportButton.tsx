"use client";

import { useState } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

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

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: "#ffffff", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flexDirection: "column" },
  headerRight: { flexDirection: "column", alignItems: "flex-end", paddingTop: 10 },
  logo: { width: 100, height: "auto", marginBottom: 10 },
  title: { fontSize: 18, color: "#1e3a8a", marginBottom: 5, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 2 },
  kpiContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, padding: 10, backgroundColor: "#f3f4f6", borderRadius: 4 },
  kpiBox: { flexDirection: "column" },
  kpiLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  kpiValue: { fontSize: 12, color: "#111827", fontWeight: "bold" },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb", borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableRowEven: { margin: "auto", flexDirection: "row", backgroundColor: "#f9fafb" },
  tableColHeader: { borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb", borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: "#2563eb", padding: 5 },
  tableCol: { borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb", borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 2, fontSize: 9, fontWeight: "bold", color: "#ffffff" },
  tableCell: { margin: 2, fontSize: 8, color: "#374151" },
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#e5e7eb", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#9ca3af" },
});

const colWidths = ["12%", "20%", "25%", "13%", "15%", "15%"];

const formatCurrency = (value: number) => {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
};

const translateStatus = (status: string) => {
  switch (status) {
    case "APPROVED": return "Aprovado";
    case "PENDING_PIX":
    case "AWAITING_MANUAL_CHECK": return "Aguardando PIX";
    case "REFUNDED": return "Reembolsado";
    case "CANCELLED": return "Cancelado";
    case "EXPIRED": return "Expirado";
    default: return status;
  }
};

const ReportDocument = ({ transactions, companyName, logoUrl, periodLabel, kpis }: ExportReportButtonProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : <Text style={styles.title}>{companyName}</Text>}
          {logoUrl && <Text style={styles.title}>Relatório Financeiro</Text>}
          {!logoUrl && <Text style={styles.subtitle}>Relatório Financeiro</Text>}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.subtitle}>Período: {periodLabel}</Text>
          <Text style={styles.subtitle}>Gerado em: {new Date().toLocaleString("pt-BR")}</Text>
        </View>
      </View>

      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Receita Aprovada</Text>
          <Text style={styles.kpiValue}>{formatCurrency(kpis.receita)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Ticket Médio</Text>
          <Text style={styles.kpiValue}>{formatCurrency(kpis.ticketMedio)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Aguardando PIX</Text>
          <Text style={styles.kpiValue}>{formatCurrency(kpis.pendente)}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Reembolsado</Text>
          <Text style={styles.kpiValue}>{formatCurrency(kpis.reembolsado)}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          {["ID", "Cliente", "Excursão", "Data", "Status", "Valor"].map((header, i) => (
            <View key={i} style={[styles.tableColHeader, { width: colWidths[i] }]}>
              <Text style={styles.tableCellHeader}>{header}</Text>
            </View>
          ))}
        </View>
        {transactions.map((t, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
            <View style={[styles.tableCol, { width: colWidths[0] }]}><Text style={styles.tableCell}>{t.id.substring(0, 8).toUpperCase()}</Text></View>
            <View style={[styles.tableCol, { width: colWidths[1] }]}><Text style={styles.tableCell}>{t.clientName}</Text></View>
            <View style={[styles.tableCol, { width: colWidths[2] }]}><Text style={styles.tableCell}>{t.excursionTitle}</Text></View>
            <View style={[styles.tableCol, { width: colWidths[3] }]}><Text style={styles.tableCell}>{new Date(t.date).toLocaleDateString("pt-BR")}</Text></View>
            <View style={[styles.tableCol, { width: colWidths[4] }]}><Text style={styles.tableCell}>{translateStatus(t.status)}</Text></View>
            <View style={[styles.tableCol, { width: colWidths[5] }]}><Text style={styles.tableCell}>{formatCurrency(t.amount)}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{companyName} - Documento gerado automaticamente</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

export function ExportReportButton(props: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const { pdf } = await import("@react-pdf/renderer");
      
      const blob = await pdf(<ReportDocument {...props} />).toBlob();
      
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
