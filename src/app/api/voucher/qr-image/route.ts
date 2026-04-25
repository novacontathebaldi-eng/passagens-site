import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });
  }

  // Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Ownership check: verify token belongs to user's reservation
  const { data: ticket } = await supabase
    .from("passenger_tickets")
    .select("id, reservation_id, reservations!inner(user_id)")
    .eq("qr_code_token", token)
    .single();

  if (!ticket || (ticket.reservations as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  try {
    const buffer = await QRCode.toBuffer(token, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
