const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Resolve a backend photo path (e.g. `/uploads/x.jpg`) to an absolute URL. */
export function photoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

/** Profile completion over the 9 MVP signals. Returns 0–100. */
export function gymCompletion(gym: {
  name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  facilities?: string[];
  images?: unknown[];
  imageUrl?: string | null;
}): number {
  const checks = [
    !!gym.name,
    !!gym.description,
    !!gym.address,
    !!gym.city,
    !!gym.phone,
    !!gym.email,
    (gym.images?.length ?? 0) > 0 || !!gym.imageUrl,
    (gym.facilities?.length ?? 0) > 0,
    !!gym.openingTime && !!gym.closingTime,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
