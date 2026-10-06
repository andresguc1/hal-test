// TollAI Client Script for hal-test - Proof of Work Verification
// This script handles proof-of-work challenge in the browser

(function () {
  "use strict";

  const CONFIG = {
    powDifficulty: 20, // bits
    minResponseTime: 1500,
    minDwellMs: 1500,
    sessionTTL: 15 * 60 * 1000,
  };

  let isPoWRunning = false;
  let isVerified = false;

  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|;)\\s*" + name + "\\s*="));
    return match ? decodeURIComponent(match[0].split("=")[1]) : null;
  }

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + ";path=/;samesite=lax";
  }

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function computeProofOfWork(challengeId, difficulty) {
    const zeroHexDigits = Math.ceil(difficulty / 4);
    const target = BigInt("0x" + "0".repeat(zeroHexDigits) + "f".repeat(64 - zeroHexDigits));
    let nonce = 0;
    const startTime = Date.now();
    // For 20 bits: expected ~1M iterations. Use 5M for 99% success rate.
    const maxIterations = Math.min(Math.pow(2, difficulty) * 5, 50000000);

    while (nonce < maxIterations) {
      const data = challengeId + ":" + nonce;
      const hash = await sha256(data);
      const hashBigInt = BigInt("0x" + hash);

      if (hashBigInt <= target) {
        const workTime = Date.now() - startTime;
        console.log(`[TollAI] PoW solved: nonce=${nonce}, time=${workTime}ms, difficulty=${difficulty} bits (${zeroHexDigits} hex)`);
        return { nonce, hash, workTime };
      }
      nonce++;

      if (nonce % 10000 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
    throw new Error(`PoW computation exceeded max iterations (${maxIterations}) at difficulty ${difficulty} bits`);
  }

  async function initTollAI() {
    if (isVerified) return;
    
    const token = getCookie("tollai_session");
    if (token) {
      await verifySession(token);
      return;
    }
    await startTollAIFlow();
  }

  async function verifySession(token) {
    try {
      const response = await fetch("/tollai/status", { credentials: "include" });
      const data = await response.json();
      if (data.status === "ok" && data.activeSessions > 0) {
        document.body.classList.add("tollai-verified");
        isVerified = true;
        console.log("[TollAI] Session verified");
        startDwellTracking();
      } else {
        setCookie("tollai_session", "", -1);
        await startTollAIFlow();
      }
    } catch (error) {
      console.error("[TollAI] Session verification failed:", error);
      setCookie("tollai_session", "", -1);
      await startTollAIFlow();
    }
  }

  async function startTollAIFlow() {
    if (isPoWRunning || isVerified) return;
    isPoWRunning = true;

    try {
      const challengeResponse = await fetch("/tollai/challenge", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const challengeData = await challengeResponse.json();

      if (!challengeData.challengeId) {
        console.error("[TollAI] Failed to get challenge");
        isPoWRunning = false;
        return;
      }

      const difficulty = challengeData.difficulty || CONFIG.powDifficulty;
      console.log(`[TollAI] Computing PoW for challenge ${challengeData.challengeId} at difficulty ${difficulty} bits`);

      const powResult = await computeProofOfWork(challengeData.challengeId, difficulty);

      const verifyResponse = await fetch("/tollai/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          nonce: powResult.nonce,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.verified) {
        document.body.classList.add("tollai-verified");
        isVerified = true;
        isPoWRunning = false;
        console.log("[TollAI] Session verified after PoW");
        // Reload page to pass middleware with new session cookie
        setTimeout(() => window.location.reload(), 500);
      } else {
        console.error("[TollAI] Verification failed:", verifyData);
        isPoWRunning = false;
        // Retry after a delay
        setTimeout(startTollAIFlow, 2000);
      }
    } catch (error) {
      console.error("[TollAI] Flow error:", error);
      isPoWRunning = false;
      // Retry after a delay
      setTimeout(startTollAIFlow, 5000);
    }
  }

  function startDwellTracking() {
    let dwellStart = Date.now();
    let reported = false;

    const reportDwell = async () => {
      if (reported) return;
      const dwellMs = Date.now() - dwellStart;
      if (dwellMs >= CONFIG.minDwellMs) {
        reported = true;
        try {
          await fetch("/tollai/dwell", {
            method: "POST",
            credentials: "include",
          });
          console.log(`[TollAI] Dwell reported: ${dwellMs}ms`);
        } catch (e) {
          console.error("[TollAI] Dwell report failed:", e);
        }
      }
    };

    setTimeout(reportDwell, CONFIG.minDwellMs + 100);
    window.addEventListener("beforeunload", reportDwell);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") reportDwell();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTollAI);
  } else {
    initTollAI();
  }

  window.TollAIClient = { initTollAI, CONFIG };
})();