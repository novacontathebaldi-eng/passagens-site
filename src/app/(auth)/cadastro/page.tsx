import { getSiteSettings } from "@/lib/get-settings";
import CadastroClient from "./CadastroClient";

export default async function CadastroPage() {
  const settings = await getSiteSettings();

  return (
    <CadastroClient 
      signupImageUrl={settings.signup_image_url} 
      logoUrl={settings.logo_url} 
      companyName={settings.company_name} 
    />
  );
}
