export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 100) || 'gym';
}

export function uniqueSlug(base: string, suffix: string): string {
  const clean = slugify(base);
  const short = suffix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toLowerCase();
  return `${clean}-${short}`.slice(0, 160);
}
