// content/guard.js — Must load FIRST. Catches "Extension context invalidated" errors.

(function () {
  'use strict';

  let _dead = false;

  function isDead() {
    if (_dead) return true;
    try {
      void chrome.runtime.id;
      return false;
    } catch {
      _dead = true;
      showBanner();
      return true;
    }
  }

  function showBanner() {
    if (document.getElementById('pta-refresh-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pta-refresh-banner';
    banner.style.cssText =
      'position:fixed;top:12px;left:50%;transform:translateX(-50%);' +
      'background:#dc2626;color:#fff;padding:10px 20px;border-radius:10px;' +
      'font-size:13px;z-index:9999999;cursor:pointer;' +
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    banner.textContent = '\u26a0 Clippy updated \u2014 click to refresh';
    banner.addEventListener('click', () => location.reload());
    document.body.appendChild(banner);
  }

  // --- Global guard function ---
  window.__ptaContextGuard = async function (fn) {
    if (isDead()) return undefined;
    try {
      return await fn();
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) {
        _dead = true;
        showBanner();
        return undefined;
      }
      throw err;
    }
  };

  // Quick sync check — other modules can call this before doing chrome.* work
  window.__ptaIsDead = isDead;

  // --- Global safety net for ANY unhandled "Extension context invalidated" ---
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message &&
        event.reason.message.includes('Extension context invalidated')) {
      event.preventDefault(); // suppress the console error
      if (!_dead) {
        _dead = true;
        showBanner();
      }
    }
  });
})();
