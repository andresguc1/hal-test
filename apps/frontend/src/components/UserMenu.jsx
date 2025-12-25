import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./styles/UserMenu.css";
import LanguageSelector from "./LanguageSelector";

/**
 * UserMenu with API status verification.
 * - By default queries: http://localhost:2001/api/status
 * - Checks when opening the menu and when clicking "Verify API"
 */
export default function UserMenu({
  apiUrl = "http://localhost:2001/api/status", // your local endpoint
  timeoutMs = 5000,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    state: "unknown", // 'unknown' | 'checking' | 'up' | 'down' | 'error'
    lastChecked: null,
    message: "",
    service: null,
    uptime: null, // seconds (number) if present in response
  });
  const menuRef = useRef(null);
  const abortRef = useRef(null);

  const toggleMenu = () => setOpen((s) => !s);

  // close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // check on open
  useEffect(() => {
    if (open) checkApiStatus();
    else {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const formatUptime = (seconds) => {
    if (typeof seconds !== "number" || Number.isNaN(seconds)) return null;
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hrs || days) parts.push(`${hrs}h`);
    if (mins || hrs || days) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const checkApiStatus = async () => {
    // cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setApiStatus((s) => ({
      ...s,
      state: "checking",
      message: t("api_status.checking"),
    }));

    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      );

      const responsePromise = fetch(apiUrl, { signal: controller.signal });

      const response = await Promise.race([responsePromise, timeout]);

      if (!response || controller.signal.aborted) {
        throw new Error("Aborted or no response");
      }

      const is2xx = response.status >= 200 && response.status < 300;

      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      const successFlag = body && body.success === true;
      const statusField =
        body && typeof body.status === "string"
          ? body.status.toLowerCase()
          : null;
      const serviceName = body && body.service ? String(body.service) : null;
      const uptimeSeconds =
        body &&
          (typeof body.uptime === "number" || !Number.isNaN(Number(body.uptime)))
          ? Number(body.uptime)
          : null;

      const isUp =
        is2xx && successFlag && (statusField === "ok" || statusField === "up");

      const newState = isUp ? "up" : is2xx ? "down" : "down";

      const msgParts = [];
      if (response && response.status) msgParts.push(`HTTP ${response.status}`);
      if (body && body.status) msgParts.push(`status: ${body.status}`);
      const msg = msgParts.join(" — ") || (is2xx ? "OK" : "No OK");

      setApiStatus({
        state: newState,
        lastChecked: new Date(),
        message: msg,
        service: serviceName,
        uptime: uptimeSeconds,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setApiStatus((s) => ({
          ...s,
          state: "unknown",
          message: t("api_status.request_cancelled"),
        }));
      } else if (err.message === "timeout") {
        setApiStatus({
          state: "error",
          lastChecked: new Date(),
          message: `Timeout (${timeoutMs}ms)`,
          service: null,
          uptime: null,
        });
      } else {
        setApiStatus({
          state: "error",
          lastChecked: new Date(),
          message: err.message || t("common.error"),
          service: null,
          uptime: null,
        });
      }
    } finally {
      abortRef.current = null;
    }
  };

  const renderStatusLabel = () => {
    const { state, lastChecked, message, service, uptime } = apiStatus;
    let label = t("api_status.unknown");
    if (state === "checking") label = t("api_status.checking");
    if (state === "up") label = t("api_status.up");
    if (state === "down") label = t("api_status.down");
    if (state === "error") label = t("api_status.error");

    return (
      <div className="api-status">
        <span className={`status-dot ${state}`} aria-hidden="true" />
        <div className="status-info">
          <div className="status-line">
            <strong>{t("api_status.status")}:</strong> <span>{label}</span>
          </div>

          {service && (
            <div className="status-sub">
              <strong>{service}</strong>
            </div>
          )}

          {typeof uptime === "number" && !Number.isNaN(uptime) && (
            <div className="status-sub">
              {t("api_status.uptime")}: {formatUptime(uptime)} ({Math.floor(uptime)}s)
            </div>
          )}

          <div className="status-sub">
            {lastChecked ? (
              <span className="last-checked">
                {t("api_status.last_checked")}: {new Date(lastChecked).toLocaleString()}
              </span>
            ) : (
              <span className="last-checked">{t("api_status.never_checked")}</span>
            )}
            {message ? <span className="status-msg"> — {message}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="burger-btn"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("api_status.open_menu")}
      >
        ☰
      </button>

      {open && (
        <div className="menu-dropdown" role="menu" aria-label={t("api_status.user_menu")}>
          <div className="profile-section">
            <img
              src="https://via.placeholder.com/40"
              alt={t("app.profile")}
              className="profile-pic"
            />
            <span className="username">{t("app.user")}</span>
          </div>

          <div className="menu-section api-section">
            {renderStatusLabel()}
            <div className="api-actions">
              <button
                className="check-api-btn"
                onClick={checkApiStatus}
                disabled={apiStatus.state === "checking"}
                aria-disabled={apiStatus.state === "checking"}
              >
                {apiStatus.state === "checking"
                  ? t("api_status.checking")
                  : t("api_status.verify_api")}
              </button>
            </div>
          </div>

          <ul className="menu-options" role="menu">
            <li role="menuitem" className="menu-item-language">
              <LanguageSelector />
            </li>
            <li role="menuitem">{t("app.profile")}</li>
            <li role="menuitem">{t("app.settings")}</li>
            <li role="menuitem">{t("app.logout")}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
