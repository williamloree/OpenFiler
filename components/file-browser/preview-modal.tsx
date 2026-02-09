"use client";

import { FileInfo } from "./types";
import { formatSize, formatDate, getFolderIcon } from "./utils";

interface PreviewModalProps {
  file: FileInfo;
  onClose: () => void;
  onCopyUrl: (url: string) => void;
}

export function PreviewModal({ file, onClose, onCopyUrl }: PreviewModalProps) {
  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fb-modal-header">
          <div style={{ overflow: "hidden", flex: 1 }}>
            <h3>{file.name}</h3>
            <div
              className="fb-preview-url"
              title="Cliquer pour copier l'URL"
              onClick={() => onCopyUrl(window.location.origin + file.url)}
            >
              {window.location.origin + file.url}
            </div>
          </div>
          <button className="fb-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="fb-modal-body">
          {file.folder === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} />
          ) : file.folder === "video" ? (
            <video controls autoPlay>
              <source src={file.url} />
            </video>
          ) : file.name.toLowerCase().endsWith(".pdf") ? (
            <iframe src={file.url} title={file.name} />
          ) : (
            <div className="fb-file-detail">
              <div className="fb-detail-icon">{getFolderIcon(file.folder)}</div>
              <h3>{file.name}</h3>
              <p>Taille: {formatSize(file.size)}</p>
              <p>Modifié: {formatDate(file.modified)}</p>
              <p>Type: {file.folder}</p>
            </div>
          )}
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>
            Fermer
          </button>
          <a
            className="fb-btn fb-btn-primary"
            href={`/api/download/${file.folder}/${encodeURIComponent(file.name)}`}
            style={{ textDecoration: "none" }}
          >
            &#128229; Télécharger
          </a>
        </div>
      </div>
    </div>
  );
}
