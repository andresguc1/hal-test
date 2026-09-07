import { useCallback, useEffect, useState } from "react";
import { api } from "../utils/api";

const CACHE_KEY = "hal_ai_models_cache";

export function getModelCacheKey(provider, baseUrl) {
  return `${provider || ""}|${baseUrl || ""}`;
}

export function readModelsCache(provider, baseUrl) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return all[getModelCacheKey(provider, baseUrl)] || null;
  } catch {
    return null;
  }
}

export function writeModelsCache(provider, baseUrl, models) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    all[getModelCacheKey(provider, baseUrl)] = models;
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // cache is best-effort, never break discovery
  }
}

export function clearModelsCache(provider, baseUrl) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    delete all[getModelCacheKey(provider, baseUrl)];
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // noop
  }
}

export async function fetchDiscoveredModels({ provider, apiKey, baseUrl }) {
  return api.post("/ai/discover-models", { provider, apiKey, baseUrl });
}

/**
 * Lists models for the active provider/base URL through
 * POST /api/ai/discover-models, cached per (provider|baseUrl) pair.
 */
export function useModelDiscovery({ provider, baseUrl, apiKey }) {
  const [state, setState] = useState("IDLE");
  const [models, setModels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setState("IDLE");
    setModels([]);
    setError(null);
  }, [provider, baseUrl]);

  const discover = useCallback(async () => {
    setLoading(true);
    setState("LOADING");
    setError(null);
    try {
      const cached = readModelsCache(provider, baseUrl);
      if (cached && Array.isArray(cached)) {
        setModels(cached);
        setState("SUCCESS");
        return;
      }
      const res = await fetchDiscoveredModels({ provider, apiKey, baseUrl });
      const nextState = res.state || "FAILED";
      const nextModels = Array.isArray(res.models) ? res.models : [];
      setState(nextState);
      setModels(nextModels);
      setError(res.error || null);
      if (nextState === "SUCCESS" && nextModels.length > 0) {
        writeModelsCache(provider, baseUrl, nextModels);
      }
    } catch (err) {
      setState("FAILED");
      setModels([]);
      setError(err.message || "Discovery failed");
    } finally {
      setLoading(false);
    }
  }, [provider, baseUrl, apiKey]);

  return { state, models, error, loading, discover };
}