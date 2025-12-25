/**
 * Status Indicator Component
 * Shows connection status, auto-save status, and execution progress
 */

import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, Save, Loader, CheckCircle } from "lucide-react";
import "./StatusIndicator.css";

/**
 * Status Indicator Component
 *
 * @param {Object} props
 * @param {boolean} props.isConnected - Backend connection status
 * @param {boolean} props.isSaving - Whether auto-save is in progress
 * @param {Object} props.executionStats - Execution statistics
 */
export default function StatusIndicator({
  isConnected = true,
  isSaving = false,
  executionStats,
}) {
  const { t } = useTranslation();
  return (
    <div className="status-indicator">
      {/* Connection Status */}
      <div
        className={`status-item ${isConnected ? "status-connected" : "status-disconnected"}`}
      >
        {isConnected ? (
          <>
            <Wifi size={16} />
            <span>{t("common.connected")}</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>{t("common.disconnected")}</span>
          </>
        )}
      </div>

      {/* Auto-save Status */}
      {isSaving && (
        <div className="status-item status-saving">
          <Loader size={16} className="spinning" />
          <span>{t("common.saving")}</span>
        </div>
      )}

      {/* Execution Stats */}
      {executionStats && executionStats.total > 0 && (
        <div className="status-item status-execution">
          <CheckCircle size={16} />
          <span>
            {executionStats.successful}/{executionStats.total} {t("common.executed")}
          </span>
        </div>
      )}
    </div>
  );
}
