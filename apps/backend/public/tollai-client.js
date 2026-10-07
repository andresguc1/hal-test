// TollAI Client Script for hal-test - Proof of Work Verification
// Transparent for humans, nightmare for bots

(function () {
  "use strict";

  const CONFIG = {
    powDifficulty: 20, // bits
    minResponseTime: 1500,
    minDwellMs: 1500,
    sessionTTL: 15 * 60 * 1000,
    renewalBuffer: 60 * 1000, // renew 1 minute before expiry
  };

  let isPoWRunning = false;
  let isVerified = false;
  let renewalTimer = null;

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

  function isOnChallengePage() {
    // Detect if we're on the 403 challenge page (has spinner + "Verifying access" text)
    const title = document.title;
    const hasSpinner = document.querySelector('.spinner') !== null;
    const hasVerifyingText = document.body.textContent.includes('Verifying access');
    return title === 'Verification Required' || hasSpinner || hasVerifyingText;
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
    const maxIterations = Math.min(Math.pow(2, difficulty) * 5, 50000000);
    // Scale timeout with maxIterations: ~5 minutes for 5M iterations at 15-20K H/s
    const hardTimeout = Math.max(30000, Math.min(maxIterations / 15000 * 1000, 300000)); // 30s - 5min

    console.log(`[TollAI] Starting PoW: difficulty=${difficulty} bits (${zeroHexDigits} hex), maxIterations=${maxIterations.toLocaleString()}, timeout=${hardTimeout}ms`);

    while (nonce < maxIterations) {
      // Hard timeout check
      if (Date.now() - startTime > hardTimeout) {
        throw new Error(`PoW timeout after ${hardTimeout}ms (${nonce.toLocaleString()} iterations)`);
      }

      const data = challengeId + ":" + nonce;
      const hash = await sha256(data);
      const hashBigInt = BigInt("0x" + hash);

      if (hashBigInt <= target) {
        const workTime = Date.now() - startTime;
        console.log(`[TollAI] PoW solved: nonce=${nonce.toLocaleString()}, time=${workTime}ms, difficulty=${difficulty} bits (${zeroHexDigits} hex)`);
        return { nonce, hash, workTime };
      }
      nonce++;

      if (nonce % 50000 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = Math.round(nonce / (elapsed / 1000));
        console.log(`[TollAI] PoW progress: ${nonce.toLocaleString()}/${maxIterations.toLocaleString()} (${rate.toLocaleString()} H/s, ${elapsed}ms)`);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    throw new Error(`PoW computation exceeded max iterations (${maxIterations.toLocaleString()}) at difficulty ${difficulty} bits`);
  }

  function scheduleRenewal() {
    if (renewalTimer) clearTimeout(renewalTimer);
    // Renew at sessionTTL - renewalBuffer (e.g., 14 minutes for 15 min TTL)
    const delay = CONFIG.sessionTTL - CONFIG.renewalBuffer;
    renewalTimer = setTimeout(() => {
      console.log("[TollAI] Scheduling background session renewal");
      backgroundRenewal();
    }, delay);
  }

  async function backgroundRenewal() {
    if (isPoWRunning) return;
    isPoWRunning = true;

    try {
      console.log("[TollAI] Background session renewal started");
      const challengeResponse = await fetch("/tollai/challenge", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const challengeData = await challengeResponse.json();

      if (!challengeData.challengeId) {
        console.error("[TollAI] Renewal: failed to get challenge");
        isPoWRunning = false;
        setTimeout(backgroundRenewal, 30000); // retry in 30s
        return;
      }

      const difficulty = challengeData.difficulty || CONFIG.powDifficulty;
      console.log(`[TollAI] Background renewal: computing PoW at difficulty ${difficulty} bits`);

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
        console.log("[TollAI] Background renewal successful");
        // Schedule next renewal
        scheduleRenewal();
      } else {
        console.error("[TollAI] Background renewal failed:", verifyData);
        // Retry sooner on failure
        setTimeout(backgroundRenewal, 30000);
      }
    } catch (error) {
      console.error("[TollAI] Background renewal error:", error);
      setTimeout(backgroundRenewal, 60000);
    } finally {
      isPoWRunning = false;
    }
  }

  async function initTollAI() {
    if (isVerified) {
      // Already verified - just schedule renewal
      scheduleRenewal();
      return;
    }

    const token = getCookie("tollai_session");
    if (token) {
      await verifySession(token);
      return;
    }

    // No session - check if we're on challenge page
    if (isOnChallengePage()) {
      await startTollAIFlow(true); // true = on challenge page, will reload
    } else {
      // On app page but no session - silently get one
      await startTollAIFlow(false);
    }
  }

  async function verifySession(token) {
    try {
      const response = await fetch("/tollai/status", { credentials: "include" });
      const data = await response.json();
      if (data.status === "ok" && data.activeSessions > 0) {
        document.body.classList.add("tollai-verified");
        isVerified = true;
        console.log("[TollAI] Session verified");
        scheduleRenewal();
        startDwellTracking();
      } else {
        setCookie("tollai_session", "", -1);
        await startTollAIFlow(isOnChallengePage());
      }
    } catch (error) {
      console.error("[TollAI] Session verification failed:", error);
      setCookie("tollai_session", "", -1);
      await startTollAIFlow(isOnChallengePage());
    }
  }

  async function startTollAIFlow(onChallengePage) {
    if (isPoWRunning || isVerified) return;
    isPoWRunning = true;

    // Show progress on challenge page
    if (onChallengePage) {
      updateChallengeUI("Computing proof of work...", "loading");
    }

    try {
      const challengeResponse = await fetch("/tollai/challenge", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const challengeData = await challengeResponse.json();

      if (!challengeData.challengeId) {
        console.error("[TollAI] Failed to get challenge");
        isPoWRunning = false;
        if (onChallengePage) updateChallengeUI("Failed to get challenge", "error");
        return;
      }

      const difficulty = challengeData.difficulty || CONFIG.powDifficulty;
      console.log(`[TollAI] Computing PoW for challenge ${challengeData.challengeId} at difficulty ${difficulty} bits`);

      const powResult = await computeProofOfWork(challengeData.challengeId, difficulty);

      if (onChallengePage) {
        updateChallengeUI("Verifying...", "loading");
      }

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
        scheduleRenewal();
        setTimeout(startDwellTracking, 1000);

        // ONLY reload if we're on the challenge page (403 page)
        // On app page, we just continue silently
        if (onChallengePage) {
          updateChallengeUI("Verification complete!", "success");
          console.log("[TollAI] On challenge page - reloading to enter app");
          setTimeout(() => window.location.reload(), 500);
        } else {
          console.log("[TollAI] On app page - session established silently");
        }
      } else {
        console.error("[TollAI] Verification failed:", verifyData);
        isPoWRunning = false;
        if (onChallengePage) updateChallengeUI("Verification failed, retrying...", "error");
        setTimeout(() => startTollAIFlow(onChallengePage), 2000);
      }
    } catch (error) {
      console.error("[TollAI] Flow error:", error);
      isPoWRunning = false;
      if (onChallengePage) updateChallengeUI(`Error: ${error.message}`, "error");
      setTimeout(() => startTollAIFlow(onChallengePage), 5000);
    }
  }

  function updateChallengeUI(message, type = "info") {
    if (!isOnChallengePage()) return;
    const container = document.querySelector('.container');
    if (!container) return;
    const h2 = container.querySelector('h2');
    const p = container.querySelector('p');
    const spinner = container.querySelector('.spinner');
    if (h2) h2.textContent = message;
    if (p) p.textContent = type === 'error' ? 'Error occurred, retrying...' : 'Please wait...';
    if (spinner) spinner.style.display = type === 'error' ? 'none' : 'block';
    container.style.borderColor = type === 'error' ? '#ef4444' : '#3b82f6';
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
          const response = await fetch("/tollai/dwell", {
            method: "POST",
            credentials: "include",
          });
          if (response.ok) {
            console.log(`[TollAI] Dwell reported: ${dwellMs}ms`);
          } else if (response.status === 401) {
            // Session expired/invalid - restart verification
            console.log("[TollAI] Dwell 401 - session expired, restarting verification");
            reported = false;
            setCookie("tollai_session", "", -1);
            await startTollAIFlow(isOnChallengePage());
          } else {
            console.error(`[TollAI] Dwell report failed: ${response.status}`);
          }
        } catch (e) {
          console.error("[TollAI] Dwell report error:", e);
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