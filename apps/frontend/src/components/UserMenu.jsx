import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./styles/UserMenu.css";
import LanguageSelector from "./LanguageSelector";

import {
  User,
  Settings,
  ChevronLeft,
  LogOut,
  Check,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";

/**
 * UserMenu with internal navigation for Settings.
 * - Main View: Profile, API Status, Navigation Links
 * - Settings View: Strict Sequential Flow (Provider -> LLM Model -> API Key)
 */
export default function UserMenu({
  apiUrl = "http://localhost:2001/api/status",
  timeoutMs = 5000,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [menuView, setMenuView] = useState("main"); // 'main' | 'settings'

  // Settings State
  const [apiKey, setApiKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [grokKey, setGrokKey] = useState("");

  // Initialize with empty strings to enforce selection flow unless loaded from storage
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");

  const [profilePic, setProfilePic] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // API Status State
  const [apiStatus, setApiStatus] = useState({
    state: "unknown",
    lastChecked: null,
    message: "",
    service: null,
    uptime: null,
  });

  const menuRef = useRef(null);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);

  const toggleMenu = () => {
    setOpen((s) => !s);
    setMenuView("main");
  };

  // Load settings on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("hal_openai_key");
    const storedGoogleKey = localStorage.getItem("hal_google_key");
    const storedAnthropicKey = localStorage.getItem("hal_anthropic_key");
    const storedGrokKey = localStorage.getItem("hal_grok_key");
    const storedModel = localStorage.getItem("hal_openai_model");
    const storedProvider = localStorage.getItem("hal_ai_provider"); // No default here
    const storedPic = localStorage.getItem("hal_user_avatar");

    if (storedKey) setApiKey(storedKey);
    if (storedGoogleKey) setGoogleKey(storedGoogleKey);
    if (storedAnthropicKey) setAnthropicKey(storedAnthropicKey);
    if (storedGrokKey) setGrokKey(storedGrokKey);

    if (storedProvider) setProvider(storedProvider);
    // Only set model if provider is also present (maintain consistency)
    if (storedProvider && storedModel) setModel(storedModel);

    if (storedPic) setProfilePic(storedPic);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check API on open (Main view only)
  useEffect(() => {
    if (open && menuView === "main") checkApiStatus();
    else {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menuView]);

  const saveSettings = async () => {
    // 1. Validate inputs
    if (!apiKey) return;

    setSaveStatus("saving"); // Display "Validating..."

    try {
      // 2. Call Validation Endpoint
      const response = await fetch("http://localhost:2001/api/ai/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: getActiveKey(), // Use the helper to get the right key
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Validation failed");
      }

      // 3. Save if successful
      localStorage.setItem("hal_openai_key", apiKey.trim());
      localStorage.setItem("hal_google_key", googleKey.trim());
      localStorage.setItem("hal_anthropic_key", anthropicKey.trim());
      localStorage.setItem("hal_grok_key", grokKey.trim());

      if (model) localStorage.setItem("hal_openai_model", model);
      if (provider) localStorage.setItem("hal_ai_provider", provider);

      if (profilePic) {
        localStorage.setItem("hal_user_avatar", profilePic);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Validation Error:", err);
      setSaveStatus("error"); // You might want to add CSS for .error
      alert(`Validation Failed: ${err.message}`); // Simple feedback for now
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getActiveKey = () => {
    switch (provider) {
      case "openai":
        return apiKey;
      case "google":
        return googleKey;
      case "anthropic":
        return anthropicKey;
      case "grok":
        return grokKey;
      default:
        return apiKey;
    }
  };

  const setActiveKey = (val) => {
    switch (provider) {
      case "openai":
        setApiKey(val);
        break;
      case "google":
        setGoogleKey(val);
        break;
      case "anthropic":
        setAnthropicKey(val);
        break;
      case "grok":
        setGrokKey(val);
        break;
    }
  };

  const getPlaceholder = () => {
    switch (provider) {
      case "openai":
        return "sk-... (OpenAI Key)";
      case "google":
        return "AIza... (Google Key)";
      case "anthropic":
        return "sk-ant-... (Anthropic Key)";
      case "grok":
        return "xai-... (Grok Key)";
      default:
        return "API Key";
    }
  };

  // --- API CHECK LOGIC ---
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

      if (!response || controller.signal.aborted)
        throw new Error("Aborted or no response");

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
      } else {
        setApiStatus({
          state: "error",
          lastChecked: new Date(),
          message:
            err.message === "timeout"
              ? `Timeout (${timeoutMs}ms)`
              : err.message || t("common.error"),
          service: null,
          uptime: null,
        });
      }
    } finally {
      abortRef.current = null;
    }
  };

  // --- RENDER HELPERS ---

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
              {t("api_status.uptime")}: {formatUptime(uptime)} (
              {Math.floor(uptime)}s)
            </div>
          )}
          <div className="status-sub">
            {lastChecked ? (
              <span className="last-checked">
                {t("api_status.last_checked")}:{" "}
                {new Date(lastChecked).toLocaleString()}
              </span>
            ) : (
              <span className="last-checked">
                {t("api_status.never_checked")}
              </span>
            )}
            {message ? <span className="status-msg"> — {message}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  const renderMainView = () => (
    <>
      <div className="profile-section">
        <div className="profile-pic-wrapper">
          {profilePic ? (
            <img src={profilePic} alt="User" className="profile-pic-img" />
          ) : (
            <div className="profile-pic-placeholder">
              <User size={24} />
            </div>
          )}
        </div>
        <span className="username">{t("app.user")}</span>
      </div>

      <div className="menu-section api-section">
        {renderStatusLabel()}
        <div className="api-actions">
          <button
            className="check-api-btn"
            onClick={checkApiStatus}
            disabled={apiStatus.state === "checking"}
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
        <li
          role="menuitem"
          className="menu-item-with-icon"
          onClick={() => setMenuView("settings")}
        >
          <Settings size={16} />
          {t("app.settings")}
        </li>
        <li role="menuitem" className="menu-item-with-icon">
          <LogOut size={16} />
          {t("app.logout")}
        </li>
      </ul>
    </>
  );

  const renderSettingsView = () => (
    <div className="settings-view">
      <div className="menu-header">
        <button className="back-btn" onClick={() => setMenuView("main")}>
          <ChevronLeft size={20} />
        </button>
        <h3>{t("app.settings")}</h3>
      </div>

      <form
        className="settings-content"
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings();
        }}
      >
        {/* Profile Picture Upload */}
        <div className="setting-group profile-upload-group">
          <label className="setting-label">Profile Picture</label>
          <div className="profile-upload-container">
            <div
              className="profile-upload-preview"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePic ? (
                <img src={profilePic} alt="Preview" />
              ) : (
                <User size={24} className="text-gray-400" />
              )}
              <div className="upload-overlay">
                <Camera size={16} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept="image/*"
            />
          </div>
        </div>

        {/* 1. PROVIDER */}
        <div className="setting-group">
          <label className="setting-label">1. Provider</label>
          <select
            className="setting-select"
            value={provider}
            onChange={(e) => {
              const val = e.target.value;
              setProvider(val);
              setModel(""); // Clear model on provider change to enforce flow
            }}
          >
            <option value="" disabled>
              Select Provider
            </option>
            <option value="openai">OpenAI</option>
            <option value="google">Google</option>
            <option value="anthropic">Anthropic</option>
            <option value="grok">Grok (xAI)</option>
          </select>
        </div>

        {/* 2. LLM MODEL (Hidden until Provider selected) */}
        {provider && (
          <div className="setting-group fade-in">
            <label className="setting-label">2. LLM Model</label>
            <select
              className="setting-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="" disabled>
                Select LLM Model
              </option>
              {provider === "openai" && (
                <>
                  <optgroup label="GPT-4o (Standard)">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </optgroup>
                  <optgroup label="Reasoning (o-series)">
                    <option value="o1">o1 (Deep Reasoning)</option>
                    <option value="o1-mini">o1 Mini (Fast Reasoning)</option>
                    <option value="o3-mini">o3 Mini (High Intelligence)</option>
                  </optgroup>
                </>
              )}
              {provider === "google" && (
                <>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-2.0-pro-exp-02-05">
                    Gemini 2.0 Pro Experimental
                  </option>
                </>
              )}
              {provider === "anthropic" && (
                <>
                  <option value="claude-3-5-sonnet-latest">
                    Claude 3.5 Sonnet (Latest)
                  </option>
                  <option value="claude-3-5-haiku-latest">
                    Claude 3.5 Haiku (Latest)
                  </option>
                  <option value="claude-3-opus-latest">
                    Claude 3 Opus (Latest)
                  </option>
                </>
              )}
              {provider === "grok" && (
                <>
                  <option value="grok-2-1212">Grok 2 (Latest)</option>
                  <option value="grok-2-vision-1212">Grok 2 Vision</option>
                  <option value="grok-beta">Grok Beta (Legacy)</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* 3. API KEY (Hidden until Model selected) */}
        {provider && model && (
          <div className="setting-group fade-in">
            <label className="setting-label">
              3. API Key for{" "}
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </label>
            <div className="api-input-wrapper">
              <input
                type={showKey ? "text" : "password"}
                name="apiKey"
                autoComplete="off"
                className="setting-input"
                value={getActiveKey()}
                onChange={(e) => setActiveKey(e.target.value)}
                placeholder={getPlaceholder()}
              />
              <button
                type="button"
                className="icon-btn toggle-visibility"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide" : "Show"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className={`full-width-btn ${saveStatus}`}
              disabled={!getActiveKey()}
            >
              {saveStatus === "saving"
                ? "Validating..."
                : saveStatus === "saved"
                  ? "Validated & Saved!"
                  : "Validate & Save"}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="burger-btn" onClick={toggleMenu}>
        {profilePic ? (
          <img src={profilePic} alt="User" className="profile-pic" />
        ) : (
          <div className="profile-pic-placeholder">
            <User size={24} />
          </div>
        )}
      </button>

      {open && (
        <div className="menu-dropdown">
          {menuView === "main" ? renderMainView() : renderSettingsView()}
        </div>
      )}
    </div>
  );
}
