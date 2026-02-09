export function slugify(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_");
}

export function getSlugifiedFilename(str: string): string {
  const parts = str.split(".");
  const extension = parts.pop();
  return `${slugify(parts.join(""))}.${extension}`;
}
