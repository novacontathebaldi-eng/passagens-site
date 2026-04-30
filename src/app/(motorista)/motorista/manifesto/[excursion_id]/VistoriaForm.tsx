"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, CheckCircle2, Loader2, ImagePlus, X } from "lucide-react";
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
    <div className="space-y-6">
      <div className="bg-surface-container-lowest border border-outline-variant/30 md:p-6 p-5 rounded-3xl shadow-[0_8px_30px_rgb(25,28,30,0.04)]">
        <div className="mb-6">
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Relatório Operacional</h2>
          <p className="font-body text-sm text-on-surface-variant">
            Preencha este relatório para registrar o estado do veículo e relatar qualquer imprevisto da viagem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Toggles */}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:border-outline-variant/40">
                  <span className="text-[15px] font-headline font-bold text-on-surface pr-4 leading-tight">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => setResults({ ...results, [item.id]: !results[item.id] })}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 ${
                      results[item.id] ? "bg-success" : "bg-surface-container-high border-outline-variant/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-out ${
                        results[item.id] ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observações Adicionais</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Algum problema no ar-condicionado? Alguém se atrasou muito? Anote aqui."
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-5 py-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px] resize-y transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            />
          </div>

          {/* Fotos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fotos do Ocorrido</label>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Adicionar Fotos
              </button>
            </div>
            
            {(existingPhotos.length > 0 || selectedFiles.length > 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Existing Photos */}
                {existingPhotos.map((photo, index) => (
                  <div key={`exist-${index}`} className="relative rounded-2xl overflow-hidden border border-outline-variant/50 aspect-square bg-surface-container-high group shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="Foto existente" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">Salvo</div>
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(index)}
                      className="absolute top-2 right-2 bg-white/90 text-error hover:bg-error hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* New Selected Photos */}
                {selectedFiles.map((fileObj, index) => (
                  <div key={`new-${index}`} className="relative rounded-2xl overflow-hidden border-2 border-primary/40 aspect-square bg-surface-container-high group shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileObj.preview} alt="Nova foto" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full shadow backdrop-blur-md">Nova</div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="absolute top-2 right-2 bg-white/90 text-error hover:bg-error hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 border-2 border-dashed border-outline-variant/60 rounded-3xl flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-surface-container-high group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="block text-sm font-bold mb-1">Tirar foto ou anexar imagens</span>
                  <span className="block text-xs opacity-70 font-body">Qualquer formato (compressão automática)</span>
                </div>
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
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary py-4 rounded-full font-bold shadow-[0_8px_20px_rgb(30,64,175,0.3)] flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-all text-sm md:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isUploading ? "Enviando foto..." : "Salvando..."}
                </>
              ) : existingReport ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Atualizar Relatório
                </>
              ) : (
                "Enviar Relatório"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
