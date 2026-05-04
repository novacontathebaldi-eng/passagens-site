import { getSiteSettings } from "@/lib/get-settings";
import CompletarCadastroClient from "./CompletarCadastroClient";

export default async function CompletarCadastroPage() {
  const settings = await getSiteSettings();

  return (
    <CompletarCadastroClient 
      logoUrl={settings.logo_url} 
      companyName={settings.company_name} 
    />
  );
}
