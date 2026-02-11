"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import type {
  FileInfo,
  Stats,
  SortField,
  SortDir,
  TrashItem,
  FileTrackingSummary,
  FileViewRecord,
  TrackingSortField,
} from "@/types";
import { Table } from "@/components/table/Table";
import { Sidebar } from "../components/Sidebar";
import { Toolbar } from "../components/Toolbar";
import { BatchBar } from "../components/BatchBar";
import { Pagination } from "../components/Pagination";
import { Toasts } from "../components/Toasts";
import { Button } from "../components/ui/Button";
import { PreviewModal } from "../components/modal/PreviewModal";
import { UploadModal } from "../components/modal/UploadModal";
import { SettingsModal } from "../components/modal/SettingsModal";
import { ShareModal } from "../components/modal/ShareModal";
import { TrashTable } from "../components/table/TrashTable";
import { TrackingTable } from "../components/table/TrackingTable";
import { TrackingDetailTable } from "../components/table/TrackingDetailTable";

export type { FileInfo, Stats, SortField, SortDir };

export function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getFolderIcon(folder: string): string {
  const icons: Record<string, string> = {
    image: "🏞️",
    video: "🎥",
    document: "📄",
  };
  return icons[folder] || "📁";
}

export function Dashboard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    totalSize: 0,
    folders: {},
  });
  const [currentFolder, setCurrentFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("modified");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<
    Array<{ id: number; message: string; type: string }>
  >([]);

  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [renamingFile, setRenamingFile] = useState<FileInfo | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [selectedTrashItems, setSelectedTrashItems] = useState<Set<number>>(
    new Set(),
  );
  const [shareFile, setShareFile] = useState<FileInfo | null>(null);

  const [trackingData, setTrackingData] = useState<FileTrackingSummary[]>([]);
  const [trackingDetail, setTrackingDetail] = useState<{
    folder: string;
    filename: string;
  } | null>(null);
  const [trackingDetailData, setTrackingDetailData] = useState<
    FileViewRecord[]
  >([]);
  const [trackingSortField, setTrackingSortField] =
    useState<TrackingSortField>("totalViews");
  const [trackingSortDir, setTrackingSortDir] = useState<SortDir>("desc");
  const [selectedTrackingFiles, setSelectedTrackingFiles] = useState<
    Set<string>
  >(new Set());

  const PAGE_LIMIT = 50;
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const refreshTrash = useCallback(async () => {
    try {
      const res = await fetch("/api/trash");
      const data = await res.json();
      setTrashItems(data.items || []);
      setTrashCount(data.items?.length ?? 0);
    } catch {
      showToast("Erreur de chargement de la corbeille", "error");
    }
  }, [showToast]);

  const refreshTracking = useCallback(async () => {
    try {
      const res = await fetch("/api/tracking");
      const data = await res.json();
      setTrackingData(data.files || []);
    } catch {
      showToast("Erreur de chargement du suivi", "error");
    }
  }, [showToast]);

  const loadTrackingDetail = useCallback(
    async (folder: string, filename: string) => {
      try {
        const res = await fetch(
          `/api/tracking?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`,
        );
        const data = await res.json();
        setTrackingDetailData(data.recentViews || []);
        setTrackingDetail({ folder, filename });
      } catch {
        showToast("Erreur de chargement des détails", "error");
      }
    },
    [showToast],
  );

  const refreshFiles = useCallback(
    async (p?: number) => {
      try {
        const currentPage = p ?? page;
        const [filesRes, statsRes] = await Promise.all([
          fetch(`/api/files?page=${currentPage}&limit=${PAGE_LIMIT}`),
          fetch("/api/stats"),
        ]);
        const filesData = await filesRes.json();
        const statsData = await statsRes.json();
        setAllFiles(filesData.files || []);
        setTotalFiles(filesData.total ?? 0);
        setStats(statsData);
        refreshTrash();
      } catch {
        showToast("Erreur de chargement", "error");
      }
    },
    [showToast, page, refreshTrash],
  );

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // Filter & sort
  let displayedFiles = allFiles;
  if (currentFolder !== "all") {
    displayedFiles = displayedFiles.filter((f) => f.folder === currentFolder);
  }
  if (search) {
    displayedFiles = displayedFiles.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    );
  }
  displayedFiles = [...displayedFiles].sort((a, b) => {
    let va: string | number = a[sortField] as string;
    let vb: string | number = b[sortField] as string;
    if (sortField === "modified") {
      va = new Date(va).getTime();
      vb = new Date(vb).getTime();
    }
    if (sortField === "size") {
      va = Number(va);
      vb = Number(vb);
    }
    if (typeof va === "string") {
      va = va.toLowerCase();
      vb = (vb as string).toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function selectFolder(folder: string) {
    setCurrentFolder(folder);
    setSelectedFiles(new Set());
    setSelectedTrackingFiles(new Set());
    setSelectedTrashItems(new Set());
    setPage(1);
    setTrackingDetail(null);
    if (folder === "tracking") {
      refreshTracking();
    }
  }

  function toggleSelect(filename: string) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedFiles.size === displayedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(displayedFiles.map((f) => f.name)));
    }
  }

  async function deleteSingleFile(file: FileInfo) {
    if (!confirm(`Supprimer "${file.name}" ?`)) return;
    const mimePrefix =
      file.folder === "image"
        ? "image/"
        : file.folder === "video"
          ? "video/"
          : "application/";
    try {
      const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: mimePrefix + "generic" }),
      });
      if (res.ok) {
        showToast("Fichier supprimé", "success");
        refreshFiles();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  async function batchDelete() {
    if (!confirm(`Supprimer ${selectedFiles.size} fichier(s) ?`)) return;
    const toDelete = allFiles.filter((f) => selectedFiles.has(f.name));
    let deleted = 0;
    for (const file of toDelete) {
      const mimePrefix =
        file.folder === "image"
          ? "image/"
          : file.folder === "video"
            ? "video/"
            : "application/";
      try {
        const res = await fetch("/api/files", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            type: mimePrefix + "generic",
          }),
        });
        if (res.ok) deleted++;
      } catch (e) {
        console.error("[OpenFiler] Batch delete error:", e);
      }
    }
    showToast(`${deleted} fichier(s) supprimé(s)`, "success");
    setSelectedFiles(new Set());
    refreshFiles();
  }

  async function handleRename(file: FileInfo) {
    const newName = renameValue.trim();
    if (!newName || newName === file.name) {
      setRenamingFile(null);
      return;
    }
    try {
      const res = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: file.folder,
          oldName: file.name,
          newName,
        }),
      });
      if (res.ok) {
        showToast("Fichier renommé", "success");
        refreshFiles();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
    setRenamingFile(null);
  }

  async function batchDownload() {
    const filesToDownload = allFiles
      .filter((f) => selectedFiles.has(f.name))
      .map((f) => ({ folder: f.folder, name: f.name }));
    if (filesToDownload.length === 0) return;
    try {
      const res = await fetch("/api/download/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesToDownload }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.message || "Erreur", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "openfiler-download.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  function goToPage(p: number) {
    setPage(p);
    setSelectedFiles(new Set());
    refreshFiles(p);
  }

  async function toggleVisibility(
    folder: string,
    name: string,
    isPrivate: boolean,
  ) {
    try {
      const res = await fetch("/api/files/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, name, isPrivate }),
      });
      if (res.ok) {
        setAllFiles((prev) =>
          prev.map((f) =>
            f.name === name && f.folder === folder ? { ...f, isPrivate } : f,
          ),
        );
        showToast(
          isPrivate ? "Fichier passé en privé" : "Fichier passé en public",
          "success",
        );
      } else {
        const data = await res.json();
        showToast(data.message || "Erreur", "error");
        refreshFiles();
      }
    } catch {
      showToast("Erreur de connexion", "error");
      refreshFiles();
    }
  }

  async function handleUpload(fileList: FileList) {
    const formData = new FormData();
    const imageExts = ["jpg", "jpeg", "png", "svg", "webp", "bmp", "ico"];
    const videoExts = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
    const docExts = ["pdf", "docx"];

    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let field: string;
      if (imageExts.includes(ext)) field = "image";
      else if (videoExts.includes(ext)) field = "video";
      else if (docExts.includes(ext)) field = "document";
      else {
        showToast(`Type non supporté: ${file.name}`, "error");
        continue;
      }
      formData.append(field, file);
    }

    setUploading(true);
    setUploadStatus("Upload en cours...");
    setUploadProgress(30);

    try {
      setUploadProgress(60);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadProgress(100);

      if (res.ok) {
        setUploadStatus(data.message);
        showToast(data.message, "success");
        setTimeout(() => {
          setUploadOpen(false);
          setUploading(false);
          setUploadProgress(0);
          refreshFiles();
        }, 1000);
      } else {
        setUploadStatus("Erreur: " + data.message);
        showToast(data.message, "error");
      }
    } catch {
      setUploadStatus("Erreur de connexion");
      showToast("Erreur de connexion", "error");
    }
  }

  async function restoreFromTrash(item: TrashItem) {
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", id: item.id }),
      });
      if (res.ok) {
        showToast("Fichier restauré", "success");
        refreshFiles();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  async function deleteFromTrash(item: TrashItem) {
    if (!confirm(`Supprimer définitivement "${item.filename}" ?`)) return;
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: item.id }),
      });
      if (res.ok) {
        showToast("Fichier supprimé définitivement", "success");
        refreshTrash();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  async function emptyTrash() {
    if (!confirm("Vider la corbeille ? Cette action est irréversible.")) return;
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "empty" }),
      });
      if (res.ok) {
        showToast("Corbeille vidée", "success");
        refreshTrash();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  function toggleTrashSelect(id: number) {
    setSelectedTrashItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTrashSelectAll() {
    if (selectedTrashItems.size === trashItems.length) {
      setSelectedTrashItems(new Set());
    } else {
      setSelectedTrashItems(new Set(trashItems.map((i) => i.id)));
    }
  }

  async function batchRestoreTrash() {
    const toRestore = trashItems.filter((i) => selectedTrashItems.has(i.id));
    let restored = 0;
    for (const item of toRestore) {
      try {
        const res = await fetch("/api/trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", id: item.id }),
        });
        if (res.ok) restored++;
      } catch (e) {
        console.error("[OpenFiler] Batch restore error:", e);
      }
    }
    showToast(`${restored} fichier(s) restauré(s)`, "success");
    setSelectedTrashItems(new Set());
    refreshFiles();
  }

  async function batchDeleteTrash() {
    if (
      !confirm(
        `Supprimer définitivement ${selectedTrashItems.size} fichier(s) ?`,
      )
    )
      return;
    const toDelete = trashItems.filter((i) => selectedTrashItems.has(i.id));
    let deleted = 0;
    for (const item of toDelete) {
      try {
        const res = await fetch("/api/trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: item.id }),
        });
        if (res.ok) deleted++;
      } catch (e) {
        console.error("[OpenFiler] Batch trash delete error:", e);
      }
    }
    showToast(`${deleted} fichier(s) supprimé(s) définitivement`, "success");
    setSelectedTrashItems(new Set());
    refreshTrash();
  }

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  async function deleteTrackingLogs(folder?: string, filename?: string) {
    const label = folder && filename ? `"${filename}"` : "tous les fichiers";
    if (!confirm(`Supprimer les logs de suivi pour ${label} ?`)) return;
    try {
      const params =
        folder && filename
          ? `?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`
          : "";
      const res = await fetch(`/api/tracking${params}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, "success");
        if (folder && filename) {
          setTrackingDetail(null);
        }
        refreshTracking();
      } else {
        const data = await res.json();
        showToast(data.message, "error");
      }
    } catch {
      showToast("Erreur de connexion", "error");
    }
  }

  function goToTracking(file: FileInfo) {
    setCurrentFolder("tracking");
    setTrackingDetail(null);
    refreshTracking();
    loadTrackingDetail(file.folder, file.name);
  }

  function handleTrackingSort(field: TrackingSortField) {
    if (trackingSortField === field) {
      setTrackingSortDir(trackingSortDir === "asc" ? "desc" : "asc");
    } else {
      setTrackingSortField(field);
      setTrackingSortDir("desc");
    }
  }

  function toggleTrackingSelect(key: string) {
    setSelectedTrackingFiles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTrackingSelectAll() {
    if (selectedTrackingFiles.size === sortedTrackingData.length) {
      setSelectedTrackingFiles(new Set());
    } else {
      setSelectedTrackingFiles(
        new Set(
          sortedTrackingData.map((f) => `${f.folder}/${f.filename}`),
        ),
      );
    }
  }

  async function batchDeleteTrackingLogs() {
    if (
      !confirm(
        `Supprimer les logs de suivi pour ${selectedTrackingFiles.size} fichier(s) ?`,
      )
    )
      return;
    let deleted = 0;
    for (const key of selectedTrackingFiles) {
      const [folder, ...rest] = key.split("/");
      const filename = rest.join("/");
      try {
        const res = await fetch(
          `/api/tracking?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`,
          { method: "DELETE" },
        );
        if (res.ok) deleted++;
      } catch (e) {
        console.error("[OpenFiler] Batch tracking delete error:", e);
      }
    }
    showToast(`Logs supprimés pour ${deleted} fichier(s)`, "success");
    setSelectedTrackingFiles(new Set());
    refreshTracking();
  }

  const sortedTrackingData = [...trackingData].sort((a, b) => {
    let va: string | number = a[trackingSortField] as string | number;
    let vb: string | number = b[trackingSortField] as string | number;
    if (trackingSortField === "lastViewedAt") {
      va = va ? new Date(va as string).getTime() : 0;
      vb = vb ? new Date(vb as string).getTime() : 0;
    }
    if (typeof va === "string") {
      va = va.toLowerCase();
      vb = (vb as string).toLowerCase();
    }
    if (va < vb) return trackingSortDir === "asc" ? -1 : 1;
    if (va > vb) return trackingSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const storagePct = Math.min(
    (stats.totalSize / (1024 * 1024 * 1024)) * 100,
    100,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <Sidebar
        currentFolder={currentFolder}
        selectFolder={selectFolder}
        stats={stats}
        storagePct={storagePct}
        userName={userName}
        trashCount={trashCount}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* MAIN */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {currentFolder === "tracking" ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                {trackingDetail ? (
                  <>
                    <h2 className="text-base font-semibold text-slate-900">
                      Suivi — {trackingDetail.filename}
                    </h2>
                    <span className="text-sm text-slate-400">
                      {trackingDetailData.length} accès récents
                    </span>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold text-slate-900">
                      Suivi des fichiers
                    </h2>
                    <span className="text-sm text-slate-400">
                      {trackingData.length} fichier(s) avec des vues
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {trackingDetail && (
                  <Button
                    variant="outline"
                    onClick={() => setTrackingDetail(null)}
                  >
                    Retour
                  </Button>
                )}
                {trackingDetail ? (
                  <Button
                    variant="danger"
                    onClick={() =>
                      deleteTrackingLogs(
                        trackingDetail.folder,
                        trackingDetail.filename,
                      )
                    }
                  >
                    Supprimer les logs
                  </Button>
                ) : (
                  trackingData.length > 0 && (
                    <Button
                      variant="danger"
                      onClick={() => deleteTrackingLogs()}
                    >
                      Tout supprimer
                    </Button>
                  )
                )}
                <Button variant="outline" onClick={refreshTracking}>
                  Actualiser
                </Button>
              </div>
            </div>

            {selectedTrackingFiles.size > 0 && !trackingDetail && (
              <div className="flex items-center gap-3 bg-blue-500 px-6 py-2.5 text-sm text-white">
                <span>
                  <strong>{selectedTrackingFiles.size}</strong> fichier(s)
                  sélectionné(s)
                </span>
                <Button variant="sm" onClick={batchDeleteTrackingLogs}>
                  Supprimer les logs
                </Button>
                <Button
                  variant="sm"
                  onClick={() => setSelectedTrackingFiles(new Set())}
                >
                  Annuler
                </Button>
              </div>
            )}

            {trackingDetail ? (
              <div className="flex-1 overflow-y-auto">
                <TrackingDetailTable views={trackingDetailData} />
              </div>
            ) : sortedTrackingData.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <TrackingTable
                  files={sortedTrackingData}
                  selectedFiles={selectedTrackingFiles}
                  sortField={trackingSortField}
                  sortDir={trackingSortDir}
                  onSort={handleTrackingSort}
                  onToggleSelectAll={toggleTrackingSelectAll}
                  onToggleSelect={toggleTrackingSelect}
                  onSelect={loadTrackingDetail}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center text-slate-400">
                <div className="mb-4 text-5xl opacity-50">📊</div>
                <h3 className="mb-2 text-base font-semibold text-slate-800">
                  Aucune donnée de suivi
                </h3>
                <p className="text-sm">
                  Les statistiques de consultation apparaîtront ici lorsque des
                  fichiers seront consultés.
                </p>
              </div>
            )}
          </>
        ) : currentFolder === "trash" ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Corbeille
                </h2>
                <span className="text-sm text-slate-400">
                  {trashItems.length} élément(s) — suppression auto après 30
                  jours
                </span>
              </div>
              {trashItems.length > 0 && (
                <Button variant="danger" onClick={emptyTrash}>
                  Vider la corbeille
                </Button>
              )}
            </div>

            {selectedTrashItems.size > 0 && (
              <div className="flex items-center gap-3 bg-blue-500 px-6 py-2.5 text-sm text-white">
                <span>
                  <strong>{selectedTrashItems.size}</strong> élément(s)
                  sélectionné(s)
                </span>
                <Button variant="sm" onClick={batchRestoreTrash}>
                  Restaurer
                </Button>
                <Button variant="sm" onClick={batchDeleteTrash}>
                  Supprimer définitivement
                </Button>
                <Button
                  variant="sm"
                  onClick={() => setSelectedTrashItems(new Set())}
                >
                  Annuler
                </Button>
              </div>
            )}

            {trashItems.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <TrashTable
                  items={trashItems}
                  selectedItems={selectedTrashItems}
                  onToggleSelectAll={toggleTrashSelectAll}
                  onToggleSelect={toggleTrashSelect}
                  onRestore={restoreFromTrash}
                  onDelete={deleteFromTrash}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center text-slate-400">
                <div className="mb-4 text-5xl opacity-50">🗑️</div>
                <h3 className="mb-2 text-base font-semibold text-slate-800">
                  Corbeille vide
                </h3>
                <p className="text-sm">
                  Les fichiers supprimés apparaîtront ici.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <Toolbar
              currentFolder={currentFolder}
              selectFolder={selectFolder}
              search={search}
              onSearchChange={setSearch}
              onRefresh={() => refreshFiles()}
              onOpenUpload={() => {
                setUploadOpen(true);
                setUploading(false);
              }}
            />

            <BatchBar
              selectedCount={selectedFiles.size}
              onDownload={batchDownload}
              onDelete={batchDelete}
              onClear={() => setSelectedFiles(new Set())}
            />

            {/* TABLE */}
            {displayedFiles.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <Table
                  files={displayedFiles}
                  selectedFiles={selectedFiles}
                  sortField={sortField}
                  sortDir={sortDir}
                  renamingFile={renamingFile}
                  renameValue={renameValue}
                  onSort={handleSort}
                  onToggleSelectAll={toggleSelectAll}
                  onSelect={toggleSelect}
                  onToggleVisibility={toggleVisibility}
                  onPreview={setPreviewFile}
                  onStartRename={(file) => {
                    setRenamingFile(file);
                    setRenameValue(file.name);
                  }}
                  onRenameChange={setRenameValue}
                  onRenameConfirm={handleRename}
                  onRenameCancel={() => setRenamingFile(null)}
                  onDownload={(file) =>
                    window.open(
                      `/api/download/${file.folder}/${encodeURIComponent(file.name)}`,
                      "_blank",
                    )
                  }
                  onDelete={deleteSingleFile}
                  onShare={setShareFile}
                  onTracking={goToTracking}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center text-slate-400">
                <div className="mb-4 text-5xl opacity-50">📂</div>
                <h3 className="mb-2 text-base font-semibold text-slate-800">
                  Aucun fichier
                </h3>
                <p className="text-sm">
                  Ce dossier est vide. Uploadez des fichiers pour commencer.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    setUploadOpen(true);
                    setUploading(false);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload
                </Button>
              </div>
            )}

            <Pagination
              totalFiles={totalFiles}
              pageLimit={PAGE_LIMIT}
              page={page}
              onPageChange={goToPage}
            />
          </>
        )}
      </main>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onCopyUrl={() => {
            navigator.clipboard.writeText(
              window.location.origin + previewFile.url,
            );
            showToast("URL copiée !", "success");
          }}
        />
      )}

      {uploadOpen && (
        <UploadModal
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
          onUpload={handleUpload}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          userName={userName}
          userEmail={userEmail}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {shareFile && (
        <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
