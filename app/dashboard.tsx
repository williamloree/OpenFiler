"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import type { FileInfo, Stats, SortField, SortDir, TrashItem } from "@/types";
import { Table } from "@/components/Table";
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
  const [shareFile, setShareFile] = useState<FileInfo | null>(null);

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
    setPage(1);
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

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

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
        {currentFolder === "trash" ? (
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

            {trashItems.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Nom
                      </th>
                      <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Dossier d&apos;origine
                      </th>
                      <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Taille
                      </th>
                      <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Supprimé le
                      </th>
                      <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                          {item.filename}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-500">
                          {getFolderIcon(item.originalFolder)}{" "}
                          {item.originalFolder}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {formatSize(item.size)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {formatDate(item.deletedAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              onClick={() => restoreFromTrash(item)}
                            >
                              Restaurer
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => deleteFromTrash(item)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
