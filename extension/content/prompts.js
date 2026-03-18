// content/prompts.js — Save, retrieve, and delete prompts

// eslint-disable-next-line no-unused-vars
const SavedPrompts = (function () {
  'use strict';

  const MAX_SAVED = 50;
  let dropdownEl = null;

  function dead() {
    return window.__ptaIsDead && window.__ptaIsDead();
  }

  async function save(text) {
    if (dead()) return;
    try {
      const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');
      savedPrompts.unshift({ id: crypto.randomUUID(), text, createdAt: Date.now() });
      if (savedPrompts.length > MAX_SAVED) savedPrompts.length = MAX_SAVED;
      await chrome.storage.local.set({ savedPrompts });
    } catch (_) { /* context invalidated */ }
  }

  async function remove(id) {
    if (dead()) return;
    try {
      const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');
      const filtered = savedPrompts.filter(p => p.id !== id);
      await chrome.storage.local.set({ savedPrompts: filtered });
    } catch (_) { /* context invalidated */ }
  }

  async function getAll() {
    if (dead()) return [];
    try {
      const { savedPrompts = [] } = await chrome.storage.local.get('savedPrompts');
      return savedPrompts;
    } catch (_) {
      return [];
    }
  }

  function truncate(text, len) {
    if (text.length <= len) return text;
    return text.slice(0, len) + '\u2026';
  }

  async function showDropdown(parentContainer, site, onSelect) {
    hideDropdown();
    if (dead()) return;

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
        item.innerHTML = '<span class="text">' + escapeHtml(truncate(text, 60)) + '</span>';
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
        item.innerHTML = '<span class="text">' + escapeHtml(truncate(prompt.text, 60)) + '</span>' +
          '<span class="delete" title="Remove">\u00d7</span>';
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
