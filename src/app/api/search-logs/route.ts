import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (per cold start) to prevent basic abuse
const ipCache = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

export async function POST(req: NextRequest) {
  try {
    // Basic IP detection
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();

    // Clean up expired entries occasionally to prevent memory leaks
    if (Math.random() < 0.05) {
      for (const [key, value] of ipCache.entries()) {
        if (now > value.resetAt) ipCache.delete(key);
      }
    }

    if (ip !== "unknown") {
      const record = ipCache.get(ip);
      if (record && now < record.resetAt) {
        if (record.count >= MAX_REQUESTS_PER_MINUTE) {
          return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }
        record.count++;
      } else {
        ipCache.set(ip, { count: 1, resetAt: now + 60 * 1000 });
      }
    }

    const body = await req.json();
    const { term, result_count, page_origin } = body;

    if (!term || typeof term !== "string" || term.trim().length < 2) {
      return NextResponse.json({ error: "Invalid term" }, { status: 400 });
    }

    const cleanTerm = term.trim().toLowerCase().slice(0, 200);
    const origin = page_origin === "catalog" ? "catalog" : "hero";
    const count = typeof result_count === "number" ? result_count : 0;

    const supabase = await createClient();

    // ALWAYS increment total counters
    const statCalls: PromiseLike<unknown>[] = [
      supabase.rpc("increment_excursion_search_stat", { key_param: "total" }).then(),
      supabase.rpc("increment_excursion_search_stat", { key_param: `total_${origin}` }).then(),
    ];

    if (count > 0) {
      // Success: only increment counter (no row bloat)
      statCalls.push(
        supabase.rpc("increment_excursion_search_stat", { key_param: "success" }).then()
      );
    } else {
      // Failure: save full log + increment failure counter
      statCalls.push(
        supabase.from("excursion_search_analytics").insert({
          search_term: cleanTerm,
          result_count: 0,
          page_origin: origin,
        }).then(),
        supabase.rpc("increment_excursion_search_stat", { key_param: "failure" }).then()
      );
    }

    await Promise.all(statCalls);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
