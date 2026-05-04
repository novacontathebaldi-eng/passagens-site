import { getSiteSettings } from "@/lib/get-settings";
import EsqueciSenhaClient from "./EsqueciSenhaClient";

export default async function EsqueciSenhaPage() {
  const settings = await getSiteSettings();

  return (
    <EsqueciSenhaClient 
      logoUrl={settings.logo_url} 
      companyName={settings.company_name} 
    />
  );
}
