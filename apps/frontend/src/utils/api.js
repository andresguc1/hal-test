const API_BASE_URL = import.meta.env.PROD
  ? "https://hal-test-backend.onrender.com/api"
  : (import.meta.env.VITE_API_BASE || "/api");

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
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

  return headers;
};

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
};
