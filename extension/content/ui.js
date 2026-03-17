// content/ui.js — Shadow DOM, floating button, tooltip, overlays, toasts

// eslint-disable-next-line no-unused-vars
const PromptUI = (function () {
  'use strict';

  let shadowRoot = null;
  let container = null;
  let tooltip = null;
  let keyOverlay = null;
  let errorEl = null;
  let isLoading = false;
  let pendingAction = null;

  // References set by attach()
  let _textarea = null;
  let _site = null;
  let _getText = null;
  let _setText = null;

  const SPARKLE_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>`;
  const BOOKMARK_SVG = `<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  const LIST_SVG = `<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`;
  const SPINNER_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;

  function createShadowUI(textarea) {
    // Host element positioned relative to textarea's parent
    const host = document.createElement('div');
    host.id = 'pta-host';
    textarea.parentElement.style.position = 'relative';
    textarea.parentElement.appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'closed' });

    // Load styles
    const style = document.createElement('style');
    style.textContent = '/* loaded async */';
    shadowRoot.appendChild(style);

    // Fetch styles from extension
    fetch(chrome.runtime.getURL('styles.css'))
      .then(r => r.text())
      .then(css => { style.textContent = css; });

    // Container
    container = document.createElement('div');
    container.className = 'pta-buttons';
    shadowRoot.appendChild(container);

    // Main button (sparkle — prompt improve)
    const mainBtn = document.createElement('button');
    mainBtn.className = 'pta-btn';
    mainBtn.innerHTML = SPARKLE_SVG;
    mainBtn.title = 'Improve prompt';
    mainBtn.addEventListener('click', onMainButtonClick);
    container.appendChild(mainBtn);

    // Bookmark button (save prompt)
    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = 'pta-btn';
    bookmarkBtn.innerHTML = BOOKMARK_SVG;
    bookmarkBtn.title = 'Save prompt';
    bookmarkBtn.addEventListener('click', onBookmarkClick);
    container.appendChild(bookmarkBtn);

    // List button (view saved prompts)
    const listBtn = document.createElement('button');
    listBtn.className = 'pta-btn';
    listBtn.innerHTML = LIST_SVG;
    listBtn.title = 'Saved prompts';
    listBtn.addEventListener('click', onListClick);
    container.appendChild(listBtn);

    // Tooltip menu
    tooltip = document.createElement('div');
    tooltip.className = 'pta-tooltip';
    tooltip.innerHTML = `
      <div class="pta-tooltip-item" data-action="refine">Refine</div>
      <div class="pta-tooltip-item" data-action="structured">Make structured</div>
      <div class="pta-tooltip-item" data-action="expert">Make expert-level</div>
    `;
    tooltip.addEventListener('click', onTooltipItemClick);
    container.appendChild(tooltip);

    // Key setup overlay
    keyOverlay = document.createElement('div');
    keyOverlay.className = 'pta-key-overlay';
    keyOverlay.innerHTML = `
      <label>Provider</label>
      <select class="pta-provider-select">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="groq">Groq (Llama 3 — free)</option>
      </select>
      <label>API Key</label>
      <input type="password" class="pta-key-input" placeholder="sk-..." />
      <button class="pta-key-save">Save & Continue</button>
    `;
    keyOverlay.querySelector('.pta-key-save').addEventListener('click', onKeySave);
    container.appendChild(keyOverlay);

    // Error message
    errorEl = document.createElement('div');
    errorEl.className = 'pta-error';
    container.appendChild(errorEl);

    // Show/hide on focus/blur
    let blurTimeout = null;
    textarea.addEventListener('focus', () => {
      clearTimeout(blurTimeout);
      container.style.display = 'flex';
    });
    textarea.addEventListener('blur', () => {
      blurTimeout = setTimeout(() => {
        container.style.display = 'none';
        hideAll();
      }, 200);
    });

    // Prevent blur from hiding UI when clicking inside shadow DOM
    host.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevents textarea from losing focus
      clearTimeout(blurTimeout);
    });

    // Start hidden
    container.style.display = 'none';

    // Click-outside-to-dismiss
    shadowRoot.addEventListener('click', (e) => {
      if (!e.target.closest('.pta-tooltip') && !e.target.closest('.pta-btn') && !e.target.closest('.pta-key-overlay') && !e.target.closest('.pta-prompts-dropdown')) {
        hideAll();
      }
    });

    return host;
  }

  function hideAll() {
    tooltip.classList.remove('visible');
    keyOverlay.classList.remove('visible');
    errorEl.classList.remove('visible');
    if (typeof SavedPrompts !== 'undefined') {
      SavedPrompts.hideDropdown();
    }
  }

  async function onMainButtonClick(e) {
    e.stopPropagation();
    if (isLoading) return;

    hideAll();

    // Check if API key exists
    const { settings } = await chrome.storage.local.get('settings');
    if (!settings || !settings.apiKey) {
      pendingAction = null; // Will show tooltip after key save
      keyOverlay.classList.add('visible');
      return;
    }

    tooltip.classList.toggle('visible');
  }

  function onTooltipItemClick(e) {
    const action = e.target.dataset?.action;
    if (!action || isLoading) return;
    tooltip.classList.remove('visible');
    runImproveAction(action);
  }

  async function onKeySave(e) {
    e.stopPropagation();
    const provider = keyOverlay.querySelector('.pta-provider-select').value;
    const apiKey = keyOverlay.querySelector('.pta-key-input').value.trim();

    if (!apiKey) return;

    await chrome.storage.local.set({
      settings: { provider, apiKey }
    });

    keyOverlay.classList.remove('visible');

    // If there was a pending action, run it now
    if (pendingAction) {
      const action = pendingAction;
      pendingAction = null;
      runImproveAction(action);
    } else {
      // Show tooltip so user can pick an action
      tooltip.classList.add('visible');
    }
  }

  let _lastOriginalText = null; // Store original text before replacement

  async function runImproveAction(action) {
    if (isLoading) return; // Debounce — ignore clicks while request is in flight
    const text = _getText(_textarea);
    if (!text.trim()) return;

    _lastOriginalText = text; // Store for potential future undo
    isLoading = true;
    const mainBtn = container.querySelector('.pta-btn');
    mainBtn.innerHTML = SPINNER_SVG;
    mainBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'improve-prompt',
        action,
        prompt: text
      });

      if (response.success) {
        _setText(_textarea, response.text);
      } else {
        showError(response.error || 'API error — check your key');
      }
    } catch (err) {
      showError('Connection error');
    } finally {
      isLoading = false;
      mainBtn.innerHTML = SPARKLE_SVG;
      mainBtn.classList.remove('loading');
    }
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    setTimeout(() => errorEl.classList.remove('visible'), 3000);
  }

  function onBookmarkClick(e) {
    e.stopPropagation();
    hideAll();
    const text = _getText(_textarea);
    if (!text.trim()) return;

    if (typeof SavedPrompts !== 'undefined') {
      SavedPrompts.save(text);
      showToast('Prompt saved');
    }
  }

  function onListClick(e) {
    e.stopPropagation();
    hideAll();

    if (typeof SavedPrompts !== 'undefined') {
      SavedPrompts.showDropdown(container, _site, (text) => {
        _setText(_textarea, text);
      });
    }
  }

  function showToast(msg) {
    // Toast lives in the main document (outside shadow DOM) for fixed positioning
    let toast = document.getElementById('pta-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pta-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999999;opacity:0;transition:opacity 0.2s;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  // Public API
  return {
    attach(textarea, site, getText, setText) {
      _textarea = textarea;
      _site = site;
      _getText = getText;
      _setText = setText;

      // Remove previous host if any
      const prev = document.getElementById('pta-host');
      if (prev) prev.remove();

      createShadowUI(textarea);
    },
    showToast
  };
})();
