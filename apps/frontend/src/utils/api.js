// Utility to normalize URL paths, preventing double slashes or duplicated /api segments
const normalizeUrl = (base, path) => {
  // If path is a full URL, return it as-is
  if (path.startsWith("http")) return path;

  // Clean base: remove trailing slash
  let cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;

  // Ensure path starts with slash
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  // Add /api prefix if not present in base
  if (!cleanBase.endsWith("/api")) {
    cleanBase = `${cleanBase}/api`;
  }

  return `${cleanBase}${cleanPath}`;
};

const ENV_API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "/api");
const API_BASE_URL = ENV_API_URL;

import { supabase } from "./supabaseClient";

const getHeaders = async () => {
  const headers = { "Content-Type": "application/json" };

  // Skip Supabase Session if Auth is disabled (ONLY allowed in non-production)
  const isProd = import.meta.env.MODE === "production";
  const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";
  const isLocalMode = import.meta.env.VITE_HALTEST_MODE === "local";

  if (isLocalMode || (!isProd && !isAuthEnabled)) {
    headers["Authorization"] = `Bearer local-guest-token`;
  } else {
    // Supabase Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  }

  // Legacy keys
  const apiKey = localStorage.getItem("hal_openai_key");
  const googleKey = localStorage.getItem("hal_google_key");
  const anthropicKey = localStorage.getItem("hal_anthropic_key");
  const grokKey = localStorage.getItem("hal_grok_key");
  const model = localStorage.getItem("hal_openai_model");

  if (apiKey) headers["x-openai-key"] = apiKey;
  if (googleKey) headers["x-google-key"] = googleKey;
  if (anthropicKey) headers["x-anthropic-key"] = anthropicKey;
  if (grokKey) headers["x-grok-key"] = grokKey;
  if (model) headers["x-openai-model"] = model;

  // New Unified Keys (APIKeysModal)
  const storedKeys = localStorage.getItem("haltest_api_keys");
  if (storedKeys) {
    try {
      const keys = JSON.parse(storedKeys);
      if (keys.openai) headers["x-openai-key"] = keys.openai;
      if (keys.anthropic) headers["x-anthropic-key"] = keys.anthropic;
    } catch (e) {
      console.error("Error parsing haltest_api_keys", e);
    }
  }

  // --- STANDARD AI HEADERS (Hal AI Config) ---
  const aiConfigStr = localStorage.getItem("hal_ai_config");
  if (aiConfigStr) {
    try {
      const aiConfig = JSON.parse(aiConfigStr);
      const activeProvider = aiConfig.activeProvider;
      const activeKey = aiConfig.keys?.[activeProvider];
      const activeModel = aiConfig.selectedModel;

      if (activeKey) {
        headers["x-ai-api-key"] = activeKey;
      }
      if (activeModel) {
        headers["x-ai-model"] = activeModel;
      }
      if (activeProvider) {
        headers["x-ai-provider"] = activeProvider;
      }
      if (aiConfig.baseUrl) {
        headers["x-ai-base-url"] = aiConfig.baseUrl;
      }
      if (aiConfig.useExperienceVault !== undefined) {
        headers["x-hal-experience-vault"] =
          aiConfig.useExperienceVault.toString();
      }
      if (aiConfig.enableFineTuning !== undefined) {
        headers["x-hal-fine-tuning"] = aiConfig.enableFineTuning.toString();
      }
    } catch (e) {
      console.error("Error parsing hal_ai_config", e);
    }
  }

  return headers;
};

export const api = {
  async get(endpoint, customConfig = {}) {
    const headers = {
      ...(await getHeaders()),
      ...(customConfig.headers || {}),
    };
    const response = await fetch(normalizeUrl(API_BASE_URL, endpoint), {
      headers,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json();
  },

  async post(endpoint, data, customConfig = {}) {
    const headers = {
      ...(await getHeaders()),
      ...(customConfig.headers || {}),
    };
    const response = await fetch(normalizeUrl(API_BASE_URL, endpoint), {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json();
  },

  async put(endpoint, data, customConfig = {}) {
    const headers = {
      ...(await getHeaders()),
      ...(customConfig.headers || {}),
    };
    const response = await fetch(normalizeUrl(API_BASE_URL, endpoint), {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json();
  },

  async delete(endpoint, data = null, customConfig = {}) {
    const headers = {
      ...(await getHeaders()),
      ...(customConfig.headers || {}),
    };
    const options = {
      method: "DELETE",
      headers,
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(normalizeUrl(API_BASE_URL, endpoint), options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json();
  },

  getFileUrl(filePath) {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;

    const apiBase =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? window.location.origin : "http://localhost:2001");

    return `${apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase}/${filePath}`;
  },
};
