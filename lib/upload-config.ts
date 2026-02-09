export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "image/bmp",
    "image/x-icon",
  ],
  document: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  video: [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/mkv",
  ],
};

export const MAX_FILE_SIZE = 67108864; // 64MB

export const MAX_FILES_PER_FIELD: Record<string, number> = {
  image: 6,
  document: 3,
  video: 2,
};

export const ALLOWED_FOLDERS = ["image", "document", "video"];

export function getFolderForMimeType(mimeType: string): string | null {
  for (const [folder, types] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (types.includes(mimeType)) return folder;
  }
  return null;
}
