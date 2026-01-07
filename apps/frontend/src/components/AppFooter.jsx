import { useTranslation } from "react-i18next";
import { Play, Save, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppFooter({
  onExecuteFlow,
  onSave,
  onExport,
  onImport,
}) {
  const { t } = useTranslation();
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 flex h-14 items-center justify-between border-t border-hal-neutral-800 bg-hal-neutral-950 px-5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <Button
          onClick={onExecuteFlow}
          className="bg-hal-warning-500 text-hal-neutral-950 hover:bg-hal-warning-600 border-none shadow-[0_0_8px_rgba(245,158,11,0.4)] hover:shadow-[0_0_12px_rgba(245,158,11,0.6)] font-semibold gap-2 px-4 transition-all duration-200"
          title={t("common.execute_flow_tooltip")}
        >
          <Play size={16} fill="currentColor" />
          <span>{t("common.execute_flow")}</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          className="bg-hal-neutral-800 border border-hal-neutral-700 text-hal-neutral-100 hover:bg-hal-neutral-700 hover:border-hal-neutral-600 hover:shadow-[0_0_8px_rgba(161,161,170,0.3)] gap-2 px-4 font-medium transition-all duration-200"
          title={t("common.save_flow_tooltip")}
        >
          <Save size={16} />
          <span>{t("common.save")}</span>
        </Button>
        <Button
          variant="secondary"
          onClick={onExport}
          className="bg-hal-neutral-900 border border-hal-neutral-800 text-hal-neutral-400 hover:bg-hal-neutral-800 hover:text-hal-neutral-100 hover:border-hal-neutral-700 gap-2 px-4 font-medium transition-all duration-200"
          title={t("common.export_flow_tooltip")}
        >
          <Download size={16} />
          <span>{t("common.export")}</span>
        </Button>
        <Button
          variant="secondary"
          onClick={onImport}
          className="bg-hal-neutral-900 border border-hal-neutral-800 text-hal-neutral-400 hover:bg-hal-neutral-800 hover:text-hal-neutral-100 hover:border-hal-neutral-700 gap-2 px-4 font-medium transition-all duration-200"
          title={t("common.import_flow_tooltip")}
        >
          <Upload size={16} />
          <span>{t("common.import")}</span>
        </Button>
      </div>
    </footer>
  );
}
