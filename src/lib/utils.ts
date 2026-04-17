export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A+': '#16a34a', A: '#22c55e',
    'B+': '#2563eb', B: '#3b82f6',
    'C+': '#ca8a04', C: '#eab308',
    D: '#f97316', F: '#dc2626',
  };
  return colors[grade] || '#6b7280';
};

export const getSafeLogoUrl = (url: string | undefined, defaultLogo: string): string => {
  if (!url || url.trim() === '') return defaultLogo;

  // Handle Cloudinary URLs — inject f_png + width so SVGs become proper PNGs
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Build transformation string. Skip if it was already added.
    const alreadyTransformed = url.includes('/upload/f_png');
    let out = alreadyTransformed
      ? url
      : url.replace('/upload/', '/upload/f_png,w_800,c_limit/');

    // Always switch the extension to .png so the PDF renderer knows the format
    out = out.replace(/\.(svg|webp)(\?.*)?$/i, '.png');
    return out;
  }

  // Non-Cloudinary SVGs will fail in react-pdf — fall back to default
  if (url.toLowerCase().endsWith('.svg')) return defaultLogo;

  return url;
};

/**
 * flattens a nested object into a flat object with dot-notation keys.
 * Useful for FormData submission where the backend expects flat keys.
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof File) &&
        !(value instanceof Date) &&
        !Array.isArray(value)
      ) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

