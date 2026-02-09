import type { ToastsProps } from "@/types";

export function Toasts({ toasts }: ToastsProps) {
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
