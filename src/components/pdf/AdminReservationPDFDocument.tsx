import { Document, Page, View, Text, StyleSheet, Font, Image } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 30, fontFamily: "Inter", fontSize: 10, color: "#0f172a" },
  header: { marginBottom: 20, paddingBottom: 12, borderBottom: "2pt solid #e2e8f0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { alignItems: "flex-end" },
  logo: { width: 36, height: 36, objectFit: "contain", borderRadius: 6 },
  companyName: { fontSize: 14, fontWeight: 700, color: "#1e293b" },
  reportSub: { fontSize: 8, color: "#64748b", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  subtitle: { fontSize: 8, color: "#94a3b8" },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 4 },
  
  row: { flexDirection: "row", gap: 20, marginBottom: 8 },
  col: { flex: 1, flexDirection: "column", gap: 2 },
  label: { fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase" },
  value: { fontSize: 10, color: "#0f172a" },
  valueBold: { fontSize: 10, fontWeight: 700, color: "#0f172a" },

  statusApproved: { color: "#16a34a", fontWeight: 700 },
  statusPending: { color: "#ea580c", fontWeight: 700 },
  statusCancelled: { color: "#dc2626", fontWeight: 700 },
  statusRefunded: { color: "#7c3aed", fontWeight: 700 },
  
  table: { width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, marginTop: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#cbd5e1" },
  
  colSeat: { width: "15%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6, textAlign: "center" },
  colName: { width: "45%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6 },
  colCPF: { width: "25%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6, textAlign: "center" },
  colCheck: { width: "15%", padding: 6, textAlign: "center" },

  textHeader: { fontSize: 8, fontWeight: 700, color: "#475569" },
  textCell: { fontSize: 9, color: "#334155" },
  textCellBold: { fontSize: 9, fontWeight: 700, color: "#0f172a" },

  notesBox: { backgroundColor: "#f8fafc", padding: 10, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: "#3b82f6", marginTop: 4 },
  notesText: { fontSize: 9, color: "#334155" },

  auditItem: { flexDirection: "row", marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  auditDate: { width: "20%", fontSize: 8, color: "#64748b" },
  auditAction: { width: "80%", fontSize: 9, color: "#334155" },

  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 7, color: "#94a3b8", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8 },
});

export interface AdminReservationPDFProps {
  companyName: string;
  logoUrl: string | null;
  reservation: {
    id: string;
    shortId: string;
    total_amount: number;
    discount_applied: number;
    status: string;
    gateway_provider: string;
    notes: string | null;
    created_at: string;
  };
  profile: {
    full_name: string;
    cpf: string;
    phone: string;
  };
  excursion: {
    title: string;
    departure_date: string;
    return_date: string | null;
  };
  tickets: Array<{
    seat_code: string;
    full_name: string;
    cpf: string;
    check_in_status: boolean;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    created_at: string;
    old_data: any;
    new_data: any;
  }>;
  generatedAt: string;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "APPROVED": return s.statusApproved;
    case "PENDING_PIX":
    case "AWAITING_MANUAL_CHECK": return s.statusPending;
    case "CANCELLED":
    case "EXPIRED": return s.statusCancelled;
    case "REFUNDED": return s.statusRefunded;
    default: return s.valueBold;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function AdminReservationPDFDocument({
  companyName,
  logoUrl,
  reservation,
  profile,
  excursion,
  tickets,
  auditLogs,
  generatedAt
}: AdminReservationPDFProps) {
  
  const finalAmount = reservation.total_amount - (reservation.discount_applied || 0);

  return (
    <Document title={`Relatório Reserva #${reservation.shortId}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={s.logo} />}
            <View>
              <Text style={s.companyName}>{companyName}</Text>
              <Text style={s.reportSub}>Relatório Administrativo</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>Relatório de Reserva</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
              <Text style={s.subtitle}>ID #{reservation.shortId}</Text>
              <Text style={s.subtitle}>|</Text>
              <Text style={s.subtitle}>{generatedAt}</Text>
            </View>
          </View>
        </View>

        {/* Viagem e Comprador */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>1. Detalhes da Viagem e Comprador</Text>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Excursão / Pacote</Text>
              <Text style={s.valueBold}>{excursion.title}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Data de Saída</Text>
              <Text style={s.value}>{new Date(excursion.departure_date).toLocaleString("pt-BR")}</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Comprador (Titular)</Text>
              <Text style={s.valueBold}>{profile.full_name}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>CPF do Titular</Text>
              <Text style={s.value}>{profile.cpf || "Não informado"}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Telefone</Text>
              <Text style={s.value}>{profile.phone || "Não informado"}</Text>
            </View>
          </View>
        </View>

        {/* Financeiro */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>2. Resumo Financeiro</Text>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Valor Original</Text>
              <Text style={s.value}>{formatCurrency(reservation.total_amount)}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Desconto</Text>
              <Text style={s.value}>{formatCurrency(reservation.discount_applied || 0)}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Valor Final</Text>
              <Text style={{ ...s.valueBold, fontSize: 12 }}>{formatCurrency(finalAmount)}</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Status da Reserva</Text>
              <Text style={getStatusStyle(reservation.status)}>{reservation.status}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Método / Gateway</Text>
              <Text style={s.value}>{reservation.gateway_provider}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Data da Compra</Text>
              <Text style={s.value}>{new Date(reservation.created_at).toLocaleString("pt-BR")}</Text>
            </View>
          </View>
        </View>

        {/* Passageiros */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>3. Lista de Passageiros ({tickets.length})</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <View style={s.colSeat}><Text style={s.textHeader}>POLT.</Text></View>
              <View style={s.colName}><Text style={s.textHeader}>NOME COMPLETO</Text></View>
              <View style={s.colCPF}><Text style={s.textHeader}>CPF</Text></View>
              <View style={s.colCheck}><Text style={s.textHeader}>CHECK-IN</Text></View>
            </View>

            {tickets.map((t, i) => {
              const isLast = i === tickets.length - 1;
              const rowStyle = isLast ? { ...s.tableRow, borderBottomWidth: 0 } : s.tableRow;
              return (
                <View style={rowStyle} key={t.seat_code + i}>
                  <View style={s.colSeat}><Text style={s.textCellBold}>{t.seat_code}</Text></View>
                  <View style={s.colName}><Text style={s.textCell}>{t.full_name}</Text></View>
                  <View style={s.colCPF}><Text style={s.textCell}>{t.cpf}</Text></View>
                  <View style={s.colCheck}>
                    <Text style={t.check_in_status ? s.statusApproved : s.statusPending}>
                      {t.check_in_status ? "SIM" : "NÃO"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Observações e Logs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>4. Observações e Histórico de Auditoria</Text>
          
          {reservation.notes ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.label}>Observações Internas:</Text>
              <View style={s.notesBox}>
                <Text style={s.notesText}>{reservation.notes}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ ...s.value, marginBottom: 12, color: "#94a3b8" }}>
              Nenhuma observação registrada nesta reserva.
            </Text>
          )}

          <Text style={s.label}>Logs de Sistema (Mais recentes primeiro):</Text>
          <View style={{ marginTop: 6 }}>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <View key={log.id} style={s.auditItem}>
                  <Text style={s.auditDate}>{new Date(log.created_at).toLocaleString("pt-BR")}</Text>
                  <Text style={s.auditAction}>{log.action}</Text>
                </View>
              ))
            ) : (
              <Text style={{ ...s.value, color: "#94a3b8" }}>
                Nenhum log de auditoria encontrado para esta reserva.
              </Text>
            )}
          </View>
        </View>

        <Text style={s.footer} fixed>
          Documento Confidencial - Uso Exclusivo Administrativo - {companyName}
        </Text>
      </Page>
    </Document>
  );
}
