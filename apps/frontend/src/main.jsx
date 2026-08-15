/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";
import { ToastProvider, HalToaster } from "./components/Toast";
import { SettingsProvider } from "./context/SettingsContext";
import { LogProvider } from "./context/LogContext";
import { ThemeProvider } from "./components/theme-provider";
import "./index.css";
import "./i18n";
import App from "./App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

import { AuthProvider } from "./context/AuthContext";
import { AIProvider } from "./context/AIContext";

const DevtoolsWrapper = () => {
  const [show, setShow] = useState(
    import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === "true",
  );

  useEffect(() => {
    window.toggleQueryDevtools = () => setShow((prev) => !prev);
    console.info(
      "💡 TanStack Devtools ocultas. Ejecuta window.toggleQueryDevtools() en consola para mostrarlas.",
    );
  }, []);

  if (!show) return null;
  return (
    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
  );
};

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="haltest-theme"
    >
      <ReactFlowProvider>
        <ToastProvider>
          <AuthProvider>
            <SettingsProvider>
              <LogProvider>
                <AIProvider>
                  <App />
                </AIProvider>
              </LogProvider>
            </SettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </ReactFlowProvider>
    </ThemeProvider>
    {import.meta.env.DEV && <DevtoolsWrapper />}
  </QueryClientProvider>,
);
