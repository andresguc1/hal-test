/* TollAI browser client — transparent cognitive toll.
 *
 * A real browser never sees a puzzle. It pays the toll once, silently, with
 * CPU: fetch a challenge, brute-force a hashcash nonce, exchange it for a
 * session cookie, and reload. Every later request reuses that session.
 * Clients that cannot execute this script (curl, axios, python-requests)
 * never obtain a session and fall through to the challenge path.
 */
(function () {
  'use strict';

  var SESSION_COOKIE = 'tollai_session';

  /* ---------- sha256 (synchronous, ASCII) ---------- */
  function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

  function sha256(str) {
    var TWO32 = 4294967296, pow = Math.pow;
    var K = new Uint32Array(64), H = new Uint32Array(8), comp = {}, pc = 0, cand, i;

    for (cand = 2; pc < 64; cand++) {
      if (!comp[cand]) {
        for (i = 0; i < 313; i += cand) comp[i] = cand;
        H[pc] = (pow(cand, .5) * TWO32) | 0;
        K[pc++] = (pow(cand, 1 / 3) * TWO32) | 0;
      }
    }

    var bytes = [], c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c > 255) return null;
      bytes.push(c);
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(0, 0, 0, 0,
      (bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

    var w = new Uint32Array(64), t, off, p, s0, s1;
    for (off = 0; off < bytes.length; off += 64) {
      for (t = 0; t < 16; t++) {
        p = off + 4 * t;
        w[t] = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }

      var a = H[0], b = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      var S1, ch, t1, S0, maj, t2;

      for (t = 0; t < 64; t++) {
        S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        ch = ((e & f) ^ (~e & g)) >>> 0;
        t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        maj = ((a & b) ^ (a & cc) ^ (b & cc)) >>> 0;
        t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e;
        e = (d + t1) >>> 0;
        d = cc; cc = b; b = a;
        a = (t1 + t2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + cc) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    var out = '';
    for (i = 0; i < 8; i++) out += H[i].toString(16).padStart(8, '0');
    return out;
  }

  function leadingZeroBits(hex) {
    var bits = 0;
    for (var i = 0; i < hex.length && bits < 64; i++) {
      var nib = parseInt(hex[i], 16);
      if (nib === 0) { bits += 4; continue; }
      bits += Math.clz32(nib) - 28;
      break;
    }
    return bits;
  }

  function solvePow(challenge, difficulty, onProgress) {
    for (var nonce = 0; nonce < 4e9; nonce++) {
      if ((nonce & 0x3fff) === 0 && onProgress) onProgress(nonce);
      var d = sha256(challenge + ':' + nonce);
      if (d && leadingZeroBits(d) >= difficulty) return nonce;
    }
    return null;
  }

  /* ---------- session bootstrap ---------- */
  var readyPromise = null;

  function postJSON(url, body) {
    return nativeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function establish() {
    if (readyPromise) return readyPromise;

    readyPromise = nativeFetch('/tollai/challenge')
      .then(function (r) { return r.json(); })
      .then(function (ch) {
        if (!ch.challenge) throw new Error('no challenge');
        var t0 = Date.now();
        var nonce = solvePow(ch.challenge, ch.difficulty);
        if (nonce === null) throw new Error('pow exhausted');
        window.__TOLLAI_ATTEMPTS__ = nonce + 1;
        window.__TOLLAI_CHALLENGE__ = ch.challenge;
        window.__TOLLAI_NONCE__ = String(nonce);
        return postJSON('/tollai/verify', {
          challenge: ch.challenge,
          nonce: String(nonce),
          difficulty: ch.difficulty
        }).then(function (res) {
          if (!res.verified) throw new Error(res.code || 'verify failed');
          window.__TOLLAI_WORK_MS__ = Date.now() - t0;
          window.TOLLAI_SESSION = true;
          return res;
        });
      })
      .catch(function (err) {
        readyPromise = null;
        throw err;
      });

    return readyPromise;
  }

  // Drop the memoised session so the next call re-proves work.
  function resetSession() {
    readyPromise = null;
    window.TOLLAI_SESSION = false;
  }

  // The server sets this when it already validated the cookie, so a normal
  // page load costs zero CPU instead of re-paying the proof of work.
  function hasSession() {
    return !!window.TOLLAI_SESSION;
  }

  function status(el, text, cls) {
    if (!el) return;
    el.textContent = text;
    el.className = 'tollai-pill ' + (cls || '');
  }

  function mountIndicator() {
    if (document.getElementById('tollai-pill')) return;
    var pill = document.createElement('div');
    pill.id = 'tollai-pill';
    pill.className = 'tollai-pill pending';
    pill.textContent = 'TollAI: verifying…';
    pill.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483000;'
      + 'font:600 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
      + 'padding:7px 11px;border-radius:999px;color:#fff;background:#8250df;'
      + 'box-shadow:0 2px 10px rgba(0,0,0,.22);pointer-events:none;transition:opacity .3s';
    document.body.appendChild(pill);
    return pill;
  }

  /* ---------- transparent fetch ---------- */
  // Protocol traffic must never re-enter the patched fetch.
  var nativeFetch = window.fetch.bind(window);

  var DWELL_HEARTBEAT_MS = 500;

  // The page quietly reports that a human is looking at it. This is what makes
  // an immediate "solve then fire" mutation burst impossible.
  function startDwellHeartbeat() {
    if (window.__TOLLAI_DWELL_TIMER__) return;
    var tick = function () {
      if (document.hidden) return;
      nativeFetch('/tollai/dwell', { method: 'POST', credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.settled) {
            clearInterval(window.__TOLLAI_DWELL_TIMER__);
            window.__TOLLAI_DWELL_TIMER__ = null;
            document.documentElement.setAttribute('data-tollai-dwell', 'settled');
          }
        })
        .catch(function () { /* transient */ });
    };
    window.__TOLLAI_DWELL_TIMER__ = setInterval(tick, DWELL_HEARTBEAT_MS);
    tick();
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function markRetried(init) {
    return Object.assign({}, init, { credentials: 'same-origin', __tollaiRetried: true });
  }

  function retryCount(init) {
    return (init && init.__tollaiRetries) || 0;
  }

  function withRetries(init) {
    var n = retryCount(init);
    return Object.assign({}, markRetried(init), { __tollaiRetries: n + 1 });
  }

  function tollFetch(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var isTolled = url.indexOf('/api/') === 0;
    var attempts = retryCount(init);

    if (!isTolled) return nativeFetch(input, init);

    var ready = hasSession() ? Promise.resolve(null) : establish().catch(function () { return null; });

    return ready
      .then(function () {
        return nativeFetch(input, Object.assign({}, init, { credentials: 'same-origin' }));
      })
      .then(function (res) {
        if (res.status !== 401 && res.status !== 428) return res;
        // Read the machine-readable reason; these bodies are never needed again.
        return res.json()
          .catch(function () { return null; })
          .then(function (body) {
            var code = body && body.code;

            // Not settled yet: wait out the dwell, no need to repay the PoW.
            if (code === 'DWELL_REQUIRED' && attempts < 3) {
              var wait = Math.max(50, Math.min((body && body.retry_after_ms) || 250, 1000));
              return sleep(wait).then(function () {
                return tollFetch(input, withRetries(init));
              });
            }

            // Session expired, revoked or out of quota: repay the toll once.
            if (attempts < 1) {
              resetSession();
              return establish().then(function () {
                return nativeFetch(input, withRetries(init));
              });
            }

            throw new Error(code || 'toll_' + res.status);
          });
      });
  }

  window.fetch = tollFetch;

  window.TollAI = {
    establish: establish,
    reset: resetSession,
    solvePow: solvePow,
    sha256: sha256,
    workMs: function () { return window.__TOLLAI_WORK_MS__ || 0; },
    attempts: function () { return window.__TOLLAI_ATTEMPTS__ || 0; }
  };

  /* ---------- boot ---------- */
  function boot() {
    // Already tolled by the server: no puzzle, no spinner, no CPU burned.
    if (hasSession()) {
      startDwellHeartbeat();
      document.documentElement.setAttribute('data-tollai', 'verified');
      return;
    }

    var pill = mountIndicator();
    establish().then(function () {
      startDwellHeartbeat();
      status(pill, 'TollAI: verified · ' + window.__TOLLAI_WORK_MS__ + 'ms', 'ok');
      setTimeout(function () {
        if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
      }, 2500);
      document.documentElement.setAttribute('data-tollai', 'verified');
    }).catch(function () {
      status(pill, 'TollAI: verification failed', 'err');
      document.documentElement.setAttribute('data-tollai', 'failed');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
