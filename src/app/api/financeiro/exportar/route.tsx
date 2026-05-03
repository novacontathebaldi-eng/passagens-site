import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";

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

const ReportDocument = ({ transactions, companyName, logoUrl, periodLabel, kpis }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
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
        {transactions.map((t: any, index: number) => (
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Validar Auth e Role na API
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { transactions, companyName, logoUrl, periodLabel, kpis } = body;

    const stream = await renderToStream(
      <ReportDocument 
        transactions={transactions} 
        companyName={companyName} 
        logoUrl={logoUrl} 
        periodLabel={periodLabel} 
        kpis={kpis} 
      />
    );

    // Transform NodeJS ReadableStream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (error) => {
          controller.error(error);
        });
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Relatorio_Financeiro_${periodLabel.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("API error rendering PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
