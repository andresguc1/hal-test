// TollAI Client Script for hal-test Landing Page
// This script handles proof-of-work challenge in the browser

(function () {
  "use strict";

  // Configuration - match server defaults
  const CONFIG = {
    powDifficulty: 14,
    minResponseTime: 1500, // humans take >1500ms
    minDwellMs: 1500, // minimum time on page
    sessionTTL: 15 * 60 * 1000, // 15 minutes
  };

  // Check for existing session cookie
  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp("(^|;)\\s*" + name + "\\s*=")
    );
    return match ? match.slice(1).pop() : null;
  }

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie =
      name + "=" + value + expires + ";path=/;samesite=lax";
  }

  // Initialize TollAI flow
  async function initTollAI() {
    // Check for existing valid session
    const token = getCookie("tollai_session");
    if (token) {
      // Already have a session - verify it
      await verifySession(token);
      return;
    }

    // No session - start the toll AI flow
    await startTollAIFlow();
  }

  async function verifySession(token) {
    try {
      const response = await fetch("/tollai/status", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.status === "ok" && data.activeSessions > 0) {
        // Session is valid - mark the page as verified
        document.body.classList.add("tollai-verified");
        console.log("TollAI session verified");
      }
    } catch (error) {
      console.error("TollAI session verification failed:", error);
      // Session invalid - start new flow
      setCookie("tollai_session", "", -1);
      await startTollAIFlow();
    }
  }

  async function startTollAIFlow() {
    try {
      // Step 1: Issue proof-of-work challenge
      const challengeResponse = await fetch("/tollai/challenge", {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      const challengeData = await challengeResponse.json();

      if (!challengeData.challenge) {
        console.error("Failed to get challenge");
        return;
      }

      // Store challenge data for later verification
      window.tollaiCurrentChallenge = challengeData;

      // Step 2: The PoW is computed by the browser client script
      // The challenge involves computing SHA-256 hashes with leading zeros
      // This is done in the background and takes approx. 450ms

      // Step 3: Poll for session creation
      let attempts = 0;
      const maxAttempts = 50;

      const checkSession = async () => {
        attempts++;
        const statusResponse = await fetch("/tollai/status", {
          credentials: "include",
        });
        const statusData = await statusResponse.json();

        if (statusData.activeSessions && statusData.activeSessions > 0) {
          // Session established
          const sessionToken = getCookie("tollai_session");
          if (sessionToken) {
            document.body.classList.add("tollai-verified");
            setCookie(
              "tollai_session",
              sessionToken,
              1 // 1 day TTL
            );
            console.log("TollAI session verified after PoW");
          }
          return true;
        }

        if (attempts >= maxAttempts) {
          console.error("TollAI timeout - max polling attempts reached");
          // Show notice but don't block
          showTollNotice("Verification timed out");
          return false;
        }

        // Wait 1 second before checking again
        return new Promise((resolve) => setTimeout(resolve, 1000)).then(
          checkSession
        );
      };

      return checkSession();
    } catch (error) {
      console.error("TollAI flow error:", error);
      showTollNotice("Verification error");
      return false;
    }
  }

  function showTollNotice(message) {
    const notice = document.createElement("div");
    notice.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      border: 1px solid #3b82f6;
      padding: 12px 20px;
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 14px;
      z-index: 9999;
      max-width: 400px;
      text-align: center;
    `;
    notice.textContent = message || "Verifying human access...";
    document.body.appendChild(notice);

    setTimeout(() => notice.remove(), 5000);
  }

  // Initialize on DOM content loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTollAI);
  } else {
    initTollAI();
  }

  // Expose for debugging
  window.TollAIClient = {
    initTollAI,
    CONFIG,
  };
})();