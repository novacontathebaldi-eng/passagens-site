import React from "react";
import { Document, Page, View, Text, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { format } from "date-fns";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 30, fontFamily: "Inter", fontSize: 10, color: "#0f172a" },
  
  // Header
  header: { marginBottom: 20, paddingBottom: 12, borderBottom: "2pt solid #e2e8f0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { alignItems: "flex-end" },
  logo: { width: 36, height: 36, objectFit: "contain", borderRadius: 6 },
  companyName: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  reportSub: { fontSize: 8, color: "#64748b", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  subtitle: { fontSize: 8, color: "#94a3b8" },

  // KPIs
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  kpiBox: { flex: 1, padding: 10, backgroundColor: "#f8fafc", borderRadius: 6, border: "1pt solid #e2e8f0" },
  kpiLabel: { fontSize: 7, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  kpiValue: { fontSize: 12, fontWeight: 700, color: "#0f172a" },

  // Breakdown
  breakdownBox: { marginBottom: 20, padding: 10, backgroundColor: "#f8fafc", borderRadius: 6, border: "1pt solid #e2e8f0" },
  breakdownTitle: { fontSize: 10, fontWeight: 700, color: "#334155", marginBottom: 8 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1pt solid #e2e8f0" },
  breakdownLabel: { fontSize: 8, color: "#475569", flex: 1 },
  breakdownVal: { fontSize: 8, fontWeight: 700, color: "#0f172a", width: 80, textAlign: "right" },

  // Table
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 },
  table: { width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", alignItems: "center" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#cbd5e1" },
  
  colId: { width: "8%", padding: 6 },
  colClient: { width: "17%", padding: 6 },
  colExcursion: { width: "22%", padding: 6 },
  colDate: { width: "10%", padding: 6 },
  colStatus: { width: "10%", padding: 6 },
  colVia: { width: "7%", padding: 6, textAlign: "center" },
  colPax: { width: "6%", padding: 6, textAlign: "center" },
  colDiscount: { width: "9%", padding: 6, textAlign: "right" },
  colValue: { width: "11%", padding: 6, textAlign: "right" },

  textHeader: { fontSize: 7, fontWeight: 700, color: "#475569", textTransform: "uppercase" },
  textCell: { fontSize: 8, color: "#334155" },
  textCellBold: { fontSize: 8, fontWeight: 700, color: "#0f172a" },

  // Badge Status
  badge: { paddingVertical: 2, paddingHorizontal: 4, borderRadius: 4 },
  badgeText: { fontSize: 6, fontWeight: 700 },

  // Totals Row
  totalRow: { flexDirection: "row", backgroundColor: "#f1f5f9", alignItems: "center" },

  footer: { position: "absolute", bottom: 30, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#94a3b8" },
});

const formatCurrency = (val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const renderStatusBadge = (status: string) => {
  let bg = "#f1f5f9";
  let color = "#64748b";
  let label = status;

  switch (status) {
    case "APPROVED":
      bg = "#dcfce7"; color = "#16a34a"; label = "Aprovado";
      break;
    case "PENDING_PIX":
    case "AWAITING_MANUAL_CHECK":
      bg = "#ffedd5"; color = "#ea580c"; label = "Pendente";
      break;
    case "REFUNDED":
      bg = "#f3e8ff"; color = "#9333ea"; label = "Reembolso";
      break;
    case "CANCELLED":
    case "EXPIRED":
      bg = "#f1f5f9"; color = "#64748b"; label = "Cancelado";
      break;
  }

  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

export interface FinanceiroPDFDocumentProps {
  transactions: any[];
  companyName: string;
  logoUrl?: string;
  dateRangeLabel: string;
  kpis: {
    receita: number;
    ticketMedio: number;
    pendente: number;
    reembolsado: number;
    totalTransactions: number;
  };
}

export function FinanceiroPDFDocument({
  transactions,
  companyName,
  logoUrl,
  dateRangeLabel,
  kpis
}: FinanceiroPDFDocumentProps) {
  
  // Calcular breakdown por excursão apenas para transações APROVADAS
  const breakdown: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.status === "APPROVED") {
      breakdown[t.excursionTitle] = (breakdown[t.excursionTitle] || 0) + Number(t.amount);
    }
  });

  const breakdownArray = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  // Calcular totais da tabela (Desconto e Valor final)
  const totalDescontos = transactions.reduce((acc, t) => acc + Number(t.discount || 0), 0);
  const totalValorTabela = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" style={s.page} orientation="landscape">
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={s.logo} />}
            <View>
              <Text style={s.companyName}>{companyName}</Text>
              <Text style={s.reportSub}>Relatório Financeiro Administrativo</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>Relatório Financeiro</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
              <Text style={s.subtitle}>{dateRangeLabel}</Text>
              <Text style={s.subtitle}>|</Text>
              <Text style={s.subtitle}>Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
            </View>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Receita Aprovada</Text>
            <Text style={s.kpiValue}>{formatCurrency(kpis.receita)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Aguardando Pagamento</Text>
            <Text style={s.kpiValue}>{formatCurrency(kpis.pendente)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Reembolsado</Text>
            <Text style={s.kpiValue}>{formatCurrency(kpis.reembolsado)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Ticket Médio</Text>
            <Text style={s.kpiValue}>{formatCurrency(kpis.ticketMedio)}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Qtd Transações</Text>
            <Text style={s.kpiValue}>{kpis.totalTransactions}</Text>
          </View>
        </View>

        {/* Breakdown por Excursão */}
        {breakdownArray.length > 0 && (
          <View style={s.breakdownBox} wrap={false}>
            <Text style={s.breakdownTitle}>Receita Aprovada por Excursão</Text>
            {breakdownArray.map(([title, amount], idx) => (
              <View key={idx} style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>{title}</Text>
                <Text style={s.breakdownVal}>{formatCurrency(amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Table */}
        <Text style={s.sectionTitle}>Detalhamento de Transações</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <View style={s.colId}><Text style={s.textHeader}>ID</Text></View>
            <View style={s.colClient}><Text style={s.textHeader}>Cliente</Text></View>
            <View style={s.colExcursion}><Text style={s.textHeader}>Excursão</Text></View>
            <View style={s.colDate}><Text style={s.textHeader}>Data</Text></View>
            <View style={s.colStatus}><Text style={s.textHeader}>Status</Text></View>
            <View style={s.colVia}><Text style={s.textHeader}>Via</Text></View>
            <View style={s.colPax}><Text style={s.textHeader}>Pax</Text></View>
            <View style={s.colDiscount}><Text style={s.textHeader}>Desconto</Text></View>
            <View style={s.colValue}><Text style={s.textHeader}>Valor Final</Text></View>
          </View>
          
          {transactions.map((t, idx) => (
            <View key={t.id || idx} style={s.tableRow} wrap={false}>
              <View style={s.colId}><Text style={s.textCell}>{String(t.id).substring(0, 8).toUpperCase()}</Text></View>
              <View style={s.colClient}><Text style={s.textCellBold}>{t.clientName}</Text></View>
              <View style={s.colExcursion}><Text style={s.textCell}>{t.excursionTitle}</Text></View>
              <View style={s.colDate}><Text style={s.textCell}>{format(new Date(t.date), "dd/MM/yyyy")}</Text></View>
              <View style={s.colStatus}>{renderStatusBadge(t.status)}</View>
              <View style={s.colVia}><Text style={s.textCell}>{t.gateway === "MANUAL_ASYNC_V1" ? "PIX" : t.gateway}</Text></View>
              <View style={s.colPax}><Text style={s.textCell}>{t.pax}</Text></View>
              <View style={s.colDiscount}><Text style={s.textCell}>{formatCurrency(Number(t.discount || 0))}</Text></View>
              <View style={s.colValue}><Text style={s.textCellBold}>{formatCurrency(Number(t.amount || 0))}</Text></View>
            </View>
          ))}

          {/* Totals Row */}
          {transactions.length > 0 && (
            <View style={[s.tableRow, s.totalRow]} wrap={false}>
              <View style={{ ...s.colId, width: "66%" }}><Text style={[s.textHeader, { textAlign: "right" }]}>TOTAIS DA TABELA:</Text></View>
              <View style={s.colPax}><Text style={s.textCell}></Text></View>
              <View style={s.colDiscount}><Text style={s.textCellBold}>{formatCurrency(totalDescontos)}</Text></View>
              <View style={s.colValue}><Text style={s.textCellBold}>{formatCurrency(totalValorTabela)}</Text></View>
            </View>
          )}

          {transactions.length === 0 && (
            <View style={[s.tableRow, { padding: 20, justifyContent: "center" }]}>
              <Text style={s.textCell}>Nenhuma transação encontrada no período selecionado.</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{companyName} - Documento Administrativo</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
