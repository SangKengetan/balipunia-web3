import { useState } from "react";
import ToastContainer from "./ToastContainer";
import ToastContext from "./ToastContext";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const pushToast = (toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (!toast.confirm) {
      setTimeout(() => removeToast(id), 3000);
    }
  };

  const api = {
    success: (message) =>
      pushToast({ type: "success", message }),
    error: (message) =>
      pushToast({ type: "error", message }),
    confirm: (message, onConfirm) =>
      pushToast({
        type: "confirm",
        message,
        confirm: true,
        onConfirm,
      }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </ToastContext.Provider>
  );
}
