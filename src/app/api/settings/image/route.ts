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

  const url = data?.[field as keyof typeof data] as string | null;

  if (!url) {
    // Return a transparent 1x1 pixel as fallback
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  }

  // Redirect to the actual image URL (Supabase Storage)
  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
