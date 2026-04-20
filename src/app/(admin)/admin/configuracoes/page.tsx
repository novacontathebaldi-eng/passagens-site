"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type GlobalSettings = {
  id: number;
  company_name: string;
  enable_whatsapp_notifications: boolean;
  enable_email_marketing_sync: boolean;
  pix_key: string;
  pix_qr_code_url: string;
  pix_instructions: string;
  whatsapp_support_numbers: string[]; // Simplification from JSONB for UI array
  hold_ttl_hours: number;
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (data) {
        // Handle JSONB to array for whatsapp numbers
        let numbers = [];
        try {
          if (Array.isArray(data.whatsapp_support_numbers)) {
             numbers = data.whatsapp_support_numbers;
          } else if (typeof data.whatsapp_support_numbers === 'string') {
             numbers = JSON.parse(data.whatsapp_support_numbers);
          }
        } catch(e) {}

        setSettings({ ...data, whatsapp_support_numbers: numbers });
      } else if (error && error.code === 'PGRST116') {
        // Row doesn't exist, set defaults (Ideally this is seeded in DB)
        setSettings({
          id: 1,
          company_name: "ViajaEdu!",
          enable_whatsapp_notifications: true,
          enable_email_marketing_sync: true,
          pix_key: "",
          pix_qr_code_url: "",
          pix_instructions: "Envie o comprovante no WhatsApp",
          whatsapp_support_numbers: [""],
          hold_ttl_hours: 24
        });
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);

    const payload = {
      ...settings,
      whatsapp_support_numbers: JSON.stringify(settings.whatsapp_support_numbers)
    };

    // Upsert the record (id=1)
    const { error } = await supabase
      .from("global_settings")
      .upsert(payload, { onConflict: "id" });

    setIsSaving(false);

    if (error) {
      alert("Erro ao salvar configurações: " + error.message);
    } else {
      alert("Configurações globais salvas com sucesso!");
    }
  };

  const handleWhatsappChange = (index: number, value: string) => {
    if (!settings) return;
    const newNumbers = [...settings.whatsapp_support_numbers];
    newNumbers[index] = value;
    setSettings({ ...settings, whatsapp_support_numbers: newNumbers });
  };

  const addWhatsappNumber = () => {
    if (!settings) return;
    setSettings({ ...settings, whatsapp_support_numbers: [...settings.whatsapp_support_numbers, ""] });
  };

  if (isLoading) return <div className="p-8">Carregando configurações...</div>;
  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Configurações Globais
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Gerencie chaves PIX, TTL de reservas e automações do sistema. Alterações aqui refletem no site inteiro instantaneamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30">
        
        {/* IDENTIDADE E BÁSICO */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2">Identidade e Geral</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Nome da Empresa</label>
              <input 
                type="text" 
                value={settings.company_name}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">TTL da Reserva (Horas)</label>
              <input 
                type="number" 
                value={settings.hold_ttl_hours}
                onChange={(e) => setSettings({...settings, hold_ttl_hours: parseInt(e.target.value)})}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                min="1"
                required
              />
              <p className="text-xs text-on-surface-variant">Tempo até a reserva "Aguardando PIX" expirar e voltar para o estoque.</p>
            </div>
          </div>
        </section>

        {/* PAGAMENTO E PIX */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2">Pagamento B2C (PIX)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Chave PIX (Copia e Cola)</label>
              <input 
                type="text" 
                value={settings.pix_key}
                onChange={(e) => setSettings({...settings, pix_key: e.target.value})}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Ex: 12.345.678/0001-90"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">URL do QR Code PIX Estático (Imagem)</label>
              <input 
                type="url" 
                value={settings.pix_qr_code_url}
                onChange={(e) => setSettings({...settings, pix_qr_code_url: e.target.value})}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-on-surface">Instruções de Pagamento</label>
              <textarea 
                value={settings.pix_instructions}
                onChange={(e) => setSettings({...settings, pix_instructions: e.target.value})}
                rows={3}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Ex: Efetue o PIX e envie o comprovante via WhatsApp informando o número do pedido."
              />
            </div>
          </div>
        </section>

        {/* COMUNICAÇÃO E NOTIFICAÇÕES */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2">Comunicação e Notificações</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex gap-4 items-center p-4 bg-surface rounded-xl border border-outline-variant/30">
              <div className="flex items-center h-5">
                <input
                  id="whatsapp_notif"
                  type="checkbox"
                  checked={settings.enable_whatsapp_notifications}
                  onChange={(e) => setSettings({...settings, enable_whatsapp_notifications: e.target.checked})}
                  className="w-5 h-5 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="whatsapp_notif" className="text-sm font-semibold text-on-surface cursor-pointer">
                  Habilitar Notificações via WhatsApp (Sistema)
                </label>
                <p className="text-xs text-on-surface-variant">Envia mensagens automáticas de aprovação e vouchers via bot do WhatsApp.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 bg-surface rounded-xl border border-outline-variant/30">
              <div className="flex items-center h-5">
                <input
                  id="email_mkt"
                  type="checkbox"
                  checked={settings.enable_email_marketing_sync}
                  onChange={(e) => setSettings({...settings, enable_email_marketing_sync: e.target.checked})}
                  className="w-5 h-5 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="email_mkt" className="text-sm font-semibold text-on-surface cursor-pointer">
                  Sincronizar E-mails com Brevo (Marketing)
                </label>
                <p className="text-xs text-on-surface-variant">Adiciona clientes que aceitaram marketing à lista no Brevo automaticamente.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface">Números de Suporte WhatsApp (Contato)</label>
              <div className="space-y-2">
                {settings.whatsapp_support_numbers.map((num, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text" 
                      value={num}
                      onChange={(e) => handleWhatsappChange(i, e.target.value)}
                      className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Ex: 5511999999999"
                    />
                    {i === settings.whatsapp_support_numbers.length - 1 && (
                      <button type="button" onClick={addWhatsappNumber} className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-primary hover:bg-primary-dark text-on-primary px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
