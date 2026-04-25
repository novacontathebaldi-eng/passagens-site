import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { TicketData } from "./VoucherCard";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf", fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Inter", fontSize: 10, color: "#1a1a2e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2pt solid #0369a1", paddingBottom: 12 },
  logo: { width: 36, height: 36, objectFit: "contain", borderRadius: 6 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 14, fontWeight: 700, color: "#0369a1" },
  headerSub: { fontSize: 8, color: "#64748b", marginTop: 2 },
  headerRight: { textAlign: "right" },
  tripName: { fontSize: 12, fontWeight: 700 },
  tripDate: { fontSize: 9, color: "#64748b", marginTop: 2 },
  ticketBox: { border: "1pt solid #e2e8f0", borderRadius: 8, marginBottom: 16, overflow: "hidden" },
  ticketHeader: { backgroundColor: "#f0f9ff", padding: 10, borderBottom: "1pt solid #e2e8f0" },
  ticketHeaderText: { fontSize: 11, fontWeight: 700, color: "#0369a1" },
  ticketBody: { padding: 14 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 700 },
  valueMono: { fontSize: 10, fontFamily: "Courier" },
  col: { flex: 1 },
  divider: { borderBottom: "1pt dashed #e2e8f0", marginVertical: 10 },
  qrRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  qrImage: { width: 100, height: 100, border: "1pt solid #e2e8f0", borderRadius: 6, padding: 4 },
  shortCodeLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  shortCode: { fontSize: 28, fontWeight: 700, color: "#0369a1", letterSpacing: 4, marginVertical: 4 },
  qrNote: { fontSize: 8, color: "#64748b", maxWidth: 200, marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#94a3b8", borderTop: "1pt solid #e2e8f0", paddingTop: 8 },
});

function maskCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

interface VoucherPDFProps {
  tickets: TicketData[];
  tripTitle: string;
  departureDate: string;
  departureDateFull: string;
  companyName: string;
  logoUrl: string | null;
  qrImages: Record<string, string>;
}

export default function VoucherPDFDocument({
  tickets, tripTitle, departureDate, departureDateFull,
  companyName, logoUrl, qrImages,
}: VoucherPDFProps) {
  return (
    <Document title={`Voucher - ${tripTitle}`} author={companyName}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={s.logo} />}
            <View>
              <Text style={s.headerTitle}>{companyName}</Text>
              <Text style={s.headerSub}>Voucher de Embarque</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.tripName}>{tripTitle}</Text>
            <Text style={s.tripDate}>{departureDate}</Text>
          </View>
        </View>

        {/* Tickets */}
        {tickets.map((ticket) => (
          <View key={ticket.id} style={s.ticketBox} wrap={false}>
            <View style={s.ticketHeader}>
              <Text style={s.ticketHeaderText}>{ticket.full_name}</Text>
            </View>
            <View style={s.ticketBody}>
              <View style={s.row}>
                <View style={s.col}>
                  <Text style={s.label}>CPF</Text>
                  <Text style={s.valueMono}>{maskCPF(ticket.cpf)}</Text>
                </View>
                <View style={s.col}>
                  <Text style={s.label}>Poltrona</Text>
                  <Text style={s.value}>{ticket.seat_code}</Text>
                </View>
                <View style={s.col}>
                  <Text style={s.label}>Embarque</Text>
                  <Text style={s.value}>{departureDateFull}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.qrRow}>
                {qrImages[ticket.id] && (
                  <Image src={qrImages[ticket.id]} style={s.qrImage} />
                )}
                <View>
                  <Text style={s.shortCodeLabel}>Código de Embarque</Text>
                  <Text style={s.shortCode}>{ticket.short_code}</Text>
                  <Text style={s.qrNote}>Apresente este voucher ou informe o código ao motorista no embarque.</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>{companyName} • Apresente este documento ao motorista no embarque</Text>
        </View>
      </Page>
    </Document>
  );
}
