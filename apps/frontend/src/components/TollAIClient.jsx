import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

const TollAIClient = ({ enabled = true, onVerified, onChallenge }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const loadScript = () => {
      if (window.TollAI) {
        console.log("TollAI global already loaded");
        checkSession();
        return;
      }

      const script = document.createElement("script");
      script.src = "/tollai-client.js";
      script.async = true;
      script.onload = () => {
        console.log("TollAI client script loaded");
        checkSession();
      };
      script.onerror = () => {
        console.error("Failed to load TollAI client script");
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    };

    const checkSession = () => {
      const token = document.cookie.match(/tollai_session=([^;]+)/);
      if (token) {
        // Session exists, verify it
        if (window.TollAI && window.TollAI.verifySession) {
          window.TollAI.verifySession(token[1]).then(verified => {
            if (verified) {
              setHasSession(true);
              onVerified && onVerified();
            }
          });
        } else {
          setHasSession(true);
          onVerified && onVerified();
        }
      } else {
        setIsLoading(true);
        startTollAI flow();
      }
    };

    const startTollAI flow = async () => {
      try {
        // Step 1: Issue proof challenge
        const challenge = await window.TollAI.issueProofChallenge();
        console.log("PoW challenge issued:", challenge);

        // Step 2: Render challenge UI or auto-run PoW
        // The client script handles the PoW in the background
        // After PoW is complete, the page reloads with a session cookie

        // Step 3: Check if we need to wait for PoW completion
        const pollSession = setInterval(async () => {
          const token = document.cookie.match(/tollai_session=([^;]+)/);
          if (token) {
            clearInterval(pollSession);
            setHasSession(true);
            onVerified && onVerified();
          }
        }, 1000);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(pollSession);
          setIsLoading(false);
        }, 30000);
      } catch (error) {
        console.error("TollAI flow error:", error);
        setIsLoading(false);
      }
    };

    loadScript();

    return () => {
      // Cleanup on unmount
    };
  }, [enabled, onVerified]);

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
          <span>This helps prevent automated bots from accessing the platform.</span>
        </div>
      )}
    </div>
  );
};

export default TollAIClient;