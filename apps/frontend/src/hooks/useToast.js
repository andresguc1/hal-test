/**
 * Toast Hook
 * Custom hook to use toast notifications
 */

import { useContext } from "react";
import { ToastContext } from "../components/toastContext";

/**
 * Hook to use toast notifications
 * Must be used within ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
