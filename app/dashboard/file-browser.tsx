"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/client";

interface FileInfo {
  name: string;
  folder: string;
  size: number;
  created: string;
  modified: string;
  url: string;
  isPrivate: boolean;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
  folders: Record<string, { count: number; size: number }>;
}

type SortField = "name" | "folder" | "size" | "modified";
type SortDir = "asc" | "desc";

const FOLDER_NAMES: Record<string, string> = {
  all: "Tous les fichiers",
  image: "Images",
  video: "Videos",
  document: "Documents",
};

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getFolderIcon(folder: string): string {
  const icons: Record<string, string> = { image: "\u{1F5BC}", video: "\u{1F3AC}", document: "\u{1F4C4}" };
  return icons[folder] || "\u{1F4C4}";
}

export function FileBrowser({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0, folders: {} });
  const [currentFolder, setCurrentFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("modified");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);

  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [renamingFile, setRenamingFile] = useState<FileInfo | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const PAGE_LIMIT = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const refreshFiles = useCallback(async (p?: number) => {
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
    } catch {
      showToast("Erreur de chargement", "error");
    }
  }, [showToast, page]);

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
        body: JSON.stringify({ folder: file.folder, oldName: file.name, newName }),
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

  const storagePct = Math.min((stats.totalSize / (1024 * 1024 * 1024)) * 100, 100);

  return (
    <div className="fb-root">
      {/* SIDEBAR */}
      <aside className="fb-sidebar">
        <div className="fb-sidebar-header">
          <h1>OpenFiler</h1>
          <span>File Browser</span>
        </div>
        <nav className="fb-sidebar-nav">
          <div className="fb-sidebar-label">Buckets</div>
          {(["all", "image", "video", "document"] as const).map((folder) => (
            <div
              key={folder}
              className={`fb-nav-item ${currentFolder === folder ? "active" : ""}`}
              onClick={() => selectFolder(folder)}
            >
              <span className="fb-nav-icon">
                {folder === "all" ? "\u{1F4C1}" : folder === "image" ? "\u{1F4F7}" : folder === "video" ? "\u{1F3A5}" : "\u{1F4C4}"}
              </span>
              <span className="fb-nav-text">{FOLDER_NAMES[folder]}</span>
              <span className="fb-nav-badge">
                {folder === "all" ? stats.totalFiles : stats.folders[folder]?.count ?? 0}
              </span>
            </div>
          ))}
        </nav>
        <div className="fb-sidebar-stats">
          <div className="fb-stat-row">
            <span className="fb-stat-label">Fichiers</span>
            <span className="fb-stat-value">{stats.totalFiles}</span>
          </div>
          <div className="fb-stat-row">
            <span className="fb-stat-label">Taille totale</span>
            <span className="fb-stat-value">{formatSize(stats.totalSize)}</span>
          </div>
          <div className="fb-storage-bar">
            <div className="fb-storage-fill" style={{ width: `${storagePct}%` }} />
          </div>
          <div className="fb-sidebar-user">
            <span className="fb-user-name">{userName}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fb-signout-btn" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
              <button className="fb-signout-btn" onClick={handleSignOut}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="fb-main">
        {/* TOOLBAR */}
        <div className="fb-toolbar">
          <div className="fb-breadcrumb">
            <a onClick={() => selectFolder("all")}>OpenFiler</a>
            <span className="fb-sep">/</span>
            <span>{FOLDER_NAMES[currentFolder]}</span>
          </div>
          <div className="fb-toolbar-actions">
            <div className="fb-search-box">
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="fb-btn fb-btn-outline" onClick={() => refreshFiles()}>
              &#8635; Rafraîchir
            </button>
            <button className="fb-btn fb-btn-primary" onClick={() => { setUploadOpen(true); setUploading(false); }}>
              &#8679; Upload
            </button>
          </div>
        </div>

        {/* BATCH BAR */}
        {selectedFiles.size > 0 && (
          <div className="fb-batch-bar">
            <span>
              <strong>{selectedFiles.size}</strong> fichier(s) sélectionné(s)
            </span>
            <button className="fb-btn fb-btn-sm" onClick={batchDownload}>
              Télécharger (.zip)
            </button>
            <button className="fb-btn fb-btn-sm" onClick={batchDelete}>
              Supprimer la sélection
            </button>
            <button className="fb-btn fb-btn-sm" onClick={() => setSelectedFiles(new Set())}>
              Annuler
            </button>
          </div>
        )}

        {/* TABLE */}
        {displayedFiles.length > 0 ? (
          <div className="fb-table-container">
            <table className="fb-table">
              <thead>
                <tr>
                  <th className="fb-td-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === displayedFiles.length && displayedFiles.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Nom <span className="fb-sort-icon">{sortField === "name" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B2\u25BC"}</span>
                  </th>
                  <th onClick={() => handleSort("folder")}>
                    Type <span className="fb-sort-icon">{sortField === "folder" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B2\u25BC"}</span>
                  </th>
                  <th onClick={() => handleSort("size")}>
                    Taille <span className="fb-sort-icon">{sortField === "size" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B2\u25BC"}</span>
                  </th>
                  <th onClick={() => handleSort("modified")}>
                    Modifié <span className="fb-sort-icon">{sortField === "modified" ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B2\u25BC"}</span>
                  </th>
                  <th>Visibilité</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFiles.map((file) => (
                  <tr key={`${file.folder}/${file.name}`}>
                    <td className="fb-td-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.name)}
                        onChange={() => toggleSelect(file.name)}
                      />
                    </td>
                    <td>
                      <div className="fb-file-name-cell">
                        <div className={`fb-file-icon ${file.folder}`}>{getFolderIcon(file.folder)}</div>
                        {renamingFile?.name === file.name && renamingFile?.folder === file.folder ? (
                          <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(file);
                              if (e.key === "Escape") setRenamingFile(null);
                            }}
                            onBlur={() => handleRename(file)}
                            className="fb-file-name"
                            style={{ border: "1px solid var(--fb-primary)", borderRadius: 4, padding: "2px 6px", outline: "none", width: "100%" }}
                          />
                        ) : (
                          <div className="fb-file-name" title={file.name}>{file.name}</div>
                        )}
                      </div>
                    </td>
                    <td><span className="fb-file-folder">{file.folder}</span></td>
                    <td>{formatSize(file.size)}</td>
                    <td>{formatDate(file.modified)}</td>
                    <td>
                      <label className="fb-visibility-label">
                        <input
                          type="checkbox"
                          checked={file.isPrivate}
                          onChange={(e) => toggleVisibility(file.folder, file.name, e.target.checked)}
                        />
                        <span style={{ color: file.isPrivate ? "var(--fb-danger)" : "var(--fb-text-secondary)" }}>
                          {file.isPrivate ? "\u{1F512} Privé" : "\u{1F513} Public"}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div className="fb-file-actions">
                        <button className="fb-action-btn" onClick={() => setPreviewFile(file)} title="Aperçu">
                          &#128065;&#65039;
                        </button>
                        <button
                          className="fb-action-btn"
                          onClick={() => { setRenamingFile(file); setRenameValue(file.name); }}
                          title="Renommer"
                        >
                          &#9998;&#65039;
                        </button>
                        <button
                          className="fb-action-btn"
                          onClick={() => window.open(`/api/download/${file.folder}/${encodeURIComponent(file.name)}`, "_blank")}
                          title="Télécharger"
                        >
                          &#128229;
                        </button>
                        <button className="fb-action-btn delete" onClick={() => deleteSingleFile(file)} title="Supprimer">
                          &#128465;&#65039;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="fb-empty-state">
            <div className="fb-empty-icon">&#128194;</div>
            <h3>Aucun fichier</h3>
            <p>Ce dossier est vide. Uploadez des fichiers pour commencer.</p>
            <button className="fb-btn fb-btn-primary" style={{ marginTop: 16 }} onClick={() => { setUploadOpen(true); setUploading(false); }}>
              &#8679; Upload
            </button>
          </div>
        )}

        {/* PAGINATION */}
        {totalFiles > PAGE_LIMIT && (
          <div className="fb-batch-bar" style={{ justifyContent: "center" }}>
            <button
              className="fb-btn fb-btn-sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Précédent
            </button>
            <span style={{ fontSize: 14 }}>
              Page {page} sur {Math.ceil(totalFiles / PAGE_LIMIT)}
            </span>
            <button
              className="fb-btn fb-btn-sm"
              disabled={page >= Math.ceil(totalFiles / PAGE_LIMIT)}
              onClick={() => goToPage(page + 1)}
            >
              Suivant
            </button>
          </div>
        )}
      </main>

      {/* PREVIEW MODAL */}
      {previewFile && (
        <div className="fb-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <div style={{ overflow: "hidden", flex: 1 }}>
                <h3>{previewFile.name}</h3>
                <div
                  className="fb-preview-url"
                  title="Cliquer pour copier l'URL"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + previewFile.url);
                    showToast("URL copiée !", "success");
                  }}
                >
                  {window.location.origin + previewFile.url}
                </div>
              </div>
              <button className="fb-modal-close" onClick={() => setPreviewFile(null)}>
                &times;
              </button>
            </div>
            <div className="fb-modal-body">
              {previewFile.folder === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewFile.url} alt={previewFile.name} />
              ) : previewFile.folder === "video" ? (
                <video controls autoPlay>
                  <source src={previewFile.url} />
                </video>
              ) : previewFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewFile.url} title={previewFile.name} />
              ) : (
                <div className="fb-file-detail">
                  <div className="fb-detail-icon">{getFolderIcon(previewFile.folder)}</div>
                  <h3>{previewFile.name}</h3>
                  <p>Taille: {formatSize(previewFile.size)}</p>
                  <p>Modifié: {formatDate(previewFile.modified)}</p>
                  <p>Type: {previewFile.folder}</p>
                </div>
              )}
            </div>
            <div className="fb-modal-footer">
              <button className="fb-btn fb-btn-outline" onClick={() => setPreviewFile(null)}>
                Fermer
              </button>
              <a
                className="fb-btn fb-btn-primary"
                href={`/api/download/${previewFile.folder}/${encodeURIComponent(previewFile.name)}`}
                style={{ textDecoration: "none" }}
              >
                &#128229; Télécharger
              </a>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadOpen && (
        <div className="fb-modal-overlay" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h3>Upload de fichiers</h3>
              <button className="fb-modal-close" onClick={() => !uploading && setUploadOpen(false)}>
                &times;
              </button>
            </div>
            <div className="fb-modal-body" style={{ flexDirection: "column", minWidth: "auto" }}>
              {!uploading ? (
                <div
                  className={`fb-upload-zone ${dragOver ? "dragover" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
                  }}
                >
                  <div className="fb-upload-icon">&#128228;</div>
                  <p><strong>Glissez vos fichiers ici</strong></p>
                  <p>ou cliquez pour sélectionner</p>
                  <p className="fb-upload-hint">Images (6 max) | Videos (2 max) | Documents (3 max) - 64 MB max</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
                    }}
                  />
                </div>
              ) : (
                <div className="fb-upload-progress">
                  <div className="fb-upload-status">{uploadStatus}</div>
                  <div className="fb-progress-bar">
                    <div className="fb-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {settingsOpen && (
        <div className="fb-modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="fb-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 960, width: "100%" }}>
            <div className="fb-modal-header">
              <h3>Settings</h3>
              <button className="fb-modal-close" onClick={() => setSettingsOpen(false)}>
                &times;
              </button>
            </div>
            <div className="fb-modal-body" style={{ padding: 24, gap: 24, alignItems: "start", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <ProfileSection currentName={userName} />
                <EmailSection currentEmail={userEmail} />
                <PasswordSection />
              </div>
              <TokensSection />
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="fb-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`fb-toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await authClient.updateUser({ name });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Nom mis à jour");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Profil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings-name" className="block text-sm font-medium mb-1">Nom</label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") ? "text-danger" : "text-green-600"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={loading || name === currentName}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await authClient.changeEmail({ newEmail });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Email mis à jour");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Email</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings-email" className="block text-sm font-medium mb-1">Adresse email</label>
          <input
            id="settings-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") ? "text-danger" : "text-green-600"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={loading || newEmail === currentEmail}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Modifier l'email"}
        </button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Mot de passe mis à jour");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Mot de passe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings-current-password" className="block text-sm font-medium mb-1">Mot de passe actuel</label>
          <input
            id="settings-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="settings-new-password" className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
          <input
            id="settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="settings-confirm-password" className="block text-sm font-medium mb-1">Confirmer le nouveau mot de passe</label>
          <input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") || message.includes("correspondent") || message.includes("caractères") ? "text-danger" : "text-green-600"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Modifier le mot de passe"}
        </button>
      </form>
    </section>
  );
}

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

function TokensSection() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setCreatedToken(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data.token);
        setNewName("");
        fetchTokens();
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      }
    } catch { /* ignore */ }
  }

  function copyToken() {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Tokens API</h2>

      {createdToken && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800 mb-2">Token créé — copiez-le maintenant, il ne sera plus affiché :</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded border border-green-200 px-2 py-1.5 break-all select-all">{createdToken}</code>
            <button
              onClick={copyToken}
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom du token"
          required
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Créer"}
        </button>
      </form>

      {tokens.length > 0 ? (
        <div className="space-y-2">
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="text-xs text-gray-500 font-mono">{t.token}</div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="shrink-0 ml-2 rounded-lg border border-border px-2 py-1 text-xs text-danger transition-colors hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aucun token API.</p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Utilisez un token pour uploader via API : <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
      </p>
    </section>
  );
}
