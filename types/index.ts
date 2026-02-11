// ===== Domain =====

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

export interface TrashItem {
  id: number;
  originalFolder: string;
  filename: string;
  trashName: string;
  size: number;
  deletedBy: string | null;
  deletedAt: string;
}

export type SortField = "name" | "folder" | "size" | "modified";
export type SortDir = "asc" | "desc";

export interface Toast {
  id: number;
  message: string;
  type: string;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  folder: string;
  filename: string;
  expiresAt: string;
  createdAt: string;
}

// ===== Tracking =====

export type ViewAction = "preview" | "download" | "share_view";

export interface FileViewRecord {
  id: number;
  folder: string;
  filename: string;
  action: ViewAction;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
  viewedAt: string;
}

export interface FileTrackingSummary {
  folder: string;
  filename: string;
  totalViews: number;
  uniqueViewers: number;
  previewCount: number;
  downloadCount: number;
  shareViewCount: number;
  lastViewedAt: string | null;
}

export type TrackingSortField =
  | "filename"
  | "folder"
  | "totalViews"
  | "uniqueViewers"
  | "downloadCount"
  | "lastViewedAt";

// ===== Component Props =====

export interface ItemProps {
  file: FileInfo;
  selected: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onToggleVisibility: (isPrivate: boolean) => void;
  onPreview: () => void;
  onStartRename: () => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
  onTracking: () => void;
}

export interface TableProps {
  files: FileInfo[];
  selectedFiles: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  renamingFile: FileInfo | null;
  renameValue: string;
  onSort: (field: SortField) => void;
  onToggleSelectAll: () => void;
  onSelect: (filename: string) => void;
  onToggleVisibility: (folder: string, name: string, isPrivate: boolean) => void;
  onPreview: (file: FileInfo) => void;
  onStartRename: (file: FileInfo) => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: (file: FileInfo) => void;
  onRenameCancel: () => void;
  onDownload: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onShare: (file: FileInfo) => void;
  onTracking: (file: FileInfo) => void;
}

export interface ToolbarProps {
  currentFolder: string;
  selectFolder: (folder: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onOpenUpload: () => void;
}

export interface SidebarProps {
  currentFolder: string;
  selectFolder: (folder: string) => void;
  stats: Stats;
  storagePct: number;
  userName: string;
  trashCount: number;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export interface BatchBarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export interface PaginationProps {
  totalFiles: number;
  pageLimit: number;
  page: number;
  onPageChange: (page: number) => void;
}

export interface ToastsProps {
  toasts: Toast[];
}

export interface PreviewModalProps {
  file: FileInfo;
  onClose: () => void;
  onCopyUrl: () => void;
}

export interface UploadModalProps {
  uploading: boolean;
  uploadProgress: number;
  uploadStatus: string;
  onUpload: (files: FileList) => void;
  onClose: () => void;
}

export interface SettingsModalProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
}

export interface TrashTableProps {
  items: TrashItem[];
  selectedItems: Set<number>;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onRestore: (item: TrashItem) => void;
  onDelete: (item: TrashItem) => void;
}

export interface TrackingTableProps {
  files: FileTrackingSummary[];
  selectedFiles: Set<string>;
  sortField: TrackingSortField;
  sortDir: SortDir;
  onSort: (field: TrackingSortField) => void;
  onToggleSelectAll: () => void;
  onToggleSelect: (key: string) => void;
  onSelect: (folder: string, filename: string) => void;
}

export interface TrackingDetailTableProps {
  views: FileViewRecord[];
}
