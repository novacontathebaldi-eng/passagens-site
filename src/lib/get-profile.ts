import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CachedProfile = {
  id: string;
  role: string;
  full_name: string;
  avatar_url: string | null;
} | null;

/**
 * Fetches the current user's profile from Supabase, memoized per-request
 * via React `cache()`. Multiple Server Components calling this in the same
 * request will share a single DB round-trip.
 */
export const getCachedProfile = cache(async (): Promise<CachedProfile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    role: profile.role,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  };
});
