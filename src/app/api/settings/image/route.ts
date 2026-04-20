import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "hero_image_url",
  "login_image_url",
  "signup_image_url",
  "favicon_url",
  "og_image_url",
  "logo_url",
] as const;

// Transparent 1×1 PNG fallback (49 bytes)
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

export async function GET(request: NextRequest) {
  const field = request.nextUrl.searchParams.get("field");

  if (!field || !ALLOWED_FIELDS.includes(field as (typeof ALLOWED_FIELDS)[number])) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("global_settings")
    .select(field)
    .eq("id", 1)
    .single();

  const rawUrl = data?.[field as keyof typeof data] as string | null;

  if (!rawUrl) {
    return new NextResponse(TRANSPARENT_PIXEL, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  }

  // Strip cache buster from URL for fetching
  const cleanUrl = rawUrl.split("?")[0];

  try {
    // Proxy: fetch image bytes from Supabase Storage and stream them back
    const imageResponse = await fetch(cleanUrl, { next: { revalidate: 300 } });

    if (!imageResponse.ok) {
      return new NextResponse(TRANSPARENT_PIXEL, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/webp";
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=60",
      },
    });
  } catch {
    return new NextResponse(TRANSPARENT_PIXEL, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}
