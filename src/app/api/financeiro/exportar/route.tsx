import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { FinanceiroPDFDocument } from "@/components/pdf/FinanceiroPDFDocument";
import { getFinanceiroData } from "@/app/(admin)/admin/financeiro/actions";
import { format } from "date-fns";

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

    if (!profile || (profile.role !== "ADMIN" && profile.role !== "AGENT")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { period = "este_mes", customDateRange } = body;

    // Buscar configurações globais
    const { data: settings } = await supabase
      .from("global_settings")
      .select("company_name, logo_url")
      .eq("id", 1)
      .single();

    const companyName = settings?.company_name || "Partiu Turismo";
    const logoUrl = settings?.logo_url;

    // Buscar os dados financeiros frescos do servidor
    const data = await getFinanceiroData(period, customDateRange);

    let dateRangeLabel = data.periodLabel;
    if (period === "personalizado" && data.dateRange) {
      dateRangeLabel = `Período: ${format(new Date(data.dateRange.from), "dd/MM/yyyy")} a ${format(new Date(data.dateRange.to), "dd/MM/yyyy")}`;
    }

    const stream = await renderToStream(
      <FinanceiroPDFDocument 
        transactions={data.formattedTransactions} 
        companyName={companyName} 
        logoUrl={logoUrl} 
        dateRangeLabel={dateRangeLabel} 
        kpis={{
          receita: data.receitaAprovada,
          ticketMedio: data.ticketMedio,
          pendente: data.valorPendente,
          reembolsado: data.valorReembolsado,
          totalTransactions: data.totalTransactions
        }} 
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
        "Content-Disposition": `attachment; filename="Relatorio_Financeiro_${period}.pdf"`,
      },
    });
  } catch (error) {
    console.error("API error rendering PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
