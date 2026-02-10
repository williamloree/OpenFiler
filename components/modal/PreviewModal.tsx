"use client";

import { useState } from "react";
import type { PreviewModalProps } from "@/types";
import { formatSize, formatDate, getFolderIcon } from "@/app/dashboard";

export function PreviewModal({ file, onClose, onCopyUrl }: PreviewModalProps) {
  const [urlCopied, setUrlCopied] = useState(false);

  function handleCopyUrl() {
    onCopyUrl();
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  const isImage = file.folder === "image";
  const isVideo = file.folder === "video";
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const isPreviewable = isImage || isVideo || isPdf;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex max-h-[92vh] w-auto max-w-[90vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          {/* File type badge */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
              isImage
                ? "bg-blue-50"
                : isVideo
                  ? "bg-pink-50"
                  : isPdf
                    ? "bg-amber-50"
                    : "bg-slate-100"
            }`}
          >
            {getFolderIcon(file.folder)}
          </div>

          {/* File info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {file.name}
            </h3>
            <button
              onClick={handleCopyUrl}
              className="group mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400 transition-colors hover:text-blue-500"
              title="Copier l'URL"
            >
              {urlCopied ? (
                <>
                  <svg
                    className="shrink-0 text-emerald-500"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-500">URL copiée</span>
                </>
              ) : (
                <>
                  <svg
                    className="shrink-0 text-slate-300 transition-colors group-hover:text-blue-400"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span className="truncate">
                    {window.location.origin + file.url}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Preview body */}
        <div
          className={`flex items-center justify-center overflow-auto ${
            isPreviewable ? "bg-slate-950/5" : "bg-white"
          }`}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[72vh] max-w-[80vw] object-contain"
            />
          ) : isVideo ? (
            <video
              controls
              autoPlay
              className="max-h-[72vh] max-w-[80vw] rounded-lg"
            >
              <source src={file.url} />
            </video>
          ) : isPdf ? (
            <iframe
              src={file.url}
              title={file.name}
              className="h-[72vh] w-[80vw] border-none"
            />
          ) : (
            /* File detail fallback */
            <div className="flex flex-col items-center px-16 py-14 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
                {getFolderIcon(file.folder)}
              </div>
              <h3 className="mb-4 max-w-xs truncate text-base font-semibold text-slate-900">
                {file.name}
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg
                    className="text-slate-400"
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
                  <span>{formatSize(file.size)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg
                    className="text-slate-400"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{formatDate(file.modified)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg
                    className="text-slate-400"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="capitalize">{file.folder}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          {/* File meta */}
          <div className="flex items-center gap-3">
            {isPreviewable && (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <svg
                    width="12"
                    height="12"
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
                  {formatSize(file.size)}
                </span>
                <span className="h-3 w-px bg-slate-200" />
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatDate(file.modified)}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-700"
            >
              Fermer
            </button>
            <a
              href={`/api/download/${file.folder}/${encodeURIComponent(file.name)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white no-underline shadow-sm transition-all hover:bg-blue-600 hover:shadow-md active:scale-[0.98]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Télécharger
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
