/**
 * Detects the actual MIME type of a file by reading its magic bytes (file signature).
 * Returns the detected MIME type or null if unrecognized.
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  // ICO: 00 00 01 00
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return "image/x-icon";
  }

  // RIFF container: WebP or AVI
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    const sub = buffer.toString("ascii", 8, 12);
    if (sub === "WEBP") return "image/webp";
    if (sub === "AVI ") return "video/avi";
  }

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // ZIP (DOCX): 50 4B 03 04
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return "application/zip";
  }

  // MP4/MOV: "ftyp" at offset 4
  if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
    return "video/mp4";
  }

  // FLV: 46 4C 56
  if (buffer[0] === 0x46 && buffer[1] === 0x4c && buffer[2] === 0x56) {
    return "video/flv";
  }

  // MKV/WebM: EBML header 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "video/matroska";
  }

  // WMV/ASF: 30 26 B2 75
  if (buffer[0] === 0x30 && buffer[1] === 0x26 && buffer[2] === 0xb2 && buffer[3] === 0x75) {
    return "video/wmv";
  }

  // SVG: text-based, check for <svg or <?xml
  const head = buffer.toString("utf-8", 0, Math.min(buffer.length, 256)).trimStart();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return "image/svg+xml";
  }

  return null;
}

/**
 * Maps a detected MIME type to the allowed upload folder.
 * Returns the folder name or null if the type is not allowed.
 */
export function detectedTypeMatchesFolder(detectedMime: string, folder: string): boolean {
  const folderMap: Record<string, string[]> = {
    image: ["image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/bmp", "image/x-icon"],
    document: ["application/pdf", "application/zip"],
    video: ["video/mp4", "video/avi", "video/flv", "video/matroska", "video/wmv"],
  };

  const allowed = folderMap[folder];
  if (!allowed) return false;
  return allowed.includes(detectedMime);
}
