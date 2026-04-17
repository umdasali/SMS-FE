/**
 * Converts any image URL (including SVG) to a base64 PNG data URL
 * using an HTML canvas. This ensures react-pdf always gets a valid image.
 */
export async function imageUrlToBase64Png(url: string, size = 400): Promise<string> {
  // Guard: only run in browser
  if (typeof window === 'undefined') return url;

  try {
    // Fetch the raw bytes
    const res = await fetch(url, { cache: 'no-store' });
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || blob.type;

    let objectUrl: string;

    if (contentType.includes('svg') || url.endsWith('.svg')) {
      // Re-pack as SVG so the browser Image element can render it
      const text = await blob.text();
      const svgBlob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
      objectUrl = URL.createObjectURL(svgBlob);
    } else {
      objectUrl = URL.createObjectURL(blob);
    }

    return new Promise<string>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          // Fit image proportionally in the square canvas
          const ratio = Math.min(size / img.naturalWidth, size / img.naturalHeight);
          const w = img.naturalWidth * ratio;
          const h = img.naturalHeight * ratio;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        }
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(url); // fall back to original url on error
      };

      img.src = objectUrl;
    });
  } catch {
    return url; // network error ‒ fall back to original
  }
}
