const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "/api");

import { supabase } from "./supabaseClient";

const getHeaders = async () => {
  const headers = { "Content-Type": "application/json" };

  // Skip Supabase Session if Auth is disabled (ONLY allowed in non-production)
  const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
  if (isDev && import.meta.env.VITE_AUTH_ENABLED === "false") {
    headers["Authorization"] = `Bearer local-dev-token`;
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
    } catch (e) {
      console.error("Error parsing hal_ai_config", e);
    }
  }

  return headers;
};

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: await getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
};
