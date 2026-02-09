export interface FileInfo {
  name: string;
  folder: string;
  size: number;
  created: string;
  modified: string;
  url: string;
  isPrivate: boolean;
}

export interface Stats {
  totalFiles: number;
  totalSize: number;
  folders: Record<string, { count: number; size: number }>;
}

export type SortField = "name" | "folder" | "size" | "modified";
export type SortDir = "asc" | "desc";

export interface Toast {
  id: number;
  message: string;
  type: string;
}

export const FOLDER_NAMES: Record<string, string> = {
  all: "Tous les fichiers",
  image: "Images",
  video: "Videos",
  document: "Documents",
};
