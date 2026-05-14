"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { convertToWebP, convertToPNG, getExtForType, getOldFilePaths } from "@/lib/image-utils";
import Image from "next/image";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FaqInsights from "@/components/admin/FaqInsights";

type PixKeyEntry = { type: string; key: string; label: string };
type HeroStatEntry = { number: string; label: string; iconPath: string };
type DriverContactEntry = { id: string; label: string; number: string; whatsapp: boolean };
type ChecklistItem = { id: string; label: string };
type SocialLinkEntry = { id: string; platform: string; name: string; url: string; isActive: boolean; };
type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
};

const PIX_KEY_TYPES = [
  { value: "TELEFONE", label: "Telefone" },
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "CHAVE_ALEATORIA", label: "Chave Aleatória" },
];

const ICON_OPTIONS = [
  { label: "Calendário", value: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Pessoas", value: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Localização", value: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
  { label: "Estrela", value: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { label: "Coração", value: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Troféu", value: "M5 3h14l-1.5 6H6.5L5 3zM9 3v-1a1 1 0 011-1h4a1 1 0 011 1v1M12 9v6m-3 0h6m-8 4h10a1 1 0 001-1v-1H6v1a1 1 0 001 1z" },
  { label: "Check", value: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "Ônibus", value: "M8 17h.01M16 17h.01M9 11h6M4 7h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Globo", value: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Gráfico", value: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
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
  // Outros
  cancellation_policy_text: string;
  whatsapp_support_numbers: string[];
  driver_contact_numbers: DriverContactEntry[];
  driver_checklist_items: ChecklistItem[];
  contact_email: string;
  operating_hours: string;
  administrative_address: string;
  hold_ttl_hours: number;
  hero_stats: HeroStatEntry[];
  social_links: SocialLinkEntry[];
  // Dynamic images
  logo_url: string | null;
  hero_image_url: string | null;
  login_image_url: string | null;
  signup_image_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  faq_items: FaqItem[];
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
      // 1. Convert image: logo → PNG (PDF compatibility), others → WebP
      const processed = field.key === "logo_url"
        ? await convertToPNG(file)
        : await convertToWebP(file);
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
        toast.error("Erro ao fazer upload: " + error.message);
        return;
      }

      // 4. Get public URL with cache buster
      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(path);

      const url = urlData.publicUrl;
      onUploaded(url);
    } catch (err) {
      toast.error("Erro ao processar imagem: " + (err instanceof Error ? err.message : "Erro desconhecido"));
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

function SortableSocialItem({
  link,
  index,
  total,
  updateSocialLink,
  removeSocialLink,
  moveSocialLink,
}: {
  link: SocialLinkEntry;
  index: number;
  total: number;
  updateSocialLink: (index: number, field: keyof SocialLinkEntry, value: any) => void;
  removeSocialLink: (index: number) => void;
  moveSocialLink: (index: number, direction: -1 | 1) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center p-3 sm:p-4 bg-surface rounded-xl border ${isDragging ? 'border-primary shadow-lg' : 'border-outline-variant/30'}`}>
      
      {/* ZONA PRINCIPAL: Drag Handle + Inputs */}
      <div className="flex gap-2 sm:gap-3 w-full sm:flex-1">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab text-on-surface-variant hover:text-on-surface p-1 touch-none shrink-0 mt-[22px] sm:mt-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
        </div>

        {/* Inputs */}
        <div className="flex-1 flex flex-col sm:grid sm:grid-cols-11 gap-2 w-full">
          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Plataforma</label>
            <select
              value={link.platform}
              onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-xl px-2 py-2 text-sm focus:border-primary outline-none"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X (Twitter)</option>
              <option value="telegram">Telegram</option>
              <option value="other">Outro / Site</option>
            </select>
          </div>
          {link.platform === 'other' && (
            <div className="sm:col-span-3">
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">Rótulo do Link</label>
              <input
                type="text"
                value={link.name || ""}
                onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                placeholder="Ex: Acessar link"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          )}
          <div className={link.platform === 'other' ? "sm:col-span-5" : "sm:col-span-8"}>
            <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">URL Completa</label>
            <input
              type="text"
              value={link.url}
              onChange={(e) => updateSocialLink(index, "url", e.target.value)}
              placeholder="https://"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* ZONA DE CONTROLES: Ativo + Botões */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 mt-1 border-t border-outline-variant/20 sm:border-0 sm:pt-0 sm:mt-0 shrink-0">
        <label className="flex items-center gap-2 cursor-pointer sm:mr-2">
          <input type="checkbox" checked={link.isActive} onChange={(e) => updateSocialLink(index, "isActive", e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary" />
          <span className="text-sm font-medium sm:text-xs sm:font-normal">Ativo</span>
        </label>

        <div className="flex sm:flex-col gap-1.5 sm:gap-1 shrink-0">
          <button type="button" onClick={() => moveSocialLink(index, -1)} disabled={index === 0} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para cima">
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button type="button" onClick={() => moveSocialLink(index, 1)} disabled={index === total - 1} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para baixo">
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button type="button" onClick={() => removeSocialLink(index)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover">
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

    </div>
  );
}

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
        let numbers: string[] = [];
        try {
          if (Array.isArray(data.whatsapp_support_numbers)) {
            numbers = data.whatsapp_support_numbers;
          } else if (typeof data.whatsapp_support_numbers === 'string') {
            numbers = JSON.parse(data.whatsapp_support_numbers);
          }
        } catch { }

        let pixKeys: PixKeyEntry[] = [];
        try {
          if (Array.isArray(data.pix_keys)) {
            pixKeys = data.pix_keys as PixKeyEntry[];
          } else if (typeof data.pix_keys === 'string') {
            pixKeys = JSON.parse(data.pix_keys);
          }
        } catch { }

        let heroStats: HeroStatEntry[] = [];
        try {
          if (Array.isArray(data.hero_stats)) {
            heroStats = data.hero_stats as HeroStatEntry[];
          } else if (typeof data.hero_stats === 'string') {
            heroStats = JSON.parse(data.hero_stats);
          }
        } catch { }

        let driverContacts: DriverContactEntry[] = [];
        try {
          if (Array.isArray(data.driver_contact_numbers)) {
            driverContacts = data.driver_contact_numbers as DriverContactEntry[];
          } else if (typeof data.driver_contact_numbers === 'string') {
            driverContacts = JSON.parse(data.driver_contact_numbers);
          }
        } catch { }

        let checklistItems: ChecklistItem[] = [];
        try {
          if (Array.isArray(data.driver_checklist_items)) {
            checklistItems = data.driver_checklist_items as ChecklistItem[];
          } else if (typeof data.driver_checklist_items === 'string') {
            checklistItems = JSON.parse(data.driver_checklist_items);
          }
        } catch { }

        let socialLinks: SocialLinkEntry[] = [];
        try {
          if (Array.isArray(data.social_links)) {
            socialLinks = data.social_links as SocialLinkEntry[];
          } else if (typeof data.social_links === 'string') {
            socialLinks = JSON.parse(data.social_links);
          }
        } catch { }

        let faqItems: FaqItem[] = [];
        try {
          if (Array.isArray(data.faq_items)) {
            faqItems = data.faq_items as FaqItem[];
          } else if (typeof data.faq_items === 'string') {
            faqItems = JSON.parse(data.faq_items);
          }
        } catch { }

        setSettings({
          ...data,
          whatsapp_support_numbers: numbers.length > 0 ? numbers : [""],
          driver_contact_numbers: driverContacts,
          driver_checklist_items: checklistItems,
          social_links: socialLinks,
          faq_items: faqItems,
          pix_keys: pixKeys,
          hero_stats: heroStats,
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
          company_name: "Partiu Turismo",
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
          driver_contact_numbers: [],
          driver_checklist_items: [],
          social_links: [],
          hold_ttl_hours: 24,
          hero_stats: [],
          logo_url: null,
          hero_image_url: null,
          login_image_url: null,
          signup_image_url: null,
          favicon_url: null,
          og_image_url: null,
          faq_items: [],
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
      whatsapp_support_numbers: JSON.stringify(settings.whatsapp_support_numbers),
      pix_keys: JSON.stringify(settings.pix_keys),
      hero_stats: JSON.stringify(settings.hero_stats),
      driver_contact_numbers: JSON.stringify(settings.driver_contact_numbers.map(c => {
        let num = c.number.replace(/\D/g, '');
        if (num.length >= 10 && !num.startsWith('55')) num = '55' + num;
        return { ...c, number: num };
      })),
      driver_checklist_items: JSON.stringify(settings.driver_checklist_items),
      social_links: JSON.stringify(settings.social_links),
      faq_items: JSON.stringify(settings.faq_items),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("global_settings")
      .update(payload)
      .eq("id", 1);

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
  };

  const handleWhatsappChange = (value: string) => {
    if (!settings) return;
    setSettings({ ...settings, whatsapp_support_numbers: [value] });
  };

  // Driver contacts handlers
  const addDriverContact = () => {
    if (!settings) return;
    setSettings({ ...settings, driver_contact_numbers: [...settings.driver_contact_numbers, { id: crypto.randomUUID(), label: "", number: "", whatsapp: true }] });
  };

  const updateDriverContact = (index: number, field: keyof DriverContactEntry, value: any) => {
    if (!settings) return;
    const newContacts = [...settings.driver_contact_numbers];
    newContacts[index] = { ...newContacts[index], [field]: value };
    if (field === 'number') {
      newContacts[index].number = value.replace(/[^\d+]/g, '');
    }
    setSettings({ ...settings, driver_contact_numbers: newContacts });
  };

  const removeDriverContact = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, driver_contact_numbers: settings.driver_contact_numbers.filter((_, i) => i !== index) });
  };

  const addChecklistItem = () => {
    if (!settings) return;
    setSettings({ ...settings, driver_checklist_items: [...settings.driver_checklist_items, { id: crypto.randomUUID(), label: "" }] });
  };

  const updateChecklistItem = (index: number, label: string) => {
    if (!settings) return;
    const newItems = [...settings.driver_checklist_items];
    newItems[index] = { ...newItems[index], label };
    setSettings({ ...settings, driver_checklist_items: newItems });
  };

  const removeChecklistItem = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, driver_checklist_items: settings.driver_checklist_items.filter((_, i) => i !== index) });
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

  // Hero Stats handlers
  const addHeroStat = () => {
    if (!settings) return;
    setSettings({ ...settings, hero_stats: [...settings.hero_stats, { number: "", label: "", iconPath: ICON_OPTIONS[0].value }] });
  };

  const updateHeroStat = (index: number, field: keyof HeroStatEntry, value: string) => {
    if (!settings) return;
    const newStats = [...settings.hero_stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, hero_stats: newStats });
  };

  const removeHeroStat = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, hero_stats: settings.hero_stats.filter((_, i) => i !== index) });
  };

  const moveHeroStat = (index: number, direction: -1 | 1) => {
    if (!settings) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= settings.hero_stats.length) return;
    const newStats = [...settings.hero_stats];
    [newStats[index], newStats[newIndex]] = [newStats[newIndex], newStats[index]];
    setSettings({ ...settings, hero_stats: newStats });
  };

  // Social Links handlers
  const addSocialLink = () => {
    if (!settings) return;
    setSettings({ ...settings, social_links: [...settings.social_links, { id: crypto.randomUUID(), platform: "instagram", name: "", url: "", isActive: true }] });
  };

  const updateSocialLink = (index: number, field: keyof SocialLinkEntry, value: any) => {
    if (!settings) return;
    const newLinks = [...settings.social_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    
    // Automatically manage the 'name' field based on platform selection
    if (field === "platform") {
      if (value === "other" && (!newLinks[index].name || newLinks[index].name.trim() === "")) {
        newLinks[index].name = "Acessar link";
      } else if (value !== "other") {
        newLinks[index].name = "";
      }
    }

    setSettings({ ...settings, social_links: newLinks });
  };

  const removeSocialLink = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, social_links: settings.social_links.filter((_, i) => i !== index) });
  };

  const moveSocialLink = (index: number, direction: -1 | 1) => {
    if (!settings) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= settings.social_links.length) return;
    const newLinks = [...settings.social_links];
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    setSettings({ ...settings, social_links: newLinks });
  };

  const handleDragEndSocial = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && settings) {
      const oldIndex = settings.social_links.findIndex(l => l.id === active.id);
      const newIndex = settings.social_links.findIndex(l => l.id === over.id);
      setSettings({
        ...settings,
        social_links: arrayMove(settings.social_links, oldIndex, newIndex),
      });
    }
  };

  // FAQ handlers
  const addFaqItem = () => {
    if (!settings) return;
    setSettings({ ...settings, faq_items: [...settings.faq_items, { id: crypto.randomUUID(), question: "", answer: "" }] });
  };

  const updateFaqItem = (index: number, field: keyof FaqItem, value: string | string[]) => {
    if (!settings) return;
    const newItems = [...settings.faq_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setSettings({ ...settings, faq_items: newItems });
  };

  const removeFaqItem = (index: number) => {
    if (!settings) return;
    setSettings({ ...settings, faq_items: settings.faq_items.filter((_, i) => i !== index) });
  };

  const moveFaqItem = (index: number, direction: -1 | 1) => {
    if (!settings) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= settings.faq_items.length) return;
    const newItems = [...settings.faq_items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setSettings({ ...settings, faq_items: newItems });
  };

  // QR Code image upload
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
      if (error) { toast.error("Erro: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
      setSettings({ ...settings, pix_qr_code_url: urlData.publicUrl });
    } catch (err) {
      toast.error("Erro ao processar: " + (err instanceof Error ? err.message : "Erro"));
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
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-on-surface font-[family-name:var(--font-display)] flex items-center gap-3">
            Configurações Globais
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gerencie imagens, chaves PIX, TTL de reservas e automações. Alterações refletem no site instantaneamente.
          </p>
        </div>
      </div>



      <form onSubmit={handleSubmit} className="space-y-8 bg-surface-container-lowest p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-outline-variant/30">

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

        {/* ESTATÍSTICAS DO HERO (Social Proof) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Estatísticas do Hero (Social Proof)
          </h2>
          <p className="text-xs text-on-surface-variant">
            Cards exibidos abaixo do hero na página inicial. Transmitem credibilidade e confiança ao visitante.
          </p>

          <div className="space-y-3">
            {settings.hero_stats.map((stat, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-surface rounded-xl border border-outline-variant/30">
                {/* Icon preview + selector */}
                <div className="flex flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stat.iconPath} />
                    </svg>
                  </div>
                  <select
                    value={ICON_OPTIONS.find(o => o.value === stat.iconPath) ? stat.iconPath : "__custom"}
                    onChange={(e) => { if (e.target.value !== "__custom") updateHeroStat(i, "iconPath", e.target.value); }}
                    className="flex-1 sm:w-[130px] bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    {ICON_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                    {!ICON_OPTIONS.find(o => o.value === stat.iconPath) && <option value="__custom">Personalizado</option>}
                  </select>
                </div>

                {/* Number + Label inputs */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">Número/Valor</label>
                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => updateHeroStat(i, "number", e.target.value)}
                      placeholder="Ex: 50+"
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant">Rótulo</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateHeroStat(i, "label", e.target.value)}
                      placeholder="Ex: Excursões realizadas"
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Actions: reorder + delete */}
                <div className="flex sm:flex-col gap-1 shrink-0">
                  <button type="button" onClick={() => moveHeroStat(i, -1)} disabled={i === 0} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para cima">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button type="button" onClick={() => moveHeroStat(i, 1)} disabled={i === settings.hero_stats.length - 1} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para baixo">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => removeHeroStat(i)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addHeroStat}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-outline-variant/40 rounded-2xl text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Adicionar Estatística
            </button>
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
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">TTL da Reserva (Horas)</label>
              <input
                type="number"
                value={settings.hold_ttl_hours}
                onChange={(e) => setSettings({ ...settings, hold_ttl_hours: parseInt(e.target.value) || 0 })}
                className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                min="1"
                required
              />
              <p className="text-xs text-on-surface-variant">Tempo até a reserva &quot;Aguardando PIX&quot; expirar.</p>
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
                onChange={(e) => setSettings({ ...settings, pix_copy_paste: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, pix_instructions: e.target.value })}
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
              <input type="text" value={settings.bank_name} onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Nubank / Inter" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Titular</label>
              <input type="text" value={settings.bank_account_holder} onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Nome Completo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">CPF/CNPJ do Titular</label>
              <input type="text" value={settings.bank_cpf} onChange={(e) => setSettings({ ...settings, bank_cpf: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Documento" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Agência</label>
              <input type="text" value={settings.bank_agency} onChange={(e) => setSettings({ ...settings, bank_agency: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: 0001" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Conta</label>
              <input type="text" value={settings.bank_account} onChange={(e) => setSettings({ ...settings, bank_account: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Com dígito" />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-sm font-semibold text-on-surface">Instruções de Transferência</label>
              <input type="text" value={settings.bank_transfer_instructions} onChange={(e) => setSettings({ ...settings, bank_transfer_instructions: e.target.value })} className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Envie o comprovante via WhatsApp..." />
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
              onChange={(e) => setSettings({ ...settings, cancellation_policy_text: e.target.value })}
              rows={4}
              className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
              placeholder="Descreva as regras de cancelamento. Visível na tela de pagamento para o cliente estar ciente."
            />
          </div>
        </section>

        {/* REDES SOCIAIS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Redes Sociais
          </h2>
          <p className="text-xs text-on-surface-variant">
            Gerencie os links das redes sociais que aparecerão no rodapé do site B2C e na página de contato. Arraste para reordenar.
          </p>

          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndSocial}
            >
              <SortableContext items={settings.social_links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                {settings.social_links.map((link, i) => (
                  <SortableSocialItem
                    key={link.id}
                    link={link}
                    index={i}
                    total={settings.social_links.length}
                    updateSocialLink={updateSocialLink}
                    removeSocialLink={removeSocialLink}
                    moveSocialLink={moveSocialLink}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {settings.social_links.length === 0 && (
              <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 text-center">
                <p className="text-sm text-on-surface-variant">Nenhuma rede social configurada.</p>
              </div>
            )}

            <button
              type="button"
              onClick={addSocialLink}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-outline-variant/40 rounded-2xl text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Adicionar Rede Social
            </button>
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
                  onChange={(e) => setSettings({ ...settings, enable_whatsapp_notifications: e.target.checked })}
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
                  onChange={(e) => setSettings({ ...settings, enable_email_marketing_sync: e.target.checked })}
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
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Ex: contato@partiuturismo.com.br"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Endereço (Sede Administrativa)</label>
                <input
                  type="text"
                  value={settings.administrative_address}
                  onChange={(e) => setSettings({ ...settings, administrative_address: e.target.value })}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Ex: Vitória - ES"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-on-surface">Horário de Atendimento</label>
                <textarea
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  rows={2}
                  className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
                  placeholder="Ex: Segunda a Sexta: 09h às 18h"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label className="text-sm font-semibold text-on-surface">Número de Suporte WhatsApp (Contato)</label>
              <input
                type="text"
                value={settings.whatsapp_support_numbers[0] || ""}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Ex: 5511999999999"
              />
            </div>
          </div>
        </section>

        {/* NÚMEROS ÚTEIS PARA O MOTORISTA */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Números Úteis para o Motorista
          </h2>
          <p className="text-xs text-on-surface-variant">
            Configure os contatos que aparecerão no app do motorista durante as viagens. O número será limpo e formatado com o DDI (55) automaticamente ao salvar.
          </p>

          <div className="space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
            {settings.driver_contact_numbers.length === 0 && (
              <p className="text-xs text-on-surface-variant italic">Nenhum número cadastrado.</p>
            )}

            {settings.driver_contact_numbers.map((contact, i) => (
              <div key={contact.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                  type="text"
                  value={contact.label}
                  onChange={(e) => updateDriverContact(i, "label", e.target.value)}
                  placeholder="Ex: Suporte para motoristas"
                  className="flex-1 w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                  minLength={2}
                />
                <input
                  type="text"
                  value={contact.number}
                  onChange={(e) => updateDriverContact(i, "number", e.target.value)}
                  placeholder="Número (Ex: 27999999999)"
                  className="flex-1 w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                  minLength={10}
                />
                <label className="flex items-center gap-2 text-sm font-semibold text-on-surface whitespace-nowrap px-2">
                  <input
                    type="checkbox"
                    checked={contact.whatsapp}
                    onChange={(e) => updateDriverContact(i, "whatsapp", e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary focus:ring-2"
                  />
                  WhatsApp?
                </label>
                <button type="button" onClick={() => removeDriverContact(i)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover contato">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}

            <button type="button" onClick={addDriverContact} className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all mt-2">
              + Adicionar número
            </button>
          </div>
        </section>

        {/* PERGUNTAS DA VISTORIA DO ÔNIBUS */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
            Perguntas da Vistoria do Ônibus
          </h2>
          <p className="text-xs text-on-surface-variant">
            Configure as perguntas que os motoristas deverão responder ao realizar a vistoria da excursão. As respostas são de &quot;Sim&quot; ou &quot;Não&quot;.
          </p>

          <div className="space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
            {settings.driver_checklist_items.length === 0 && (
              <p className="text-xs text-on-surface-variant italic">Nenhuma pergunta cadastrada.</p>
            )}

            {settings.driver_checklist_items.map((item, i) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateChecklistItem(i, e.target.value)}
                  placeholder="Ex: Ar-condicionado funcionando?"
                  className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
                <button type="button" onClick={() => removeChecklistItem(i)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover pergunta">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}

            <button type="button" onClick={addChecklistItem} className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all mt-2">
              + Adicionar pergunta
            </button>
          </div>
        </section>

        {/* CENTRAL DE AJUDA / FAQ */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Central de Ajuda / FAQ
          </h2>
          <p className="text-xs text-on-surface-variant">
            Perguntas e respostas que aparecerão na Central de Ajuda do cliente.
          </p>

          <FaqInsights />

          <div className="space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
            {settings.faq_items.length === 0 && (
              <p className="text-xs text-on-surface-variant italic">Nenhuma pergunta cadastrada.</p>
            )}

            {settings.faq_items.map((item, i) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-surface rounded-xl border border-outline-variant/30">
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => updateFaqItem(i, "question", e.target.value)}
                    placeholder="Pergunta (Ex: Como funciona o cancelamento?)"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
                    placeholder="Resposta detalhada"
                    rows={2}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                    required
                  />
                  <input
                    type="text"
                    value={item.keywords?.join(", ") || ""}
                    onChange={(e) => updateFaqItem(i, "keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))}
                    placeholder="Palavras-chave separadas por vírgula (Ocultas do cliente, melhoram a busca)"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 border-dashed rounded-xl px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                
                {/* Actions: reorder + delete */}
                <div className="flex sm:flex-col gap-1 shrink-0 mt-2 sm:mt-0">
                  <button type="button" onClick={() => moveFaqItem(i, -1)} disabled={i === 0} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para cima">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button type="button" onClick={() => moveFaqItem(i, 1)} disabled={i === settings.faq_items.length - 1} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30" title="Mover para baixo">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => removeFaqItem(i)} className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors" title="Remover pergunta">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addFaqItem} className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-outline-variant/40 rounded-xl text-sm font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all mt-2">
              + Adicionar Pergunta ao FAQ
            </button>
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
