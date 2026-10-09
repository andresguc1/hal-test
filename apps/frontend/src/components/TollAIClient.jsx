import React, { useEffect, useState, useRef } from "react";

const CLIENT_SRC = "/tollai/client.js";

const TollAIClient = ({ enabled = true, onVerified, onChallenge }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const verify = () => {
      if (cancelled) return;
      if (!window.TollAI) {
        setIsLoading(true);
        onChallenge && onChallenge();
        return;
      }
      setIsLoading(true);
      window.TollAI.establish()
        .then(() => {
          if (cancelled) return;
          setHasSession(true);
          onVerified && onVerified();
        })
        .catch((error) => {
          console.error("TollAI verification failed:", error);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    };

    const loadScript = () => {
      if (window.TollAI) {
        verify();
        return;
      }
      const script = document.createElement("script");
      script.src = CLIENT_SRC;
      script.async = true;
      script.onload = verify;
      script.onerror = () => {
        console.error("Failed to load TollAI client script");
        if (!cancelled) setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      cancelled = true;
    };
  }, [enabled, onVerified, onChallenge]);

  useEffect(() => {
    if (hasSession && ref.current) {
      ref.current.style.display = "none";
    }
  }, [hasSession]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 w-full h-full bg-slate-950/80 backdrop-blur-zxl z-50 flex items-center justify-center pointer-events-none"
    >
      {isLoading && (
        <div className="text-white text-sm">
          <span>Verifying human access...</span>
        </div>
      )}
      {!hasSession && isLoading && (
        <div className="mt-4 text-slate-400 text-xs">
          <span>
            This helps prevent automated bots from accessing the platform.
          </span>
        </div>
      )}
    </div>
  );
};

export default TollAIClient;
