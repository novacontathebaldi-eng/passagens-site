import { getSiteSettings } from "@/lib/get-settings";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const settings = await getSiteSettings();
  const v = new Date(settings.updated_at).getTime();

  return <LoginClient v={v} />;
}
