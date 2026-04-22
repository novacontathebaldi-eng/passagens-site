import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export type PixKeyEntry = {
  type: string;
  key: string;
  label: string;
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
  cancellation_policy_text: string | null;
  social_links: Record<string, string> | null;
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
  cancellation_policy_text,
  social_links,
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

  return (data as unknown as SiteSettings) ?? {
    company_name: "ViajaEdu!",
    logo_url: null,
    hero_image_url: null,
    login_image_url: null,
    signup_image_url: null,
    favicon_url: null,
    og_image_url: null,
    pix_key: null,
    pix_key_type: null,
    pix_keys: null,
    pix_copy_paste: null,
    pix_qr_code_url: null,
    pix_instructions: null,
    bank_name: null,
    bank_account_holder: null,
    bank_cpf: null,
    bank_agency: null,
    bank_account: null,
    bank_transfer_instructions: null,
    hold_ttl_hours: 24,
    whatsapp_support_numbers: null,
    cancellation_policy_text: null,
    social_links: null,
    updated_at: new Date().toISOString(),
  };
}
