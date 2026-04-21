"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { convertToWebP, getExtForType } from "@/lib/image-utils";
import Image from "next/image";

type TourImage = {
  id: string;
  package_id: string;
  storage_path: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_cover: boolean;
  file_size: number | null;
  mime_type: string | null;
};

type Props = {
  packageId: string;
  maxImages?: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (bucket limit)
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function TourImageManager({ packageId, maxImages = 10 }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<TourImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Load images from DB
  const loadImages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("tour_package_images")
      .select("id, package_id, storage_path, url, alt_text, position, is_cover, file_size, mime_type")
      .eq("package_id", packageId)
      .order("position", { ascending: true });

    if (fetchError) {
      setError("Erro ao carregar imagens: " + fetchError.message);
    } else {
      setImages(data || []);
    }
    setIsLoading(false);
  }, [packageId, supabase]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Validate file
  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}" não é um formato aceito. Use JPG, PNG ou WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" excede 5MB. Reduza o tamanho da imagem.`;
    }
    return null;
  }

  // Upload multiple files
  async function handleUpload(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;

    if (fileArray.length > remaining) {
      setError(`Máximo de ${maxImages} imagens. Você pode adicionar mais ${remaining}.`);
      return;
    }

    // Validate all files
    for (const f of fileArray) {
      const err = validateFile(f);
      if (err) { setError(err); return; }
    }

    setUploading(true);
    setError(null);
    let currentPosition = images.length;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress(`Enviando ${i + 1} de ${fileArray.length}...`);

      try {
        // Convert to WebP
        const processed = await convertToWebP(file);
        const ext = getExtForType(processed);
        const uniqueId = crypto.randomUUID();
        const storagePath = `roteiros/${packageId}/${uniqueId}.${ext}`;

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(storagePath, processed, {
            upsert: false,
            cacheControl: "31536000", // 1 year (immutable via UUID)
          });

        if (uploadError) {
          setError(`Erro ao enviar "${file.name}": ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("assets")
          .getPublicUrl(storagePath);

        const isCover = images.length === 0 && i === 0;

        // Insert into DB
        const { error: dbError } = await supabase
          .from("tour_package_images")
          .insert({
            package_id: packageId,
            storage_path: storagePath,
            url: urlData.publicUrl,
            position: currentPosition,
            is_cover: isCover,
            file_size: processed.size,
            mime_type: processed.type,
          });

        if (dbError) {
          // Cleanup orphaned file
          await supabase.storage.from("assets").remove([storagePath]);
          setError(`Erro ao salvar "${file.name}": ${dbError.message}`);
          continue;
        }

        currentPosition++;
      } catch (err) {
        setError(`Erro ao processar "${file.name}": ${err instanceof Error ? err.message : "Erro desconhecido"}`);
      }
    }

    setUploading(false);
    setUploadProgress("");
    if (inputRef.current) inputRef.current.value = "";
    await loadImages();
  }

  // Delete image
  async function handleDelete(img: TourImage) {
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    setError(null);

    // Remove from Storage
    await supabase.storage.from("assets").remove([img.storage_path]);

    // Remove from DB
    const { error: dbError } = await supabase
      .from("tour_package_images")
      .delete()
      .eq("id", img.id);

    if (dbError) {
      setError("Erro ao remover: " + dbError.message);
      return;
    }

    // If deleted was cover, make the next image the cover
    if (img.is_cover) {
      const remaining = images.filter(i => i.id !== img.id);
      if (remaining.length > 0) {
        await supabase
          .from("tour_package_images")
          .update({ is_cover: true })
          .eq("id", remaining[0].id);
      }
    }

    // Reorder positions
    const remaining = images
      .filter(i => i.id !== img.id)
      .sort((a, b) => a.position - b.position);

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await supabase
          .from("tour_package_images")
          .update({ position: i })
          .eq("id", remaining[i].id);
      }
    }

    await loadImages();
  }

  // Set cover
  async function handleSetCover(img: TourImage) {
    if (img.is_cover) return;
    setError(null);

    // Unset current cover
    const current = images.find(i => i.is_cover);
    if (current) {
      await supabase
        .from("tour_package_images")
        .update({ is_cover: false })
        .eq("id", current.id);
    }

    // Set new cover
    await supabase
      .from("tour_package_images")
      .update({ is_cover: true })
      .eq("id", img.id);

    await loadImages();
  }

  // Drag reorder
  function handleDragStart(idx: number) {
    setDraggedIdx(idx);
  }

  function handleDragOverItem(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newImages = [...images];
    const [moved] = newImages.splice(draggedIdx, 1);
    newImages.splice(idx, 0, moved);
    setImages(newImages);
    setDraggedIdx(idx);
  }

  async function handleDragEnd() {
    if (draggedIdx === null) return;
    setDraggedIdx(null);

    // Save new positions to DB
    for (let i = 0; i < images.length; i++) {
      if (images[i].position !== i) {
        await supabase
          .from("tour_package_images")
          .update({ position: i })
          .eq("id", images[i].id);
      }
    }
    await loadImages();
  }

  // Drop zone handlers
  function handleDropZone(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  // File input handler
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-surface rounded-2xl border border-outline-variant/30 animate-pulse">
        <div className="h-4 bg-surface-container-high rounded w-32 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="aspect-[4/3] bg-surface-container-high rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Imagens do Roteiro
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {images.length}/{maxImages} imagens • Arraste para reordenar • ⭐ = Capa
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-error-light text-error rounded-xl text-sm border border-error/20 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-error hover:text-error/80 shrink-0">✕</button>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOverItem(e, idx)}
              onDragEnd={handleDragEnd}
              className={`
                group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing
                ${img.is_cover ? "border-primary shadow-md" : "border-outline-variant/30 hover:border-primary/50"}
                ${draggedIdx === idx ? "opacity-50 scale-95" : ""}
              `}
            >
              <Image
                src={img.url}
                alt={img.alt_text || "Imagem do roteiro"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
                unoptimized
              />

              {/* Cover badge */}
              {img.is_cover && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  ⭐ CAPA
                </div>
              )}

              {/* Position badge */}
              <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {idx + 1}
              </div>

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100 pb-2 gap-1.5">
                {!img.is_cover && (
                  <button
                    onClick={() => handleSetCover(img)}
                    title="Definir como capa"
                    className="bg-white/90 hover:bg-primary hover:text-on-primary text-on-surface p-1.5 rounded-lg text-xs font-bold transition-colors shadow"
                  >
                    ⭐
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img)}
                  title="Remover imagem"
                  className="bg-white/90 hover:bg-error hover:text-on-primary text-error p-1.5 rounded-lg text-xs font-bold transition-colors shadow"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / Upload area */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDropZone}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
            ${dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-outline-variant/50 hover:border-primary/50 hover:bg-primary/[0.02]"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium text-primary">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">
                  Arraste imagens aqui ou <span className="text-primary font-semibold">clique para selecionar</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  JPG, PNG ou WebP • Máximo 5MB cada • {maxImages - images.length} vagas restantes
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
