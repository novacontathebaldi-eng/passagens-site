import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 30, fontFamily: "Inter", fontSize: 10, color: "#0f172a" },
  header: { marginBottom: 20, paddingBottom: 10, borderBottom: "2pt solid #e2e8f0" },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  subtitleRow: { flexDirection: "row", justifyContent: "space-between" },
  subtitle: { fontSize: 9, color: "#64748b" },
  
  table: { width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  tableRow: { margin: "auto", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableHeader: { margin: "auto", flexDirection: "row", backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#cbd5e1" },
  
  colSeat: { width: "10%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6, textAlign: "center" },
  colName: { width: "35%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6 },
  colCPF: { width: "15%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6, textAlign: "center" },
  colPhone: { width: "20%", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 6, textAlign: "center" },
  colStatus: { width: "20%", padding: 6, textAlign: "center" },

  textHeader: { fontSize: 9, fontWeight: 700, color: "#475569" },
  textCell: { fontSize: 9, color: "#334155" },
  textCellBold: { fontSize: 9, fontWeight: 700, color: "#0f172a" },
  textStatusEmbarcado: { fontSize: 9, fontWeight: 700, color: "#16a34a" },
  textStatusFaltante: { fontSize: 9, fontWeight: 700, color: "#ea580c" },
  
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 7, color: "#94a3b8", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8 },
});

export interface ManifestoPassenger {
  seat_code: string;
  full_name: string;
  masked_cpf: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  check_in_status: boolean;
}

interface ManifestoPDFProps {
  excursionTitle: string;
  passengers: ManifestoPassenger[];
  generatedAt: string;
}

export default function ManifestoPDFDocument({ excursionTitle, passengers, generatedAt }: ManifestoPDFProps) {
  const totalBoarded = passengers.filter((p) => p.check_in_status).length;
  const total = passengers.length;

  return (
    <Document title={`Manifesto - ${excursionTitle}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{excursionTitle}</Text>
          <View style={s.subtitleRow}>
            <Text style={s.subtitle}>Relatório de Manifesto de Passageiros</Text>
            <Text style={s.subtitle}>Gerado em: {generatedAt}</Text>
          </View>
          <View style={{ ...s.subtitleRow, marginTop: 4 }}>
            <Text style={s.subtitle}>Total de Passageiros: {total}</Text>
            <Text style={{ ...s.subtitle, fontWeight: 700, color: totalBoarded === total ? "#16a34a" : "#ea580c" }}>
              Embarcados: {totalBoarded} / {total}
            </Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <View style={s.colSeat}><Text style={s.textHeader}>POLT.</Text></View>
            <View style={s.colName}><Text style={s.textHeader}>NOME</Text></View>
            <View style={s.colCPF}><Text style={s.textHeader}>CPF</Text></View>
            <View style={s.colPhone}><Text style={s.textHeader}>CONTATO</Text></View>
            <View style={s.colStatus}><Text style={s.textHeader}>STATUS</Text></View>
          </View>

          {passengers.map((p, index) => {
            const isLast = index === passengers.length - 1;
            const rowStyle = isLast ? { ...s.tableRow, borderBottomWidth: 0 } : s.tableRow;
            
            return (
              <View style={rowStyle} key={p.seat_code + p.full_name}>
                <View style={s.colSeat}><Text style={s.textCellBold}>{p.seat_code}</Text></View>
                <View style={s.colName}><Text style={s.textCell}>{p.full_name}</Text></View>
                <View style={s.colCPF}><Text style={s.textCell}>{p.masked_cpf}</Text></View>
                <View style={s.colPhone}>
                  <Text style={s.textCell}>{p.emergency_contact_phone || "---"}</Text>
                </View>
                <View style={s.colStatus}>
                  <Text style={p.check_in_status ? s.textStatusEmbarcado : s.textStatusFaltante}>
                    {p.check_in_status ? "EMBARCADO" : "FALTANTE"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.footer} fixed>
          <Text>Documento de uso interno - Partiu Turismo • Criado via plataforma operacional</Text>
        </View>
      </Page>
    </Document>
  );
}
