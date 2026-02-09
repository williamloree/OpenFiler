"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import { FileInfo, Stats, SortField, SortDir, Toast } from "./types";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { BatchBar } from "./batch-bar";
import { FileTable } from "./file-table";
import { PreviewModal } from "./preview-modal";
import { UploadModal } from "./upload-modal";
import { ToastContainer } from "./toast-container";

export function FileBrowser({ userName }: { userName: string }) {
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0, folders: {} });
  const [currentFolder, setCurrentFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("modified");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const refreshFiles = useCallback(async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([fetch("/api/files"), fetch("/api/stats")]);
      const filesData = await filesRes.json();
      const statsData = await statsRes.json();
      setAllFiles(filesData.files || []);
      setStats(statsData);
    } catch {
      showToast("Erreur de chargement", "error");
    }
  }, [showToast]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // Filter & sort
  let displayedFiles = allFiles;
  if (currentFolder !== "all") {
    displayedFiles = displayedFiles.filter((f) => f.folder === currentFolder);
  }
  if (search) {
    displayedFiles = displayedFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
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
    const mimePrefix = file.folder === "image" ? "image/" : file.folder === "video" ? "video/" : "application/";
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
      const mimePrefix = file.folder === "image" ? "image/" : file.folder === "video" ? "video/" : "application/";
      try {
        const res = await fetch("/api/files", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, type: mimePrefix + "generic" }),
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

  async function toggleVisibility(folder: string, name: string, isPrivate: boolean) {
    try {
      const res = await fetch("/api/files/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, name, isPrivate }),
      });
      if (res.ok) {
        setAllFiles((prev) =>
          prev.map((f) => (f.name === name && f.folder === folder ? { ...f, isPrivate } : f))
        );
        showToast(isPrivate ? "Fichier passé en privé" : "Fichier passé en public", "success");
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
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

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="fb-root">
      <Sidebar
        stats={stats}
        currentFolder={currentFolder}
        userName={userName}
        onSelectFolder={selectFolder}
        onSignOut={handleSignOut}
      />

      <main className="fb-main">
        <Toolbar
          currentFolder={currentFolder}
          search={search}
          onSearchChange={setSearch}
          onSelectFolder={selectFolder}
          onRefresh={refreshFiles}
          onUpload={() => { setUploadOpen(true); setUploading(false); }}
        />

        <BatchBar
          count={selectedFiles.size}
          onDelete={batchDelete}
          onCancel={() => setSelectedFiles(new Set())}
        />

        <FileTable
          files={displayedFiles}
          selectedFiles={selectedFiles}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPreview={setPreviewFile}
          onDelete={deleteSingleFile}
          onToggleVisibility={toggleVisibility}
          onUpload={() => { setUploadOpen(true); setUploading(false); }}
        />
      </main>

      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onCopyUrl={(url) => {
            navigator.clipboard.writeText(url);
            showToast("URL copiée !", "success");
          }}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadStatus={uploadStatus}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
