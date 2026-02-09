import { useRef, useState } from "react";
import type { UploadModalProps } from "@/types";

export function UploadModal({
  uploading,
  uploadProgress,
  uploadStatus,
  onUpload,
  onClose,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="fb-modal-overlay"
      onClick={() => !uploading && onClose()}
    >
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fb-modal-header">
          <h3>Upload de fichiers</h3>
          <button
            className="fb-modal-close"
            onClick={() => !uploading && onClose()}
          >
            &times;
          </button>
        </div>
        <div
          className="fb-modal-body"
          style={{ flexDirection: "column", minWidth: "auto" }}
        >
          {!uploading ? (
            <div
              className={`fb-upload-zone ${dragOver ? "dragover" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length > 0)
                  onUpload(e.dataTransfer.files);
              }}
            >
              <div className="fb-upload-icon">&#128228;</div>
              <p>
                <strong>Glissez vos fichiers ici</strong>
              </p>
              <p>ou cliquez pour sélectionner</p>
              <p className="fb-upload-hint">
                Images (6 max) | Videos (2 max) | Documents (3 max) - 64 MB
                max
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0)
                    onUpload(e.target.files);
                }}
              />
            </div>
          ) : (
            <div className="fb-upload-progress">
              <div className="fb-upload-status">{uploadStatus}</div>
              <div className="fb-progress-bar">
                <div
                  className="fb-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
