"use client";

import { Toast } from "./types";

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fb-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`fb-toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
