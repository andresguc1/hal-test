import React, { useState } from "react";
import { ExternalLink, X } from "lucide-react";

const EvidenceCard = ({ screenshotUrl, durationMs, timestamp }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [hasError, setHasError] = useState(false);

  // Handle URL formatting (blob, data, or server path)
  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;

    // In development, we might need to point to the backend server (e.g. localhost:2001)
    // Check if we have an environment variable for the API URL
    const apiBase = import.meta.env.VITE_API_URL || "";
    const serverBase = apiBase.replace(/\/api$/, ""); // Extract base from /api suffix

    // Cache busting for server paths
    const ts = timestamp || Date.now();
    const separator = url.includes("?") ? "&" : "?";

    // Ensure path starts with /
    const path = url.startsWith("/") ? url : `/${url}`;

    return `${serverBase}${path}${separator}t=${ts}`;
  };

  const displayUrl = getFullUrl(screenshotUrl);

  // If no URL or if verified broken, don't render
  if (!screenshotUrl || hasError) return null;

  return (
    <>
      {/* CARD PREVIEW */}
      <div className="mt-3 p-3 rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-sm shadow-lg group">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Last Run Evidence
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {durationMs ? `${durationMs}ms` : "Just now"}
          </span>
        </div>

        {/* Thumbnail */}
        <div
          className="relative cursor-zoom-in overflow-hidden rounded-lg border border-white/5 shadow-inner bg-black/50 aspect-video"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={displayUrl}
            alt="Execution Evidence"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            loading="lazy"
            onError={() => setHasError(true)} // HIDE ON ERROR
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 flex items-center gap-2">
              <ExternalLink size={12} />
              Expand
            </span>
          </div>
        </div>

        {/* Footer / Status */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-1 rounded-md font-semibold border border-green-500/20">
            ✓ Captured Successfully
          </span>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            <X size={24} />
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] rounded-lg overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayUrl}
              alt="Fullscreen Evidence"
              className="max-h-[90vh] w-auto object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 text-xs font-mono border border-white/10">
              {screenshotUrl}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EvidenceCard;
