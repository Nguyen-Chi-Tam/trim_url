import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Compress an image File/Blob to be under `maxBytes` if possible.
// Returns a Blob (of type image/jpeg or original type) suitable for upload.
export async function compressImage(file, maxBytes, maxWidth = 1280) {
  if (!file || !(file instanceof Blob) || !file.type.startsWith('image/')) return file;

  // If already under limit, return as-is
  if (file.size <= maxBytes) return file;

  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    image.src = url;
  });

  const ratio = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Try compressing as JPEG progressively decreasing quality
  let quality = 0.92;
  const minQuality = 0.4;
  while (quality >= minQuality) {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) break;
    if (blob.size <= maxBytes) return blob;
    quality -= 0.08;
  }

  // If we couldn't reach target with JPEG at minQuality, try PNG at current size
  const pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (pngBlob && pngBlob.size <= maxBytes) return pngBlob;

  // As a last resort, return the smallest we produced (jpeg at minQuality) or original file if none
  const fallbackBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', Math.max(minQuality, quality)));
  return fallbackBlob || file;
}
