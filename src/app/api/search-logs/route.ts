import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { term, result_count } = body;

    if (!term || typeof term !== "string" || term.trim().length < 2) {
      return NextResponse.json({ error: "Invalid term" }, { status: 400 });
    }

    const supabase = await createClient();

    await supabase.from("search_logs").insert({
      term: term.trim().toLowerCase().slice(0, 200),
      result_count: typeof result_count === "number" ? result_count : 0,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
