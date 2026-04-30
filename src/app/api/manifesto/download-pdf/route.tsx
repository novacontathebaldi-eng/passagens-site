import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import ManifestoPDFDocument from "@/components/pdf/ManifestoPDFDocument";

export async function GET(request: NextRequest) {
  const excursionId = request.nextUrl.searchParams.get("excursion_id");

  if (!excursionId) {
    return NextResponse.json({ error: "excursion_id obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado. Faça login para acessar." }, { status: 401 });
  }

  // Verificar Segurança / RBAC (Apenas DRIVER ou ADMIN)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "DRIVER" && profile.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acesso negado. Apenas Motoristas e Administradores podem baixar o manifesto." }, { status: 403 });
  }

  // Fetch Excursion para compor o título
  const { data: excursion } = await supabase
    .from("excursions")
    .select("tour_packages(title)")
    .eq("id", excursionId)
    .single();

  if (!excursion) {
    return NextResponse.json({ error: "Excursão não encontrada" }, { status: 404 });
  }

  // Fetch Manifesto Data (View LGPD + filtro defensivo APPROVED)
  const { data: passengers, error } = await supabase
    .from("driver_manifest_view")
    .select("seat_code, full_name, masked_cpf, emergency_contact_name, emergency_contact_phone, check_in_status")
    .eq("excursion_id", excursionId)
    .eq("payment_status", "APPROVED")
    .order("seat_code", { ascending: true });

  if (error || !passengers) {
    console.error("Erro ao buscar passageiros na view:", error);
    return NextResponse.json({ error: "Erro ao buscar passageiros" }, { status: 500 });
  }

  const pkgRaw = excursion.tour_packages as any;
  const tripTitle = Array.isArray(pkgRaw) ? pkgRaw[0]?.title : pkgRaw?.title;
  const safeTitle = tripTitle || "Excursão";

  const generatedAt = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  try {
    const buffer = await renderToBuffer(
      <ManifestoPDFDocument
        excursionTitle={safeTitle}
        passengers={passengers}
        generatedAt={generatedAt}
      />
    );

    const safeFilename = safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `manifesto-${safeFilename}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Erro interno ao gerar PDF do Manifesto" }, { status: 500 });
  }
}
