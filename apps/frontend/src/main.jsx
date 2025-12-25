import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";
import { ToastProvider } from "./components/Toast";
import "./index.css";
import "./i18n";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ReactFlowProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ReactFlowProvider>
  </StrictMode>,
);
