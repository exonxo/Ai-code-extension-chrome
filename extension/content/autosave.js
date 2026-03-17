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
