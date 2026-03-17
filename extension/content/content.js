// content/content.js — Entry point: detect textarea, coordinate modules

(function () {
  'use strict';

  // One-time storage init safety check
  chrome.storage.local.get('schemaVersion').then(({ schemaVersion }) => {
    if (!schemaVersion) {
      chrome.storage.local.set({ schemaVersion: 1, drafts: {}, savedPrompts: [] });
    }
  });

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
