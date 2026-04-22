"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { convertToWebP, getExtForType, getOldFilePaths } from "@/lib/image-utils";
import Image from "next/image";

type PixKeyEntry = { type: string; key: string; label: string };

const PIX_KEY_TYPES = [
  { value: "TELEFONE", label: "Telefone" },
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "CHAVE_ALEATORIA", label: "Chave Aleatória" },
];

type GlobalSettings = {
  id: number;
  company_name: string;
  enable_whatsapp_notifications: boolean;
  enable_email_marketing_sync: boolean;
  // PIX
  pix_key: string;
  pix_key_type: string;
  pix_keys: PixKeyEntry[];
  pix_copy_paste: string;
  pix_qr_code_url: string;
  pix_instructions: string;
  // Bank
  bank_name: string;
  bank_account_holder: string;
  bank_cpf: string;
  bank_agency: string;
  bank_account: string;
  bank_transfer_instructions: string;
  // Other
  cancellation_policy_text: string;
  whatsapp_support_numbers: string[];
  contact_email: string;
  operating_hours: string;
  administrative_address: string;
  hold_ttl_hours: number;
  // Dynamic images
  logo_url: string | null;
  hero_image_url: string | null;
  login_image_url: string | null;
  signup_image_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
};

const IMAGE_FIELDS = [
  { key: "logo_url" as const, label: "Logo do Site", help: "Exibido no header, footer e favicon. Recomendado: PNG/SVG com fundo transparente.", accept: "image/png,image/svg+xml,image/webp" },
  { key: "hero_image_url" as const, label: "Imagem do Hero (Home)", help: "Fundo da seção principal da página inicial. Recomendado: 1920×1080px.", accept: "image/jpeg,image/png,image/webp" },
  { key: "login_image_url" as const, label: "Imagem do Login", help: "Painel lateral da página de login. Recomendado: 800×1200px.", accept: "image/jpeg,image/png,image/webp" },
  { key: "signup_image_url" as const, label: "Imagem do Cadastro", help: "Painel lateral da página de cadastro. Recomendado: 800×1200px.", accept: "image/jpeg,image/png,image/webp" },
  { key: "favicon_url" as const, label: "Favicon", help: "Ícone da aba do navegador. Recomendado: 32×32px PNG.", accept: "image/png,image/svg+xml,image/x-icon" },
  { key: "og_image_url" as const, label: "Imagem OG (WhatsApp/Redes)", help: "Preview ao compartilhar links. Recomendado: 1200×630px.", accept: "image/jpeg,image/png,image/webp" },
];

function ImageUploader({
  field,
  currentUrl,
  onUploaded,
}: {
  field: (typeof IMAGE_FIELDS)[number];
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Convert to WebP (preserves transparency; SVG/ICO pass through)
      const processed = await convertToWebP(file);
      const ext = getExtForType(processed);
      const path = `site/${field.key}.${ext}`;

      // 2. Clean up ALL old files with any extension (prevents bucket bloat)
      const oldPaths = getOldFilePaths(field.key);
      await supabase.storage.from("assets").remove(oldPaths);

      // 3. Upload the new file
      const { error } = await supabase.storage
        .from("assets")
        .upload(path, processed, { upsert: true, cacheControl: "3600" });

      if (error) {
        alert("Erro ao fazer upload: " + error.message);
        return;
      }

      // 4. Get public URL with cache buster
      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?v=${Date.now()}`;
      onUploaded(url);
    } catch (err) {
      alert("Erro ao processar imagem: " + (err instanceof Error ? err.message : "Erro desconhecido"));
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-surface rounded-xl border border-outline-variant/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">{field.label}</p>
          <p className="text-xs text-on-surface-variant">{field.help}</p>
        </div>
        {currentUrl && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container shrink-0 ml-3">
            <Image
              src={currentUrl}
              alt={field.label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          ref={inputRef}
          type="file"
          accept={field.accept}
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="text-sm font-medium px-4 py-2 rounded-xl bg-primary-container/40 text-primary hover:bg-primary-container/60 transition-all disabled:opacity-50"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : currentUrl ? (
            "Trocar imagem"
          ) : (
            "Enviar imagem"
          )}
        </button>
        {currentUrl && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Configurado
          </span>
        )}
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (data) {
        let numbers: string[] = [];
        try {
          if (Array.isArray(data.whatsapp_support_numbers)) {
             numbers = data.whatsapp_support_numbers;
          } else if (typeof data.whatsapp_support_numbers === 'string') {
             numbers = JSON.parse(data.whatsapp_support_numbers);
          }
        } catch(e) {}

        let pixKeys: PixKeyEntry[] = [];
        try {
          if (Array.isArray(data.pix_keys)) {
            pixKeys = data.pix_keys as PixKeyEntry[];
          } else if (typeof data.pix_keys === 'string') {
            pixKeys = JSON.parse(data.pix_keys);
          }
        } catch(e) {}

        setSettings({
          ...data,
          whatsapp_support_numbers: numbers.length > 0 ? numbers : [""],
          pix_keys: pixKeys,
          pix_key: data.pix_key ?? "",
          pix_key_type: data.pix_key_type ?? "TELEFONE",
          pix_copy_paste: data.pix_copy_paste ?? "",
          pix_qr_code_url: data.pix_qr_code_url ?? "",
          pix_instructions: data.pix_instructions ?? "",
          bank_name: data.bank_name ?? "",
          bank_account_holder: data.bank_account_holder ?? "",
          bank_cpf: data.bank_cpf ?? "",
          bank_agency: data.bank_agency ?? "",
          bank_account: data.bank_account ?? "",
          bank_transfer_instructions: data.bank_transfer_instructions ?? "",
          cancellation_policy_text: data.cancellation_policy_text ?? "",
          contact_email: data.contact_email ?? "",
          operating_hours: data.operating_hours ?? "",
          administrative_address: data.administrative_address ?? "",
        });
      } else if (error && error.code === 'PGRST116') {
        setSettings({
          id: 1,
          company_name: "ViajaEdu!",
          enable_whatsapp_notifications: true,
          enable_email_marketing_sync: true,
          pix_key: "",
          pix_key_type: "TELEFONE",
          pix_keys: [],
          pix_copy_paste: "",
          pix_qr_code_url: "",
          pix_instructions: "Envie o comprovante no WhatsApp",
          bank_name: "",
          bank_account_holder: "",
          bank_cpf: "",
          bank_agency: "",
          bank_account: "",
          bank_transfer_instructions: "",
          cancellation_policy_text: "",
          contact_email: "",
          operating_hours: "",
          administrative_address: "",
          whatsapp_support_numbers: [""],
          hold_ttl_hours: 24,
          logo_url: null,
          hero_image_url: null,
          login_image_url: null,
          signup_image_url: null,
          favicon_url: null,
          og_image_url: null,
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
    setSaveMsg(null);

    const payload = {
      ...settings,
      whatsapp_support_numbers: JSON.stringify(settings.whatsapp_support_numbers),
      pix_keys: JSON.stringify(settings.pix_keys),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("global_settings")
      .update(payload)
      .eq("id", 1);

    setIsSaving(false);

    if (error) {
      setSaveMsg({ type: "error", text: "Erro ao salvar: " + error.message });
    } else {
      setSaveMsg({ type: "ok", text: "Configurações salvas com sucesso!" });
      setTimeout(() => setSaveMsg(null), 4000);
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

  // PIX Keys handlers
  const addPixKey = () => {
    if (!settings) return;
    setSettings({ ...settings, pix_keys: [...settings.pix_keys, { type: "TELEFONE", key: "", label: "Telefone" }] });
  };

  const updatePixKey = (index: number, field: keyof PixKeyEntry, value: string) => {
    if (!settings) return;
    const newKeys = [...settings.pix_keys];
    newKeys[index] = { ...newKeys[index], [field]: value };
    if (field === "type") {
      newKeys[index].label = PIX_KEY_TYPES.find(t => t.value === value)?.label ?? value;
    }
    setSettings({ ...settings, pix_keys: newKeys });
  };

  const removePixKey = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, pix_keys: settings.pix_keys.filter((_, i) => i !== index) });
  };

  // QR Code image upload
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setIsUploadingQr(true);
    try {
      const processed = await convertToWebP(file);
      const ext = getExtForType(processed);
      const path = `site/pix_qr_code.${ext}`;
      const oldPaths = getOldFilePaths("pix_qr_code");
      await supabase.storage.from("assets").remove(oldPaths);
      const { error } = await supabase.storage.from("assets").upload(path, processed, { upsert: true, cacheControl: "3600" });
      if (error) { alert("Erro: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
      setSettings({ ...settings, pix_qr_code_url: `${urlData.publicUrl}?v=${Date.now()}` });
    } catch (err) {
      alert("Erro ao processar: " + (err instanceof Error ? err.message : "Erro"));
    } finally {
      setIsUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
    }
  };

  const handleImageUploaded = (field: keyof GlobalSettings, url: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: url });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Carregando configurações...
      </div>
    );
  }
  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Configurações Globais
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Gerencie imagens, chaves PIX, TTL de reservas e automações. Alterações refletem no site instantaneamente.
        </p>
      </div>

      {/* Success/Error Message */}
      {saveMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          saveMsg.type === "ok" 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {saveMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30">
        
        {/* IMAGENS DO SITE */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Imagens e Branding
          </h2>
          <p className="text-xs text-on-surface-variant">
            Todas as imagens são armazenadas no Supabase Storage e aparecem no site em tempo real.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IMAGE_FIELDS.map((field) => (
              <ImageUploader
                key={field.key}
                field={field}
                currentUrl={settings[field.key]}
                onUploaded={(url) => handleImageUploaded(field.key, url)}
              />
            ))}
          </div>
        </section>

        {/* IDENTIDADE E BÁSICO */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Identidade e Geral
          </h2>
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
              <p className="text-xs text-on-surface-variant">Tempo até a reserva "Aguardando PIX" expirar.</p>
            </div>
          </div>
        </section>

        {/* PAGAMENTO E PIX */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pagamento B2C (PIX)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Chaves PIX */}
            <div className="sm:col-span-2 space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-on-surface">Chaves PIX Disponíveis</label>
                <button type="button" onClick={addPixKey} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                  + Adicionar Chave
                </button>
              </div>
              
              {settings.pix_keys.length === 0 && (
                <p className="text-xs text-on-surface-variant italic">Nenhuma chave PIX configurada. Adicione pelo menos uma para vendas B2C.</p>
              )}

              {settings.pix_keys.map((pix, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <select 
                    value={pix.type}
                    onChange={(e) => updatePixKey(i, "type", e.target.value)}
                    className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    {PIX_KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input 
                    type="text" 
                    value={pix.key}
                    onChange={(e) => updatePixKey(i, "key", e.target.value)}
                    placeholder="Chave (ex: 123.456.789-00)"
                    className="flex-1 w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <input 
                    type="text" 
                    value={pix.label}
                    onChange={(e) => updatePixKey(i, "label", e.target.value)}
                    placeholder="Rótulo (ex: CPF do Eduardo)"
                    className="flex-1 w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  <button type="button" onClick={() => removePixKey(i)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover chave">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Código Copia e Cola (Opcional)</label>
              <textarea 
                value={settings.pix_copy_paste}
                onChange={(e) => setSettings({...settings, pix_copy_paste: e.target.value})}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-xs font-mono"
                placeholder="00020126580014br.gov.bcb.pix..."
                rows={3}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">QR Code Estático (Imagem)</label>
              <div className="flex gap-4 items-center">
                {settings.pix_qr_code_url ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0">
                    <Image src={settings.pix_qr_code_url} alt="QR Code" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-dashed border-outline-variant flex items-center justify-center bg-surface flex-shrink-0">
                    <span className="text-[10px] text-on-surface-variant text-center px-1">Sem Imagem</span>
                  </div>
                )}
                <div className="flex-1">
                  <input type="file" accept="image/png,image/jpeg,image/webp" ref={qrInputRef} onChange={handleQrUpload} className="hidden" />
                  <button type="button" onClick={() => qrInputRef.current?.click()} disabled={isUploadingQr} className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                    {isUploadingQr ? "Enviando..." : "Fazer Upload do QR"}
                  </button>
                  <p className="text-[10px] text-on-surface-variant mt-1">Recomendado: PNG Quadrado. Fica visível no checkout.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-on-surface">Instruções de Pagamento</label>
              <textarea 
                value={settings.pix_instructions}
                onChange={(e) => setSettings({...settings, pix_instructions: e.target.value})}
                rows={2}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Ex: Efetue o PIX e envie o comprovante via WhatsApp informando o número do pedido."
              />
            </div>
          </div>
        </section>

        {/* DADOS BANCÁRIOS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            Transferência Bancária (Opcional)
          </h2>
          <p className="text-xs text-on-surface-variant">Se preenchido, exibirá a opção de TED/DOC na tela de pagamento do cliente.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Banco</label>
              <input type="text" value={settings.bank_name} onChange={(e) => setSettings({...settings, bank_name: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Nubank / Inter" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Titular</label>
              <input type="text" value={settings.bank_account_holder} onChange={(e) => setSettings({...settings, bank_account_holder: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Nome Completo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">CPF/CNPJ do Titular</label>
              <input type="text" value={settings.bank_cpf} onChange={(e) => setSettings({...settings, bank_cpf: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Documento" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Agência</label>
              <input type="text" value={settings.bank_agency} onChange={(e) => setSettings({...settings, bank_agency: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: 0001" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Conta</label>
              <input type="text" value={settings.bank_account} onChange={(e) => setSettings({...settings, bank_account: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Com dígito" />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-sm font-semibold text-on-surface">Instruções de Transferência</label>
              <input type="text" value={settings.bank_transfer_instructions} onChange={(e) => setSettings({...settings, bank_transfer_instructions: e.target.value})} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Envie o comprovante via WhatsApp..." />
            </div>
          </div>
        </section>

        {/* POLÍTICA DE CANCELAMENTO */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Termos e Políticas
          </h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-on-surface">Política de Cancelamento / Reembolso</label>
            <textarea 
              value={settings.cancellation_policy_text}
              onChange={(e) => setSettings({...settings, cancellation_policy_text: e.target.value})}
              rows={4}
              className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
              placeholder="Descreva as regras de cancelamento. Visível na tela de pagamento para o cliente estar ciente."
            />
          </div>
        </section>

        {/* COMUNICAÇÃO E NOTIFICAÇÕES */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Comunicação e Notificações
          </h2>
          
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">E-mail de Contato</label>
                <input 
                  type="email" 
                  value={settings.contact_email}
                  onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Ex: contato@viajaedu.com.br"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Endereço (Sede Administrativa)</label>
                <input 
                  type="text" 
                  value={settings.administrative_address}
                  onChange={(e) => setSettings({...settings, administrative_address: e.target.value})}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Ex: Vitória - ES"
                />
              </div>
              
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-on-surface">Horário de Atendimento</label>
                <textarea 
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({...settings, operating_hours: e.target.value})}
                  rows={2}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
                  placeholder="Ex: Segunda a Sexta: 09h às 18h"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
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
            className="bg-primary hover:bg-primary-dark text-on-primary px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
