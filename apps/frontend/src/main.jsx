import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";
import { ToastProvider, HalToaster } from "./components/Toast";
import { SettingsProvider } from "./context/SettingsContext";
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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="haltest-theme"
      >
        <ReactFlowProvider>
          <ToastProvider>
            <SettingsProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </SettingsProvider>
          </ToastProvider>
        </ReactFlowProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
