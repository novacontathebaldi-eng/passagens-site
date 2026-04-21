/**
 * Fallback image for when no tour image exists.
 * This is a neutral placeholder — not an Unsplash URL.
 */
export const TOUR_IMAGE_PLACEHOLDER = "/placeholder-tour.svg";

/**
 * Extracts the cover image URL from a tour_package_images array.
 * Falls back to the first image if no cover is set, then to placeholder.
 */
export function getCoverImage(
  images?: { url: string; is_cover: boolean; position: number }[] | null
): string {
  if (!images || images.length === 0) return TOUR_IMAGE_PLACEHOLDER;
  const cover = images.find((img) => img.is_cover);
  return cover?.url ?? images[0]?.url ?? TOUR_IMAGE_PLACEHOLDER;
}

/**
 * Returns all images for a tour package, sorted by position.
 * Excludes the cover (hero) image if excludeCover is true.
 */
export function getGalleryImages(
  images?: { url: string; is_cover: boolean; position: number; alt_text?: string | null }[] | null,
  excludeCover = false
): { url: string; alt_text: string | null }[] {
  if (!images || images.length === 0) return [];
  const sorted = [...images].sort((a, b) => a.position - b.position);
  if (excludeCover) {
    return sorted.filter((img) => !img.is_cover).map((img) => ({
      url: img.url,
      alt_text: img.alt_text ?? null,
    }));
  }
  return sorted.map((img) => ({
    url: img.url,
    alt_text: img.alt_text ?? null,
  }));
}
