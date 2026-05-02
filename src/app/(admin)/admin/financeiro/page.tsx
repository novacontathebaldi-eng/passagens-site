import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/get-settings";
import { redirect } from "next/navigation";
import { getFinanceiroData } from "./actions";
import { FinanceiroClient } from "./FinanceiroClient";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Financeiro — Admin ${settings.company_name}`,
    robots: "noindex, nofollow",
  };
}

interface SearchParams {
  period?: string;
  [key: string]: string | string[] | undefined;
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "este_mes";
  
  const supabase = await createClient();

  // 1. Verificar Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Verificar Nível de Acesso (Apenas ADMIN pode ver o financeiro)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/admin");
  }

  // 3. Configurações Globais (Nome e Logo)
  const settings = await getSiteSettings();

  // 4. Buscar os dados via Server Action
  const initialData = await getFinanceiroData(period);

  return (
    <FinanceiroClient 
      initialData={initialData}
      period={period}
      companyName={settings.company_name}
      logoUrl={settings.logo_url || ""}
    />
  );
}
