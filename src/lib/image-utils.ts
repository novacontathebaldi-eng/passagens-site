/**
 * Client-side image processing utilities for Partiu Turismo
 * - Converts raster images (JPEG, PNG, GIF) to WebP for bandwidth savings
 * - Preserves transparency (alpha channel) from PNG/WebP sources
 * - Passes SVG and ICO files through unchanged (vector/icon formats)
 * - Handles cleanup of old files in the storage bucket
 */

/** File types that should NOT be converted (passed through as-is) */
const PASSTHROUGH_TYPES = new Set([
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

/** Quality setting for WebP conversion (0-1). 0.85 is a good balance. */
const WEBP_QUALITY = 0.85;

/**
 * Converts a raster image File to WebP format using Canvas.
 * Preserves alpha/transparency from PNG or WebP sources.
 * SVG and ICO files are returned unchanged.
 *
 * @returns A new File object (WebP) or the original if passthrough.
 */
export async function convertToWebP(file: File): Promise<File> {
  // SVG and ICO: pass through unchanged
  if (PASSTHROUGH_TYPES.has(file.type)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback: can't get canvas context, return original
        resolve(file);
        return;
      }

      // Draw with transparency support (no fillRect = transparent bg)
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback
            return;
          }
          // Build new filename with .webp extension
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
          });
          resolve(webpFile);
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      // If image fails to load, return original
      resolve(file);
    };

    // Read file as data URL for the Image element
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a raster image File to PNG format using Canvas.
 * Used for assets that must remain PNG-compatible (e.g., logo for PDF rendering).
 * Preserves alpha/transparency. SVG and ICO files are returned unchanged.
 *
 * @returns A new File object (PNG) or the original if passthrough.
 */
export async function convertToPNG(file: File): Promise<File> {
  // SVG and ICO: pass through unchanged
  if (PASSTHROUGH_TYPES.has(file.type)) {
    return file;
  }

  // Already PNG: pass through unchanged
  if (file.type === "image/png") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw with transparency support (no fillRect = transparent bg)
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const pngFile = new File([blob], `${baseName}.png`, {
            type: "image/png",
          });
          resolve(pngFile);
        },
        "image/png"
      );
    };

    img.onerror = () => {
      resolve(file);
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the file extension for a given MIME type.
 */
export function getExtForType(file: File): string {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  if (file.type === "image/x-icon" || file.type === "image/vnd.microsoft.icon") return "ico";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/gif") return "gif";
  // Fallback: extract from filename
  return file.name.split(".").pop() ?? "bin";
}

/**
 * All known extensions that could have been used for a given field.
 * Used to clean up old files when uploading a replacement.
 */
const ALL_IMAGE_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "gif", "svg", "ico"];

/**
 * Generates the list of all possible old file paths for a field key.
 * This ensures cleanup works even if the old file had a different extension.
 */
export function getOldFilePaths(fieldKey: string): string[] {
  return ALL_IMAGE_EXTENSIONS.map((ext) => `site/${fieldKey}.${ext}`);
}
