import { getSiteSettings } from "@/lib/get-settings";
import { getDashboardData } from "./actions";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboard() {
  const settings = await getSiteSettings();
  const initialData = await getDashboardData();

  return (
    <DashboardClient 
      initialData={initialData} 
      companyName={settings.company_name} 
    />
  );
}
