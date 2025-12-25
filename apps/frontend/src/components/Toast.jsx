/**
 * Toast Notification System
 * Non-intrusive notifications for user feedback
 */

import React, { useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToastType } from "./toastTypes";
import { ToastContext } from "./toastContext";
import "./Toast.css";

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (message, type = ToastType.INFO, duration = 3000) => {
      const id = Date.now() + Math.random();
      const toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => {
      return addToast(message, ToastType.SUCCESS, duration);
    },
    [addToast],
  );

  const error = useCallback(
    (message, duration) => {
      return addToast(message, ToastType.ERROR, duration);
    },
    [addToast],
  );

  const warning = useCallback(
    (message, duration) => {
      return addToast(message, ToastType.WARNING, duration);
    },
    [addToast],
  );

  const info = useCallback(
    (message, duration) => {
      return addToast(message, ToastType.INFO, duration);
    },
    [addToast],
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container Component
 */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function Toast({ toast, onRemove }) {
  const { t } = useTranslation();
  const getIcon = () => {
    switch (toast.type) {
      case ToastType.SUCCESS:
        return <CheckCircle size={20} />;
      case ToastType.ERROR:
        return <XCircle size={20} />;
      case ToastType.WARNING:
        return <AlertCircle size={20} />;
      case ToastType.INFO:
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{toast.message}</div>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label={t("common.close_notification")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
