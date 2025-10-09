// frontapp/src/components/ToastProvider.jsx
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";

const ToastCtx = createContext(null);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // Pas de default params -> on normalise dans la fonction (S1788)
  const push = useCallback(
    (msg, type, ttl) => {
      const _type = type ?? "info";
      const _ttl =
        ttl ??
        (_type === "error" ? 4500 : _type === "success" ? 3000 : 3500);

      const id =
        crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, msg, type: _type }]);
      if (_ttl > 0) setTimeout(() => remove(id), _ttl);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      show: (msg, type, ttl) => push(msg, type, ttl),
      success: (msg, ttl) => push(msg, "success", ttl),
      error: (msg, ttl) => push(msg, "error", ttl),
      info: (msg, ttl) => push(msg, "info", ttl),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "min-w-[220px] max-w-sm rounded-xl px-4 py-2 shadow-lg border text-sm backdrop-blur",
              t.type === "success" && "bg-green-50/90 border-green-200 text-green-800",
              t.type === "error" && "bg-red-50/90 border-red-200 text-red-800",
              t.type === "info" && "bg-white/90 border-black/10 text-black",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // No-op fallback pour éviter les crashs si le provider manque
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
