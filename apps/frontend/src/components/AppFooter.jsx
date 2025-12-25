import { useTranslation } from "react-i18next";
import "./styles/AppFooter.css";

// ========================================
// ICONOS SVG
// ========================================

const IconExecute = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
  </svg>
);

const IconSave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zM12 19a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5-11H7V5h10v3z"
    />
  </svg>
);

const IconExport = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v6h5.66V9h3.84L12 2z"
    />
  </svg>
);

const IconImport = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M19 3H5a2 2 0 0 0-2 2v12h2V5h14V3zm-7 5l-5 5h3v4h4v-4h3l-5-5z"
    />
  </svg>
);

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function AppFooter({
  onExecuteFlow,
  onSave,
  onExport,
  onImport,
}) {
  const { t } = useTranslation();
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-left">
        <button
          type="button"
          className="btn btn-execute"
          onClick={onExecuteFlow}
          title={t("common.execute_flow_tooltip")}
        >
          <IconExecute />
          <span>{t("common.execute_flow")}</span>
        </button>
      </div>

      <div className="footer-right">
        <button
          type="button"
          className="btn btn-save"
          onClick={onSave}
          title={t("common.save_flow_tooltip")}
        >
          <IconSave />
          <span>{t("common.save")}</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onExport}
          title={t("common.export_flow_tooltip")}
        >
          <IconExport />
          <span>{t("common.export")}</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onImport}
          title={t("common.import_flow_tooltip")}
        >
          <IconImport />
          <span>{t("common.import")}</span>
        </button>
      </div>
    </footer>
  );
}
