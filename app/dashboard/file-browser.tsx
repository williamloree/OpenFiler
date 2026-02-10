"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import type { FileInfo, Stats, SortField, SortDir, TrashItem } from "@/types";
import { Table } from "@/components/Table";
import { Sidebar } from "../../components/Sidebar";
import { Toolbar } from "../../components/Toolbar";
import { BatchBar } from "../../components/BatchBar";
import { Pagination } from "../../components/Pagination";
import { Toasts } from "../../components/Toasts";
import { Button } from "../../components/ui/Button";
import { PreviewModal } from "../../components/modal/PreviewModal";
import { UploadModal } from "../../components/modal/UploadModal";
import { SettingsModal } from "../../components/modal/SettingsModal";

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

export function FileBrowser({
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
      } catch {
        /* continue */
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
    <div className="fb-root">
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
      <main className="fb-main">
        {currentFolder === "trash" ? (
          <>
            <div className="fb-toolbar">
              <div className="fb-toolbar-left">
                <h2 style={{ margin: 0 }}>Corbeille</h2>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  {trashItems.length} élément(s) — suppression auto après 30 jours
                </span>
              </div>
              {trashItems.length > 0 && (
                <Button variant="danger" onClick={emptyTrash}>
                  Vider la corbeille
                </Button>
              )}
            </div>

            {trashItems.length > 0 ? (
              <div className="fb-table-container">
                <table className="fb-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Dossier d&apos;origine</th>
                      <th>Taille</th>
                      <th>Supprimé le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.filename}</td>
                        <td>{getFolderIcon(item.originalFolder)} {item.originalFolder}</td>
                        <td>{formatSize(item.size)}</td>
                        <td>{formatDate(item.deletedAt)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <Button variant="outline" onClick={() => restoreFromTrash(item)}>
                              Restaurer
                            </Button>
                            <Button variant="danger" onClick={() => deleteFromTrash(item)}>
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
              <div className="fb-empty-state">
                <div className="fb-empty-icon">🗑️</div>
                <h3>Corbeille vide</h3>
                <p>Les fichiers supprimés apparaîtront ici.</p>
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
              <div className="fb-table-container">
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
                />
              </div>
            ) : (
              <div className="fb-empty-state">
                <div className="fb-empty-icon">📂</div>
                <h3>Aucun fichier</h3>
                <p>Ce dossier est vide. Uploadez des fichiers pour commencer.</p>
                <Button
                  variant="primary"
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    setUploadOpen(true);
                    setUploading(false);
                  }}
                >
                  📥 Upload
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

      <Toasts toasts={toasts} />
    </div>
  );
}

