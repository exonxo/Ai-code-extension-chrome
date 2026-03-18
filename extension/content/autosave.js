// content/autosave.js — Draft autosave every 3s, restore on load

// eslint-disable-next-line no-unused-vars
const Autosave = (function () {
  'use strict';

  const INTERVAL_MS = 3000;
  const MAX_HISTORY = 5;
  let lastSavedText = '';

  function dead() {
    return window.__ptaIsDead && window.__ptaIsDead();
  }

  async function saveDraft(hostname, text) {
    if (text === lastSavedText) return;
    if (dead()) return; // stop silently if extension reloaded
    lastSavedText = text;

    try {
      const { drafts = {} } = await chrome.storage.local.get('drafts');
      const siteDraft = drafts[hostname] || { lastPrompt: '', history: [] };

      siteDraft.lastPrompt = text;

      if (text.trim() && siteDraft.history[0] !== text) {
        siteDraft.history.unshift(text);
        if (siteDraft.history.length > MAX_HISTORY) {
          siteDraft.history = siteDraft.history.slice(0, MAX_HISTORY);
        }
      }

      drafts[hostname] = siteDraft;
      await chrome.storage.local.set({ drafts });
    } catch (_) { /* context invalidated — global handler shows banner */ }
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
    if (currentText.trim()) return;
    if (dead()) return;

    try {
      const { drafts = {} } = await chrome.storage.local.get('drafts');
      const siteDraft = drafts[hostname];
      if (!siteDraft || !siteDraft.lastPrompt?.trim()) return;

      setText(textarea, siteDraft.lastPrompt);

      if (typeof PromptUI !== 'undefined') {
        PromptUI.showToast('Draft restored');
      }
    } catch (_) { /* context invalidated */ }
  }

  async function getHistory(hostname) {
    if (dead()) return [];
    try {
      const { drafts = {} } = await chrome.storage.local.get('drafts');
      return drafts[hostname]?.history || [];
    } catch (_) {
      return [];
    }
  }

  return { start, restore, getHistory };
})();
