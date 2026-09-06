import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Globe, Loader2, Recycle } from "lucide-react";
import { api } from "../utils/api";
import { useTranslation } from "react-i18next";

const POLL_MS_OPEN = 10_000;
const POLL_MS_CLOSED = 60_000;

const formatUptime = (ms) => {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

/**
 * Live snapshot of the backend browser sessions (Fase 2–6): shows the active
 * count and engine/owner per session, plus a manual "reap orphans" trigger
 * (kills sealed processes whose Playwright handle was lost).
 *
 * Polling is load-aware: 10s while the popover is open, 60s otherwise, paused
 * entirely while the tab is hidden, and state is only committed when the
 * snapshot actually changes — so the header stays silent between updates.
 */
export default function BrowserSessionsChip({ className }) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(false);
  const [reaping, setReaping] = useState(false);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);
  const lastSnapshotRef = useRef("");

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/inspector/sessions");
      if (!res?.success) return;
      const next = res.details ?? [];
      const serialized = JSON.stringify(next);
      if (serialized !== lastSnapshotRef.current) {
        lastSnapshotRef.current = serialized;
        setSessions(next);
      }
    } catch {
      /* backend offline — keep last known state */
    }
  }, []);

  const hiddenRef = useRef(document.hidden);

  useEffect(() => {
    const onVisibility = () => {
      hiddenRef.current = document.hidden;
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!hiddenRef.current) refresh();
    }, open ? POLL_MS_OPEN : POLL_MS_CLOSED);
    return () => clearInterval(timer);
  }, [refresh, open]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (ev) => {
      if (popoverRef.current && !popoverRef.current.contains(ev.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const handleReap = async () => {
    setReaping(true);
    setError(null);
    try {
      const res = await api.post("/inspector/reap");
      if (res?.success) {
        await refresh();
      } else {
        setError(res?.message || "Reap failed");
      }
    } catch (err) {
      setError(err?.message || "Reap failed");
    } finally {
      setReaping(false);
    }
  };

  if (sessions.length === 0 && !error) return null;

  return (
    <div ref={popoverRef} className={`relative ml-2 shrink-0 ${className ?? ""}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        title={t("header.sessions", "Active browser sessions")}
        aria-label={t("header.sessions", "Active browser sessions")}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 cursor-pointer"
      >
        <Globe size={12} className="text-indigo-400" />
        <span className="text-[10px] font-bold tabular-nums">{sessions.length}</span>
      </motion.button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] shadow-2xl p-3 text-xs text-[var(--text-primary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold tracking-tight">
              {t("header.sessions", "Active browser sessions")}
            </span>
            <button
              type="button"
              onClick={handleReap}
              disabled={reaping}
              title={t("header.reap", "Reap orphaned browser processes")}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 cursor-pointer disabled:opacity-50"
            >
              {reaping ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Recycle size={11} />
              )}
              {t("header.reap", "Reap orphans")}
            </button>
          </div>

          {error && (
            <div className="mb-2 text-rose-400 text-[10px]">{error}</div>
          )}

          {sessions.length === 0 ? (
            <div className="text-slate-400">No active sessions</div>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <li
                  key={s.browserId}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 bg-slate-500/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-[10px] text-indigo-400 truncate">
                        {s.browserId}
                      </code>
                      <span className="text-[9px] uppercase tracking-wide text-slate-400">
                        {s.browserType}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {s.runId ? `run ${s.runId}` : "ui/debug"}
                      {s.pid ? ` · pid ${s.pid}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                    {formatUptime(s.uptimeMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}