import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  company_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  login_image_url: string | null;
  signup_image_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  pix_key: string | null;
  pix_instructions: string | null;
  whatsapp_support_numbers: string[] | null;
  cancellation_policy_text: string | null;
  social_links: Record<string, string> | null;
};

const SETTINGS_FIELDS = `
  company_name,
  logo_url,
  hero_image_url,
  login_image_url,
  signup_image_url,
  favicon_url,
  og_image_url,
  pix_key,
  pix_instructions,
  whatsapp_support_numbers,
  cancellation_policy_text,
  social_links
`;

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("global_settings")
    .select(SETTINGS_FIELDS)
    .eq("id", 1)
    .single();

  return (data as SiteSettings) ?? {
    company_name: "ViajaEdu!",
    logo_url: null,
    hero_image_url: null,
    login_image_url: null,
    signup_image_url: null,
    favicon_url: null,
    og_image_url: null,
    pix_key: null,
    pix_instructions: null,
    whatsapp_support_numbers: null,
    cancellation_policy_text: null,
    social_links: null,
  };
}
