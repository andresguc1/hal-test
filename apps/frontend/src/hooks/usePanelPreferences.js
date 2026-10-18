import { useCallback, useEffect, useState } from "react";

function readStored(key, defaults) {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

/**
 * Persists a small object of UI preferences in localStorage.
 * Returns the current preferences and a setter that accepts either a partial
 * patch object or an updater function `(prev) => patch`.
 */
export function usePanelPreferences(key, defaults) {
  const [prefs, setPrefs] = useState(() => readStored(key, defaults));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [key, prefs]);

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  return [prefs, updatePrefs];
}
