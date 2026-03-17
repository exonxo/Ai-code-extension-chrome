# Prompt Thinking Assistant — Chrome Extension Design Spec

## Overview

A Chrome extension that acts as a real-time prompt thinking assistant embedded inside AI chat tools. Reduces friction and improves output quality by providing one-click prompt improvement, autosave, and prompt memory — all invisible to the user's workflow.

**Core loop:** Write → Improve → Save → Reuse

**Principle:** If the user has to "learn" the tool, we failed. It should feel like a native part of the host site.

## Decisions

- **API:** User brings their own key. Chooses provider (OpenAI or Anthropic) and pastes key.
- **Supported sites (V1):** ChatGPT (`chatgpt.com`) and Claude (`claude.ai`)
- **Key setup:** First-run inline overlay on first action click — no options page for V1
- **Architecture:** Single content script per site, shadow DOM, background worker for API calls only

## Architecture & File Structure

```
extension/
├── manifest.json
├── background.js          # Service worker — API calls only
├── content/
│   ├── content.js         # Entry point, injected on ChatGPT + Claude
│   ├── ui.js              # Shadow DOM, button, tooltip, overlays
│   ├── autosave.js        # Draft save/restore logic
│   └── prompts.js         # Saved prompts save/retrieve logic
├── icons/
│   └── icon16/32/48/128.png
└── options/               # Empty for V1 — key setup is inline
```

### manifest.json

- `content_scripts` matching `https://chatgpt.com/*` and `https://claude.ai/*`
- `background.service_worker` pointing to `background.js`
- Permissions: `storage`, `activeTab`, `scripting`
- `host_permissions`: `["https://api.openai.com/*", "https://api.anthropic.com/*"]` — Chrome exempts extension background fetches from CORS when domains are listed here
- `"run_at": "document_idle"` for content script injection timing

### Data Flow

1. Content script detects focused textarea → injects button via shadow DOM
2. User clicks action → content script sends message to background worker
3. Background worker calls LLM API → returns rewritten prompt
4. Content script replaces textarea value using site-specific insertion strategy

### Storage Shape

```json
{
  "schemaVersion": 1,
  "settings": { "provider": "openai|anthropic", "apiKey": "sk-..." },
  "drafts": {
    "chatgpt.com": { "lastPrompt": "...", "history": ["...", "..."] },
    "claude.ai":   { "lastPrompt": "...", "history": ["...", "..."] }
  },
  "savedPrompts": [{ "id": 1, "text": "...", "createdAt": 1234567890 }]
}
```

## Textarea Detection & UI Injection

### Detection Strategy

- On page load + MutationObserver (both sites use dynamic DOM)
- ChatGPT: target `#prompt-textarea` or `textarea[data-id]`
- Claude: target `div[contenteditable="true"]` in the composer area
- Re-scan on mutations — both sites rebuild DOM as you navigate conversations

### Floating Button

- Appears when textarea is focused, disappears on blur with 200ms delay (so click registers)
- Positioned absolute, anchored to bottom-right corner of the textarea
- Small icon (16-20px), subtle opacity until hover
- Entire UI lives inside shadow DOM to avoid style clashes with host page

### Tooltip Menu

- Three actions: "Refine", "Make structured", "Make expert-level"
- Small vertical list, appears above/below button depending on space
- Clicking an action: grabs textarea content → sends to background → replaces text
- Loading state: button shows spinner, disables clicks

### First-Run Key Setup

- On first action click with no key stored, show inline overlay instead of tooltip menu
- Two fields: provider dropdown (OpenAI / Anthropic) + API key input
- "Save" button → stores to `chrome.storage.local` → proceeds with the action
- Overlay dismissible, reappears on next action click if key still missing

## Prompt Improver

### System Prompts

- **Refine:** "Improve this prompt for clarity and specificity. Keep the same intent. Return only the improved prompt, nothing else."
- **Make structured:** "Rewrite this prompt with clear sections, numbered steps, or bullet points as appropriate. Keep the same intent. Return only the improved prompt."
- **Make expert-level:** "Rewrite this prompt as a domain expert would write it — precise language, explicit constraints, defined output format. Return only the improved prompt."

### API Configuration

**OpenAI:**
- `POST https://api.openai.com/v1/chat/completions` — model `gpt-4o-mini`
- Headers: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`
- Body: `{ model, messages: [{role: "system", content: systemPrompt}, {role: "user", content: userPrompt}], max_tokens: 2048, temperature: 0.7 }`

**Anthropic:**
- `POST https://api.anthropic.com/v1/messages` — model `claude-haiku-4-5-20251001`
- Headers: `x-api-key: <apiKey>`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- Body: `{ model, system: systemPrompt, messages: [{role: "user", content: userPrompt}], max_tokens: 2048, temperature: 0.7 }`

### Behavior

- Grab current text from textarea/contenteditable
- If empty, do nothing (button stays inert)
- Store original text before replacement (for potential future undo)
- **Text insertion strategy (critical — site-specific):**
  - **ChatGPT (React-controlled textarea):** Use React's internal `nativeInputValueSetter` to set value, then dispatch native `input` event with `{ bubbles: true }`. This bypasses React's synthetic event system which ignores programmatic `value` sets.
  - **Claude (contenteditable div / ProseMirror-like):** Focus the element, select all content (`document.execCommand('selectAll')`), then use `document.execCommand('insertText', false, newText)` to replace. This preserves the editor's internal state. If `execCommand` fails, fall back to clipboard API (copy new text to clipboard, trigger paste).
- On API error: show brief inline error message near the button ("API error — check your key"), auto-dismiss after 3s
- Debounce action clicks — ignore rapid duplicate clicks while a request is in flight
- **Performance target:** < 2 seconds response

## Autosave & Draft Restore

### Autosave

- `setInterval` every 3 seconds, checks if textarea content changed since last save
- Only writes to `chrome.storage.local` if content actually differs
- Keyed by hostname (`chatgpt.com` or `claude.ai`)
- Stores `lastPrompt` + rolling `history` array of last 5 unique versions
- History dedupes — don't push if identical to most recent entry

### Restore on Page Load

- On content script init, check `drafts[hostname].lastPrompt`
- If textarea is empty and a draft exists, inject the saved text
- Dispatch `input` event so the host site picks it up
- Small toast near the button: "Draft restored" — auto-dismiss 2s

### Edge Cases

- If textarea already has text on load, don't overwrite — only restore into empty fields
- SPA navigation (new chat): MutationObserver catches new textarea, clear old `setInterval` before creating new one to prevent stacking
- Draft restore timing: wait for textarea detection via MutationObserver rather than polling — only attempt restore once textarea is found and confirmed empty
- No explicit TTL — drafts get overwritten naturally

## Saved Prompts

### Save Action

- Bookmark icon appears next to the floating button when textarea has content
- Click → saves current text to `savedPrompts` array in `chrome.storage.local`
- Entry shape: `{ id: crypto.randomUUID(), text: "...", createdAt: Date.now() }`
- Brief toast: "Prompt saved" — auto-dismiss 2s
- Max 50 saved prompts. Oldest auto-removed when limit hit.

### Retrieve

- List/history icon next to the bookmark icon
- Click opens small dropdown with two sections:
  - **Recent** — last 5 draft versions from autosave history (current site)
  - **Saved** — all bookmarked prompts (across sites)
- Each item shows truncated preview (~60 chars)
- Click an item → replaces textarea content + dispatches `input` event

### Deletion

- Small "x" button on hover for each saved prompt
- No confirmation dialog — just remove it

## What Is NOT in V1

- No user accounts
- No cloud sync
- No prompt analytics or scoring
- No marketplace or sharing
- No folders, search, or tags for saved prompts
- No sidebar or dashboard
- No onboarding screens
- No Gmail/Notion support (future consideration)
