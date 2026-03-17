# Prompt Thinking Assistant — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that injects a prompt improvement assistant into ChatGPT and Claude, with autosave and prompt memory.

**Architecture:** Single content script injected on both sites, shadow DOM for UI isolation, background service worker for LLM API calls. All state in `chrome.storage.local`. Vanilla JS, Manifest V3, no build step.

**Tech Stack:** Vanilla JS, Chrome Extension Manifest V3, Shadow DOM, chrome.storage.local

**Spec:** `docs/superpowers/specs/2026-03-17-prompt-assistant-extension-design.md`

---

## File Structure

```
extension/
├── manifest.json              # Extension manifest, permissions, content script registration
├── background.js              # Service worker — receives messages, calls LLM APIs, returns results
├── content/
│   ├── content.js             # Entry point — textarea detection, MutationObserver, orchestration
│   ├── ui.js                  # Shadow DOM creation, floating button, tooltip menu, overlays, toasts
│   ├── autosave.js            # Draft save every 3s, restore on load, history management
│   └── prompts.js             # Save/retrieve/delete saved prompts, dropdown UI
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── styles.css                 # Styles injected into shadow DOM
```

---

## Chunk 1: Foundation — Manifest, Background Worker, Textarea Detection

### Task 1: Create manifest.json

**Files:**
- Create: `extension/manifest.json`

- [ ] **Step 1: Create the manifest file**

```json
{
  "manifest_version": 3,
  "name": "Prompt Thinking Assistant",
  "version": "1.0.0",
  "description": "Improve, autosave, and reuse prompts inside ChatGPT and Claude",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*", "https://claude.ai/*"],
      "js": [
        "content/autosave.js",
        "content/prompts.js",
        "content/ui.js",
        "content/content.js"
      ],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["styles.css"],
      "matches": ["https://chatgpt.com/*", "https://claude.ai/*"]
    }
  ]
}
```

- [ ] **Step 2: Create placeholder icon files**

Create minimal PNG icons using an HTML canvas script or any image tool. The simplest approach — create a single-page HTML file, draw a colored rounded square with a sparkle "✦" character on canvas, export as data URLs, and save each size. Alternatively, use ImageMagick if available:
```bash
for size in 16 32 48 128; do
  magick -size ${size}x${size} xc:#2563eb -fill white -gravity center -pointsize $((size/2)) -annotate +0+0 "✦" extension/icons/icon${size}.png
done
```
These are throwaway placeholder icons — will be replaced with proper ones during polish.

- [ ] **Step 3: Verify — load extension in Chrome**

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked" → select `extension/` folder
4. Expected: Extension loads without errors, icon appears in toolbar

- [ ] **Step 4: Commit**

```bash
git add extension/manifest.json extension/icons/
git commit -m "feat: add manifest.json and placeholder icons"
```

---

### Task 2: Background service worker — API call handler

**Files:**
- Create: `extension/background.js`

- [ ] **Step 1: Write background.js with message listener and both API providers**

```js
// background.js — Handles LLM API calls from content script

const SYSTEM_PROMPTS = {
  refine: 'Improve this prompt for clarity and specificity. Keep the same intent. Return only the improved prompt, nothing else.',
  structured: 'Rewrite this prompt with clear sections, numbered steps, or bullet points as appropriate. Keep the same intent. Return only the improved prompt.',
  expert: 'Rewrite this prompt as a domain expert would write it — precise language, explicit constraints, defined output format. Return only the improved prompt.'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'improve-prompt') {
    handleImprovePrompt(message)
      .then(result => sendResponse({ success: true, text: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keeps message channel open for async response
  }
});

async function handleImprovePrompt({ action, prompt }) {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings || !settings.apiKey || !settings.provider) {
    throw new Error('API key not configured');
  }

  const systemPrompt = SYSTEM_PROMPTS[action];
  if (!systemPrompt) throw new Error('Unknown action: ' + action);

  if (settings.provider === 'openai') {
    return callOpenAI(settings.apiKey, systemPrompt, prompt);
  } else if (settings.provider === 'anthropic') {
    return callAnthropic(settings.apiKey, systemPrompt, prompt);
  } else {
    throw new Error('Unknown provider: ' + settings.provider);
  }
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('OpenAI API error (' + res.status + '): ' + body);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function callAnthropic(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error('Anthropic API error (' + res.status + '): ' + body);
  }

  const data = await res.json();
  return data.content[0].text.trim();
}
```

- [ ] **Step 2: Verify — reload extension, check service worker**

1. Go to `chrome://extensions` → click "Service Worker" link under the extension
2. Expected: DevTools opens without errors, service worker is active
3. To test the handler, open any matched page (ChatGPT/Claude) and run in that page's DevTools console:
   ```js
   chrome.runtime.sendMessage({ type: 'improve-prompt', action: 'refine', prompt: 'test' }, r => console.log(r))
   ```
4. Expected: Response logs `{ success: false, error: 'API key not configured' }`

- [ ] **Step 3: Commit**

```bash
git add extension/background.js
git commit -m "feat: add background service worker with OpenAI and Anthropic API handlers"
```

---

### Task 3: Content script — textarea detection with MutationObserver

**Files:**
- Create: `extension/content/content.js`

- [ ] **Step 1: Write content.js with textarea detection for both sites**

```js
// content/content.js — Entry point: detect textarea, coordinate modules

(function () {
  'use strict';

  const SITE = location.hostname; // 'chatgpt.com' or 'claude.ai'
  let currentTextarea = null;
  let autosaveIntervalId = null;

  function getTextareaSelector() {
    if (SITE === 'chatgpt.com') return '#prompt-textarea, textarea[data-id]';
    if (SITE === 'claude.ai') return 'div[contenteditable="true"]';
    return null;
  }

  function findTextarea() {
    const selector = getTextareaSelector();
    if (!selector) return null;
    return document.querySelector(selector);
  }

  function getTextContent(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value;
    return el.textContent || '';
  }

  function setTextContent(el, text) {
    if (!el) return;

    if (SITE === 'chatgpt.com') {
      // React-controlled textarea: use nativeInputValueSetter
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
      )?.set;
      if (setter) {
        setter.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (SITE === 'claude.ai') {
      // contenteditable div — use execCommand to preserve editor state
      el.focus();
      document.execCommand('selectAll', false, null);
      if (!document.execCommand('insertText', false, text)) {
        // Fallback: clipboard API paste simulation
        try {
          const clipItem = new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) });
          navigator.clipboard.write([clipItem]).then(() => {
            document.execCommand('paste');
          });
        } catch (_) {
          // Last resort: direct replacement
          el.textContent = text;
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
      }
    }
  }

  function onTextareaFound(textarea) {
    if (textarea === currentTextarea) return;

    // Clean up previous
    if (autosaveIntervalId) {
      clearInterval(autosaveIntervalId);
      autosaveIntervalId = null;
    }

    currentTextarea = textarea;

    // Initialize UI (from ui.js)
    if (typeof PromptUI !== 'undefined') {
      PromptUI.attach(textarea, SITE, getTextContent, setTextContent);
    }

    // Initialize autosave (from autosave.js)
    if (typeof Autosave !== 'undefined') {
      Autosave.restore(textarea, SITE, getTextContent, setTextContent);
      autosaveIntervalId = Autosave.start(textarea, SITE, getTextContent);
    }
  }

  function scan() {
    const textarea = findTextarea();
    if (textarea) onTextareaFound(textarea);
  }

  // Initial scan
  scan();

  // Watch for DOM changes (SPA navigation, dynamic rendering)
  // Debounce to avoid excessive scans on rapid DOM mutations
  let scanTimeout = null;
  const observer = new MutationObserver(() => {
    if (scanTimeout) return;
    scanTimeout = setTimeout(() => {
      scanTimeout = null;
      scan();
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
```

- [ ] **Step 2: Verify — reload extension, open ChatGPT or Claude**

1. Reload extension at `chrome://extensions`
2. Open `https://chatgpt.com`
3. Open DevTools console
4. Expected: No errors. The content script runs silently (no UI yet — that's Task 4).

- [ ] **Step 3: Commit**

```bash
git add extension/content/content.js
git commit -m "feat: add content script with textarea detection and MutationObserver"
```

---

## Chunk 2: UI Layer — Shadow DOM, Button, Tooltip, Key Setup

### Task 4: Shadow DOM and floating button

**Files:**
- Create: `extension/content/ui.js`
- Create: `extension/styles.css`

- [ ] **Step 1: Write styles.css for all UI components**

```css
/* styles.css — Injected into shadow DOM */

.pta-container {
  position: absolute;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}

/* Floating button */
.pta-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  transition: opacity 0.15s, background 0.15s;
  padding: 0;
}

.pta-btn:hover {
  opacity: 1;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.pta-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #555;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pta-btn.loading svg {
  animation: pta-spin 0.8s linear infinite;
}

@keyframes pta-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Button row */
.pta-buttons {
  display: flex;
  gap: 4px;
  position: absolute;
  bottom: 8px;
  right: 8px;
}

/* Tooltip menu */
.pta-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  display: none;
  min-width: 160px;
}

.pta-tooltip.visible {
  display: block;
}

.pta-tooltip-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  white-space: nowrap;
}

.pta-tooltip-item:hover {
  background: #f3f4f6;
}

/* Key setup overlay */
.pta-key-overlay {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 16px;
  display: none;
  min-width: 240px;
}

.pta-key-overlay.visible {
  display: block;
}

.pta-key-overlay label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  margin-bottom: 4px;
}

.pta-key-overlay select,
.pta-key-overlay input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.pta-key-overlay button {
  width: 100%;
  padding: 7px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.pta-key-overlay button:hover {
  background: #1d4ed8;
}

/* Toast */
.pta-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #1f2937;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 9999999;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.pta-toast.visible {
  opacity: 1;
}

/* Error message */
.pta-error {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  display: none;
}

.pta-error.visible {
  display: block;
}

/* Saved prompts dropdown */
.pta-prompts-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  display: none;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
}

.pta-prompts-dropdown.visible {
  display: block;
}

.pta-prompts-section {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pta-prompt-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.pta-prompt-item:hover {
  background: #f3f4f6;
}

.pta-prompt-item .text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.pta-prompt-item .delete {
  opacity: 0;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
  padding: 0 2px;
}

.pta-prompt-item:hover .delete {
  opacity: 1;
}

.pta-prompt-item .delete:hover {
  color: #ef4444;
}
```

- [ ] **Step 2: Write ui.js — shadow DOM, button, tooltip menu, key overlay, toast, error**

```js
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

    // Start hidden
    container.style.display = 'none';

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
```

- [ ] **Step 3: Verify — reload extension, open ChatGPT**

1. Reload extension
2. Open ChatGPT, click into the prompt textarea
3. Expected: Three small buttons appear at bottom-right of the textarea
4. Click sparkle button → key setup overlay appears (no key stored yet)
5. Click outside textarea → buttons disappear after 200ms

- [ ] **Step 4: Commit**

```bash
git add extension/content/ui.js extension/styles.css
git commit -m "feat: add shadow DOM UI with floating buttons, tooltip menu, and key setup overlay"
```

---

### Task 5: Autosave and draft restore

**Files:**
- Create: `extension/content/autosave.js`

- [ ] **Step 1: Write autosave.js**

```js
// content/autosave.js — Draft autosave every 3s, restore on load

// eslint-disable-next-line no-unused-vars
const Autosave = (function () {
  'use strict';

  const INTERVAL_MS = 3000;
  const MAX_HISTORY = 5;
  let lastSavedText = '';

  async function saveDraft(hostname, text) {
    if (text === lastSavedText) return;
    lastSavedText = text;

    const { drafts = {} } = await chrome.storage.local.get('drafts');
    const siteDraft = drafts[hostname] || { lastPrompt: '', history: [] };

    siteDraft.lastPrompt = text;

    // Add to history if different from most recent entry
    if (text.trim() && siteDraft.history[0] !== text) {
      siteDraft.history.unshift(text);
      if (siteDraft.history.length > MAX_HISTORY) {
        siteDraft.history = siteDraft.history.slice(0, MAX_HISTORY);
      }
    }

    drafts[hostname] = siteDraft;
    await chrome.storage.local.set({ drafts });
  }

  function start(textarea, hostname, getText) {
    lastSavedText = getText(textarea);
    return setInterval(() => {
      const text = getText(textarea);
      saveDraft(hostname, text);
    }, INTERVAL_MS);
  }

  async function restore(textarea, hostname, getText, setText) {
    const currentText = getText(textarea);
    if (currentText.trim()) return; // Don't overwrite existing content

    const { drafts = {} } = await chrome.storage.local.get('drafts');
    const siteDraft = drafts[hostname];
    if (!siteDraft || !siteDraft.lastPrompt?.trim()) return;

    setText(textarea, siteDraft.lastPrompt);

    if (typeof PromptUI !== 'undefined') {
      PromptUI.showToast('Draft restored');
    }
  }

  async function getHistory(hostname) {
    const { drafts = {} } = await chrome.storage.local.get('drafts');
    return drafts[hostname]?.history || [];
  }

  return { start, restore, getHistory };
})();
```

- [ ] **Step 2: Verify — reload, type in ChatGPT, reload page**

1. Reload extension
2. Open ChatGPT, type "test prompt for autosave"
3. Wait 4 seconds (one save cycle)
4. Reload the page
5. Expected: textarea auto-fills with "test prompt for autosave", toast shows "Draft restored"

- [ ] **Step 3: Commit**

```bash
git add extension/content/autosave.js
git commit -m "feat: add autosave with 3s interval and draft restore on page load"
```

---

## Chunk 3: Saved Prompts & Final Integration

### Task 6: Saved prompts — save, retrieve, delete

**Files:**
- Create: `extension/content/prompts.js`

- [ ] **Step 1: Write prompts.js**

```js
// content/prompts.js — Save, retrieve, and delete prompts

// eslint-disable-next-line no-unused-vars
const SavedPrompts = (function () {
  'use strict';

  const MAX_SAVED = 50;
  let dropdownEl = null;

  async function save(text) {
    const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');

    savedPrompts.unshift({
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now()
    });

    // Trim to max
    if (savedPrompts.length > MAX_SAVED) {
      savedPrompts.length = MAX_SAVED;
    }

    await chrome.storage.local.set({ savedPrompts });
  }

  async function remove(id) {
    const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');
    const filtered = savedPrompts.filter(p => p.id !== id);
    await chrome.storage.local.set({ savedPrompts: filtered });
  }

  async function getAll() {
    const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');
    return savedPrompts;
  }

  function truncate(text, len) {
    if (text.length <= len) return text;
    return text.slice(0, len) + '…';
  }

  async function showDropdown(parentContainer, site, onSelect) {
    hideDropdown();

    const [saved, recent] = await Promise.all([
      getAll(),
      typeof Autosave !== 'undefined' ? Autosave.getHistory(site) : []
    ]);

    if (saved.length === 0 && recent.length === 0) return;

    dropdownEl = document.createElement('div');
    dropdownEl.className = 'pta-prompts-dropdown visible';

    // Recent section
    if (recent.length > 0) {
      const header = document.createElement('div');
      header.className = 'pta-prompts-section';
      header.textContent = 'Recent';
      dropdownEl.appendChild(header);

      recent.forEach(text => {
        const item = document.createElement('div');
        item.className = 'pta-prompt-item';
        item.innerHTML = `<span class="text">${escapeHtml(truncate(text, 60))}</span>`;
        item.addEventListener('click', () => {
          onSelect(text);
          hideDropdown();
        });
        dropdownEl.appendChild(item);
      });
    }

    // Saved section
    if (saved.length > 0) {
      const header = document.createElement('div');
      header.className = 'pta-prompts-section';
      header.textContent = 'Saved';
      dropdownEl.appendChild(header);

      saved.forEach(prompt => {
        const item = document.createElement('div');
        item.className = 'pta-prompt-item';
        item.innerHTML = `
          <span class="text">${escapeHtml(truncate(prompt.text, 60))}</span>
          <span class="delete" title="Remove">×</span>
        `;
        item.querySelector('.text').addEventListener('click', () => {
          onSelect(prompt.text);
          hideDropdown();
        });
        item.querySelector('.delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          await remove(prompt.id);
          item.remove();
        });
        dropdownEl.appendChild(item);
      });
    }

    parentContainer.appendChild(dropdownEl);
  }

  function hideDropdown() {
    if (dropdownEl) {
      dropdownEl.remove();
      dropdownEl = null;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { save, remove, getAll, showDropdown, hideDropdown };
})();
```

- [ ] **Step 2: Verify — save a prompt and retrieve it**

1. Reload extension
2. Open ChatGPT, type "my saved test prompt"
3. Click bookmark icon → toast "Prompt saved"
4. Clear textarea, click list icon
5. Expected: dropdown shows "Saved" section with "my saved test prompt"
6. Click it → textarea fills with the text
7. Hover over the item → "x" appears, click it → item removed

- [ ] **Step 3: Commit**

```bash
git add extension/content/prompts.js
git commit -m "feat: add saved prompts with save, retrieve, delete, and dropdown UI"
```

---

### Task 7: Initialize storage schema on install

**Files:**
- Modify: `extension/background.js`

- [ ] **Step 1: Add onInstalled listener to background.js**

Add to the top of background.js, after the SYSTEM_PROMPTS constant:

```js
chrome.runtime.onInstalled.addListener(async () => {
  const { schemaVersion } = await chrome.storage.local.get('schemaVersion');
  if (!schemaVersion) {
    await chrome.storage.local.set({
      schemaVersion: 1,
      settings: null,
      drafts: {},
      savedPrompts: []
    });
  }
});
```

- [ ] **Step 2: Verify — reinstall extension**

1. Remove and re-add extension
2. Open DevTools on service worker → Application → Storage → check chrome.storage.local
3. Expected: `schemaVersion: 1`, `drafts: {}`, `savedPrompts: []`, `settings: null`

- [ ] **Step 3: Commit**

```bash
git add extension/background.js
git commit -m "feat: initialize storage schema on extension install"
```

---

### Task 8: End-to-end integration test

- [ ] **Step 1: Full flow test on ChatGPT**

1. Load extension fresh (remove & re-add)
2. Open `https://chatgpt.com`
3. Click into textarea → 3 buttons appear
4. Type "explain quantum computing to me"
5. Click sparkle → key overlay appears
6. Enter OpenAI key and select provider → click Save & Continue
7. Tooltip appears → click "Refine"
8. Wait <2s → textarea text replaced with improved version
9. Click "Make structured" → replaced again
10. Click bookmark → "Prompt saved" toast
11. Click list icon → see saved prompt in dropdown
12. Wait 4s → reload page → draft restored

- [ ] **Step 2: Full flow test on Claude**

1. Open `https://claude.ai`
2. Repeat steps 3-11 from above
3. Verify contenteditable insertion works (text replaces correctly)

- [ ] **Step 3: Cross-site saved prompts test**

1. Save a prompt on ChatGPT
2. Open Claude → click list icon
3. Expected: Saved prompt from ChatGPT appears in "Saved" section
4. Recent section shows only Claude-specific drafts

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes"
```

---

### Task 9: Polish — minor UX refinements

- [ ] **Step 1: Click-outside-to-dismiss for tooltip/dropdown**

Add to ui.js — listen for clicks on the shadow root itself and dismiss open menus:

```js
shadowRoot.addEventListener('click', (e) => {
  if (!e.target.closest('.pta-tooltip') && !e.target.closest('.pta-btn')) {
    hideAll();
  }
});
```

- [ ] **Step 2: Ensure storage schema version is present**

In content.js `scan()` function, add a one-time storage init check:

```js
chrome.storage.local.get('schemaVersion').then(({ schemaVersion }) => {
  if (!schemaVersion) {
    chrome.storage.local.set({ schemaVersion: 1, drafts: {}, savedPrompts: [] });
  }
});
```

- [ ] **Step 3: Verify — final reload and smoke test**

1. Reload extension
2. Quick test on both ChatGPT and Claude
3. Verify: buttons appear/disappear, tooltips dismiss on click-outside, no console errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "polish: add click-outside dismiss and storage init safety check"
```
