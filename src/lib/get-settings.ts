import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export type PixKeyEntry = {
  type: string;
  key: string;
  label: string;
};

export type HeroStat = {
  number: string;
  label: string;
  iconPath: string;
};

export type SiteSettings = {
  company_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  login_image_url: string | null;
  signup_image_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  // PIX
  pix_key: string | null;
  pix_key_type: string | null;
  pix_keys: PixKeyEntry[] | null;
  pix_copy_paste: string | null;
  pix_qr_code_url: string | null;
  pix_instructions: string | null;
  // Bank
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_cpf: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_transfer_instructions: string | null;
  // Other
  hold_ttl_hours: number;
  whatsapp_support_numbers: string[] | null;
  contact_email: string | null;
  operating_hours: string | null;
  administrative_address: string | null;
  cancellation_policy_text: string | null;
  social_links: Record<string, string> | null;
  hero_stats: HeroStat[] | null;
  updated_at: string;
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
  pix_key_type,
  pix_keys,
  pix_copy_paste,
  pix_qr_code_url,
  pix_instructions,
  bank_name,
  bank_account_holder,
  bank_cpf,
  bank_agency,
  bank_account,
  bank_transfer_instructions,
  hold_ttl_hours,
  whatsapp_support_numbers,
  contact_email,
  operating_hours,
  administrative_address,
  cancellation_policy_text,
  social_links,
  hero_stats,
  updated_at
`;

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("global_settings")
    .select(SETTINGS_FIELDS)
    .eq("id", 1)
    .single();

  const settings = (data as unknown as Record<string, any>) ?? {};

  // Fix JSON fields that might be stored as stringified JSON
  let parsedPixKeys = settings.pix_keys;
  if (typeof parsedPixKeys === "string") {
    try {
      parsedPixKeys = JSON.parse(parsedPixKeys);
    } catch (e) {
      parsedPixKeys = null;
    }
  }

  let parsedWhatsApp = settings.whatsapp_support_numbers;
  if (typeof parsedWhatsApp === "string") {
    try {
      parsedWhatsApp = JSON.parse(parsedWhatsApp);
    } catch (e) {
      parsedWhatsApp = null;
    }
  }

  let parsedSocialLinks = settings.social_links;
  if (typeof parsedSocialLinks === "string") {
    try {
      parsedSocialLinks = JSON.parse(parsedSocialLinks);
    } catch (e) {
      parsedSocialLinks = null;
    }
  }

  let parsedHeroStats = settings.hero_stats;
  if (typeof parsedHeroStats === "string") {
    try {
      parsedHeroStats = JSON.parse(parsedHeroStats);
    } catch (e) {
      parsedHeroStats = null;
    }
  }

  return {
    company_name: settings.company_name ?? "Partiu Turismo",
    logo_url: settings.logo_url ?? null,
    hero_image_url: settings.hero_image_url ?? null,
    login_image_url: settings.login_image_url ?? null,
    signup_image_url: settings.signup_image_url ?? null,
    favicon_url: settings.favicon_url ?? null,
    og_image_url: settings.og_image_url ?? null,
    pix_key: settings.pix_key ?? null,
    pix_key_type: settings.pix_key_type ?? null,
    pix_keys: Array.isArray(parsedPixKeys) ? parsedPixKeys : null,
    pix_copy_paste: settings.pix_copy_paste ?? null,
    pix_qr_code_url: settings.pix_qr_code_url ?? null,
    pix_instructions: settings.pix_instructions ?? null,
    bank_name: settings.bank_name ?? null,
    bank_account_holder: settings.bank_account_holder ?? null,
    bank_cpf: settings.bank_cpf ?? null,
    bank_agency: settings.bank_agency ?? null,
    bank_account: settings.bank_account ?? null,
    bank_transfer_instructions: settings.bank_transfer_instructions ?? null,
    hold_ttl_hours: settings.hold_ttl_hours ?? 24,
    whatsapp_support_numbers: Array.isArray(parsedWhatsApp) ? parsedWhatsApp : null,
    contact_email: settings.contact_email ?? null,
    operating_hours: settings.operating_hours ?? null,
    administrative_address: settings.administrative_address ?? null,
    cancellation_policy_text: settings.cancellation_policy_text ?? null,
    social_links: typeof parsedSocialLinks === "object" ? parsedSocialLinks : null,
    hero_stats: Array.isArray(parsedHeroStats) ? parsedHeroStats : null,
    updated_at: settings.updated_at ?? new Date().toISOString(),
  };
}
