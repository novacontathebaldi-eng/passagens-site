"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

type ChecklistItem = { id: string; label: string };

interface VistoriaFormProps {
  excursionId: string;
  onStatusChange: (isCompleted: boolean) => void;
}

export default function VistoriaForm({ excursionId, onStatusChange }: VistoriaFormProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [observations, setObservations] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch settings
        const { data: settings } = await supabase
          .from("global_settings")
          .select("driver_checklist_items")
          .single();

        let parsedItems: ChecklistItem[] = [];
        if (settings?.driver_checklist_items) {
          if (Array.isArray(settings.driver_checklist_items)) {
            parsedItems = settings.driver_checklist_items;
          } else if (typeof settings.driver_checklist_items === "string") {
            try {
              parsedItems = JSON.parse(settings.driver_checklist_items);
            } catch (e) {}
          }
        }
        setItems(parsedItems);

        // 2. Fetch existing report
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: report } = await supabase
          .from("excursion_reports")
          .select("*")
          .eq("excursion_id", excursionId)
          .eq("driver_id", user.id)
          .maybeSingle();

        if (report) {
          setExistingReport(report);
          setResults(report.checklist_results || {});
          setObservations(report.observations || "");
          onStatusChange(true);
        } else {
          onStatusChange(false);
          // Initialize results with true for all items
          const initial: Record<string, boolean> = {};
          parsedItems.forEach((i) => (initial[i.id] = true));
          setResults(initial);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [excursionId, supabase, onStatusChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Formato inválido. Envie apenas JPG ou PNG.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let photoPath = null;

      // Upload photo if selected
      if (selectedFile) {
        setIsUploading(true);

        // Compress if over 5MB
        let fileToUpload: File | Blob = selectedFile;
        if (selectedFile.size > 5 * 1024 * 1024) {
          try {
            fileToUpload = await imageCompression(selectedFile, {
              maxSizeMB: 4.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
          } catch (compErr) {
            console.error("Erro ao comprimir imagem:", compErr);
            // Fallback: try uploading original
          }
        }

        const ext = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const path = `reports/${excursionId}/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("excursion-reports")
          .upload(path, fileToUpload, { upsert: true });

        if (uploadError) throw new Error("Erro ao enviar foto: " + uploadError.message);
        photoPath = path;
        setIsUploading(false);
      }

      const payload = {
        excursion_id: excursionId,
        driver_id: user.id,
        checklist_results: results,
        observations: observations,
        ...(photoPath && { photo_path: photoPath }),
      };

      if (existingReport) {
        const { error } = await supabase
          .from("excursion_reports")
          .update(payload)
          .eq("id", existingReport.id);
        if (error) throw error;
        toast.success("Ocorrências atualizadas com sucesso!");
      } else {
        const { error } = await supabase
          .from("excursion_reports")
          .insert(payload);
        if (error) throw error;
        toast.success("Ocorrências enviadas com sucesso!");
        onStatusChange(true);
        setExistingReport(payload); // Mock for UI
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao salvar.");
      setIsUploading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-on-surface">Vistoria e Ocorrências</h2>
          <p className="text-sm text-on-surface-variant">
            Preencha este relatório para registrar o estado do veículo e relatar qualquer imprevisto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggles */}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-sm font-medium text-on-surface pr-4 leading-tight">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => setResults({ ...results, [item.id]: !results[item.id] })}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      results[item.id] ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        results[item.id] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Observações Adicionais</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Algum problema no ar-condicionado? Alguém se atrasou muito? Anote aqui."
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-y"
            />
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Foto (Opcional)</label>
            
            {existingReport?.photo_path && !previewUrl ? (
              <div className="p-4 bg-surface border border-outline-variant rounded-xl flex items-center justify-between">
                <span className="text-sm text-on-surface-variant flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" /> Foto já enviada
                </span>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary font-bold">Trocar</button>
              </div>
            ) : previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant aspect-video bg-surface-container-high">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-3 py-1.5 rounded-lg text-sm font-bold shadow"
                >
                  Trocar foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <Camera className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Tirar foto do problema</span>
                <span className="text-xs opacity-70">JPG ou PNG (compressão automática)</span>
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold shadow flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUploading ? "Enviando foto..." : "Salvando..."}
              </>
            ) : (
              existingReport ? "Atualizar Relatório" : "Enviar Relatório"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
