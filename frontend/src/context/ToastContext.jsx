import { createContext, useCallback, useContext, useState } from "react";
import Icon from "../components/ui/Icon";

const ToastContext = createContext(null);

let idSeq = 0;

const TOAST_ICONS = { success: "check", error: "x", info: "info" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idSeq;
      const item = { id, duration: 4500, ...toast };
      setToasts((prev) => [...prev, item]);
      if (item.duration > 0) {
        setTimeout(() => remove(id), item.duration);
      }
      return id;
    },
    [remove]
  );

  const toast = {
    success: (msg, title = "Hecho") => push({ type: "success", title, msg }),
    error: (msg, title = "Error") => push({ type: "error", title, msg }),
    info: (msg, title = "Información") => push({ type: "info", title, msg }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className={`toast-icon icon-${t.type}`}>
              <Icon name={TOAST_ICONS[t.type]} size={16} />
            </span>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.msg && <div className="toast-msg">{t.msg}</div>}
            </div>
            <button
              className="toast-close"
              type="button"
              aria-label="Cerrar"
              onClick={() => remove(t.id)}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
