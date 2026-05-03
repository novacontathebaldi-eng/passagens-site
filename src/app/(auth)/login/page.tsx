import { getSiteSettings } from "@/lib/get-settings";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const settings = await getSiteSettings();

  return (
    <LoginClient 
      loginImageUrl={settings.login_image_url} 
      logoUrl={settings.logo_url} 
      companyName={settings.company_name} 
    />
  );
}
