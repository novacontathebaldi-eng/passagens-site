import { getSiteSettings } from "@/lib/get-settings";
import CadastroClient from "./CadastroClient";

export default async function CadastroPage() {
  const settings = await getSiteSettings();
  const v = new Date(settings.updated_at).getTime();

  return <CadastroClient v={v} />;
}
