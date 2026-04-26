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
  const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string}[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{path: string, url: string}[]>([]);

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
          
          if (report.photo_paths && report.photo_paths.length > 0) {
            const photosWithUrls = await Promise.all(
              report.photo_paths.map(async (path: string) => {
                const { data } = await supabase.storage.from("excursion-reports").createSignedUrl(path, 3600);
                return { path, url: data?.signedUrl || "" };
              })
            );
            setExistingPhotos(photosWithUrls.filter(p => p.url !== ""));
          }
          
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: {file: File, preview: string}[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`Formato inválido ignorado: ${file.name}`);
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    // Reset input so the same files can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let uploadedPaths: string[] = [];

      // Upload photos if selected
      if (selectedFiles.length > 0) {
        setIsUploading(true);

        for (let i = 0; i < selectedFiles.length; i++) {
          const { file: selectedFile } = selectedFiles[i];
          
          // Compress and convert to webp
          let fileToUpload: File | Blob = selectedFile;
          try {
            fileToUpload = await imageCompression(selectedFile, {
              maxSizeMB: 4.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: "image/webp",
            });
          } catch (compErr) {
            console.error("Erro ao comprimir imagem:", compErr);
          }

          if (fileToUpload.size > 10 * 1024 * 1024) {
            toast.error(`A imagem ${selectedFile.name} ainda é muito grande. Tente com menor resolução.`);
            continue; // Skip this file but continue others
          }

          const fileName = `${Date.now()}_${i}.webp`;
          const path = `reports/${excursionId}/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("excursion-reports")
            .upload(path, fileToUpload, { upsert: true });

          if (uploadError) {
            console.error("Erro ao enviar:", uploadError);
            toast.error(`Erro ao enviar ${selectedFile.name}`);
          } else {
            uploadedPaths.push(path);
          }
        }
        setIsUploading(false);
      }

      const allPhotoPaths = [
        ...existingPhotos.map(p => p.path),
        ...uploadedPaths
      ];

      const payload = {
        excursion_id: excursionId,
        driver_id: user.id,
        checklist_results: results,
        observations: observations,
        photo_paths: allPhotoPaths,
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

          {/* Fotos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-on-surface">Fotos do Ocorrido</label>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
              >
                + Adicionar Fotos
              </button>
            </div>
            
            {(existingPhotos.length > 0 || selectedFiles.length > 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Existing Photos */}
                {existingPhotos.map((photo, index) => (
                  <div key={`exist-${index}`} className="relative rounded-xl overflow-hidden border border-outline-variant aspect-square bg-surface-container-high group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="Foto existente" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">Enviada</div>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(index)}
                      className="absolute top-1 left-1 bg-error/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {/* New Selected Photos */}
                {selectedFiles.map((fileObj, index) => (
                  <div key={`new-${index}`} className="relative rounded-xl overflow-hidden border border-primary/50 aspect-square bg-surface-container-high group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileObj.preview} alt="Nova foto" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow">Nova</div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="absolute top-1 left-1 bg-error/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <Camera className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Tirar foto ou anexar imagens</span>
                <span className="text-xs opacity-70">Qualquer formato (compressão automática)</span>
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
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
