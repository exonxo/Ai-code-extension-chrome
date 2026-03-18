# Clippy – Prompt Editor

### Your AI prompt engineering sidekick for ChatGPT & Claude

> Works in **Chrome, Edge, Brave, Arc, Opera** — any Chromium-based browser.
> No account required. No cloud sync. Your API key never leaves your device.
> Total size: **32 KB**. Zero dependencies.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Download](#step-1--download)
3. [Install the Extension](#step-2--install-the-extension)
4. [Get an API Key](#step-3--get-an-api-key)
5. [Connect Your Key](#step-4--connect-your-key)
6. [How to Use Clippy](#how-to-use-clippy)
7. [Features Reference](#features-reference)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Model Selection](#model-selection)
10. [Accessibility](#accessibility)
11. [Updating](#updating)
12. [Uninstalling](#uninstalling)
13. [Troubleshooting](#troubleshooting)
14. [Privacy & Security](#privacy--security)
15. [FAQ](#faq)

---

## System Requirements

- **Browser:** Any Chromium-based browser (Chrome 88+, Edge 88+, Brave, Arc, Opera)
- **OS:** Windows, macOS, Linux — any OS that runs a supported browser
- **Internet:** Required only for API calls (the extension itself works offline)
- **API Key:** From one of the supported providers (Groq offers a free tier)

---

## Step 1 — Download

Download the latest release: **`clippy-prompt-editor-v1.0.0.zip`**

### Unzip the file

- **Windows:** Right-click the `.zip` file → **Extract All** → choose a permanent location
- **macOS:** Double-click the `.zip` file (extracts automatically)
- **Linux:** `unzip clippy-prompt-editor-v1.0.0.zip`

**Choose a permanent location** like `Documents/clippy-extension`. The browser loads the extension directly from this folder — if you delete or move it, the extension breaks.

After unzipping, you should see this folder structure:

```
extension/
  background.js
  manifest.json
  styles.css
  content/
    guard.js
    autosave.js
    prompts.js
    ui.js
    content.js
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
```

---

## Step 2 — Install the Extension

### Chrome / Edge / Brave / Arc

1. Open a new tab and type into the address bar:
   ```
   chrome://extensions
   ```
   (On Edge, use `edge://extensions`. On Brave, use `brave://extensions`.)

2. **Enable Developer Mode**
   - Look for the **Developer mode** toggle in the **top-right corner** of the page
   - Click it to turn it **ON** (the toggle turns blue)
   - Three new buttons appear: "Load unpacked", "Pack extension", "Update"

3. **Load the Extension**
   - Click **Load unpacked**
   - In the file picker, navigate to the `extension` folder you just unzipped
   - Select the `extension` folder (the one containing `manifest.json`) and click **Select Folder**

4. **Verify Installation**
   - You should see **"Clippy - Prompt Editor"** appear in your extensions list
   - The extension card shows the version (1.0.0) and a toggle to enable/disable
   - If you see any errors in red, see the [Troubleshooting](#troubleshooting) section

5. **Pin the Extension** (optional)
   - Click the puzzle piece icon (Extensions) in your browser toolbar
   - Find "Clippy - Prompt Editor" and click the **pin icon** next to it
   - The Clippy icon now stays visible in your toolbar

---

## Step 3 — Get an API Key

Clippy needs an API key from one of three supported AI providers to power prompt improvements. **You only need one.**

| Provider | Cost | Speed | Best For | Get a Key |
|----------|------|-------|----------|-----------|
| **Groq** | Free tier available | Very fast | Getting started, testing | [console.groq.com/keys](https://console.groq.com/keys) |
| **OpenAI** | Pay-per-use (~$0.15/1M tokens for GPT-4o-mini) | Fast | GPT model users | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic** | Pay-per-use (~$0.25/1M tokens for Haiku) | Fast | Claude model users | [console.anthropic.com/keys](https://console.anthropic.com/keys) |

### Getting a Groq Key (Free — Recommended for First-Time Setup)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google, GitHub, or email
3. Navigate to **API Keys** in the left sidebar
4. Click **Create API Key**
5. Give it a name (e.g., "Clippy") → click **Submit**
6. **Copy the key immediately** — it won't be shown again

### Getting an OpenAI Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click **Create new secret key**
4. Name it (e.g., "Clippy") → click **Create secret key**
5. Copy the key (starts with `sk-`)

### Getting an Anthropic Key

1. Go to [console.anthropic.com/keys](https://console.anthropic.com/keys)
2. Sign in to your Anthropic account
3. Click **Create Key**
4. Name it (e.g., "Clippy") → click **Create Key**
5. Copy the key (starts with `sk-ant-`)

---

## Step 4 — Connect Your Key

1. Go to [chatgpt.com](https://chatgpt.com) or [claude.ai](https://claude.ai)
2. Click inside the **chat input box** — three small buttons appear near the top-right of the input:
   - **✦** (sparkle) — the main Clippy button
   - **Bookmark** — save prompts
   - **List** — browse saved prompts
3. Click the **✦ sparkle button**
4. Since no key is configured yet, the **Connect AI Provider** panel appears
5. Select your **Provider** from the dropdown (Groq, OpenAI, or Anthropic)
6. Select a **Model** from the dropdown (each provider offers multiple models)
7. Paste your **API Key** into the key field
8. Click **Connect & Start**

You're done. The command palette opens and you can start improving prompts.

> Your key is stored in the browser's local storage. It is never transmitted anywhere except directly to the API provider you selected. See [Privacy & Security](#privacy--security).

---

## How to Use Clippy

### Basic Workflow

1. **Write a prompt** in the ChatGPT or Claude chat box
2. **Click the ✦ button** to open the command palette
3. **Pick an action** (click it or press 1–7)
4. Clippy sends your prompt to the AI for improvement
5. The improved prompt **replaces your text** in the chat box
6. **Send it** to ChatGPT/Claude as usual

### The Three Buttons

| Button | Name | Action |
|--------|------|--------|
| **✦** | Clippy | Opens the command palette with 7 prompt improvement actions |
| **🔖** | Bookmark | Saves the current prompt text to your local library |
| **☰** | List | Opens a dropdown of your saved and recent prompts |

Buttons appear when you **focus** (click into) the chat input box, and hide when you click away.

---

## Features Reference

### 7 Prompt Actions (AI-powered)

Each action sends your prompt to the selected AI model with a specialized system prompt grounded in prompt engineering research from MIT, Harvard, OpenAI, Anthropic, and Google.

| # | Action | What It Does | When to Use |
|---|--------|-------------|-------------|
| 1 | **Refine & clarify** | Sharpens vague language into specific, actionable text | Your prompt is too general or ambiguous |
| 2 | **Make structured** | Reorganizes into sections: Role → Context → Task → Requirements → Output | Your prompt is a stream-of-consciousness paragraph |
| 3 | **Expert-level** | Adds persona, constraints, edge cases, quality criteria | You want professional-grade results |
| 4 | **Chain-of-thought** | Wraps prompt with step-by-step reasoning framework | Complex tasks needing logical breakdown |
| 5 | **Compress tokens** | Reduces token count 40–60% while preserving intent | Saving money on API costs or hitting context limits |
| 6 | **Convert to JSON** | Transforms natural language into structured JSON schema | Programmatic or API-oriented prompts |
| 7 | **Score my prompt** | Rates 1–10 on clarity, specificity, context, output definition, effectiveness | Learning what makes a good prompt |

### 6 Format Tags (Client-side, instant)

Format tags append a formatting instruction to your prompt. **No API call** — they work instantly.

| Tag | Appends |
|-----|---------|
| **Markdown** | "Respond in well-formatted markdown with headers and bullet points." |
| **Code only** | "Return only the code. No explanations, no commentary." |
| **Bullets** | "Respond using concise bullet points." |
| **Table** | "Present the information in a markdown table." |
| **JSON** | "Return the response as valid JSON." |
| **Short** | "Keep your response under 200 words. Be concise." |

### Token Counter

When you perform any action, a badge appears below the buttons showing:
- **Token count** — approximate number of tokens in your prompt
- **Estimated cost** — approximate USD input cost based on the site

### Autosave

Your prompt drafts are automatically saved every 3 seconds. The extension keeps:
- **Last draft** per site (chatgpt.com and claude.ai separately)
- **5 most recent versions** for each site (accessible via the List button)

### Prompt Library

Click the **Bookmark** button to save any prompt. Click the **List** button to browse:
- **Recent** — your last 5 drafts (from autosave)
- **Saved** — your bookmarked prompts (with delete option)

Click any item to load it into the chat input.

---

## Keyboard Shortcuts

When the **command palette is open**:

| Key | Action |
|-----|--------|
| `1` | Refine & clarify |
| `2` | Make structured |
| `3` | Expert-level |
| `4` | Chain-of-thought |
| `5` | Compress tokens |
| `6` | Convert to JSON |
| `7` | Score my prompt |
| `Escape` | Close the palette |
| `Arrow keys` | Move the palette (20px per press) |
| `Shift + Arrow keys` | Resize the palette |

### Mouse Controls

- **Drag the palette** by its header (the area with grip dots)
- **Resize the palette** by dragging any edge or corner (min: 220x200, max: 800x600)
- **Drag the score panel** by its header
- **Drag the settings panel** by its header

All panel positions are remembered and restored when you reopen them.

---

## Model Selection

### Changing Models

1. Open the command palette (click ✦)
2. Click the **gear icon** (⚙) in the palette header
3. The settings panel opens showing your current provider and model
4. Change the **Provider** dropdown to switch between Groq, OpenAI, or Anthropic
5. The **Model** dropdown updates with available models for that provider
6. Click **Connect & Start** to save

### Available Models

**Groq (Free tier)**
| Model | Speed | Notes |
|-------|-------|-------|
| Llama 3.3 70B | Fast | Default — best balance of quality and speed |
| Llama 3.1 8B | Very fast | Lighter, good for simple rewrites |
| Mixtral 8x7B | Fast | Mixture of experts model |
| Gemma 2 9B | Fast | Google's open model |
| DeepSeek R1 70B | Medium | Strong reasoning model |

**OpenAI**
| Model | Speed | Notes |
|-------|-------|-------|
| GPT-4o Mini | Fast | Default — cheap and capable |
| GPT-4o | Medium | Higher quality, higher cost |
| o3-mini | Medium | Reasoning model |
| o1-mini | Medium | Earlier reasoning model |

**Anthropic**
| Model | Speed | Notes |
|-------|-------|-------|
| Claude 3.5 Haiku | Fast | Default — fastest Claude model |
| Claude 3.5 Sonnet | Medium | Strong all-rounder |
| Claude 3.7 Sonnet | Medium | Latest Sonnet with improvements |
| Claude 3 Opus | Slower | Highest quality Claude model |

### Model Badge

The currently selected model is displayed as a small badge in the palette header, so you always know which model is active.

---

## Accessibility

Clippy includes several accessibility features:

- **High Contrast Mode** — Click the sun icon (☀) in the palette header to toggle. Removes blur effects, increases contrast, strengthens borders, brightens text.
- **Keyboard Navigation** — Full keyboard control without needing a mouse. Arrow keys to move, Shift+Arrow to resize, number keys for actions, Escape to close.
- **Reduced Motion** — Respects the `prefers-reduced-motion` system setting. When enabled, all animations and transitions are disabled.
- **Semantic HTML** — Uses proper `<button>`, `<input>`, `<select>`, and `<label>` elements.
- **Focus Indicators** — Visible focus rings when navigating by keyboard.
- **No Color-Only Indicators** — All color-coded elements also use icons and text labels.

---

## Updating

When a new version is released:

1. **Replace the files** — Delete the contents of your `extension` folder and copy in the new files (or overwrite)
2. **Reload the extension** — Go to `chrome://extensions` → find "Clippy - Prompt Editor" → click the **↻ reload** button on the extension card
3. **Reopen the tab** — **Close** the ChatGPT/Claude tab entirely, then open a fresh one. Content scripts are injected once per page load, so a simple page refresh may not pick up all changes.

Your settings (API key, provider, model) and saved prompts are preserved across updates.

---

## Uninstalling

### Remove the Extension
1. Go to `chrome://extensions`
2. Find "Clippy - Prompt Editor"
3. Click **Remove** → confirm

### Clean Up Files
Delete the `extension` folder from your computer. No other files are created anywhere.

### Data Cleanup
All data (settings, drafts, saved prompts) is stored in Chrome's local storage for the extension. Removing the extension automatically clears this data.

---

## Troubleshooting

### Buttons don't appear on ChatGPT / Claude

**Cause:** Buttons only show when the chat input box has focus.

**Fix:** Click directly inside the chat text input area. The three small buttons (✦, bookmark, list) should appear near the top-right corner of the input box.

If they still don't appear:
- Check that the extension is enabled at `chrome://extensions`
- Make sure you're on `chatgpt.com` or `claude.ai` (not other domains)
- Try reloading the page (Ctrl+R / Cmd+R)

---

### "Extension context invalidated" error or refresh banner

**Cause:** Chrome killed the extension's background service worker (normal in Manifest V3). This happens after browser updates, long idle periods, or extension reloads.

**Fix:**
- If you see the red "Clippy updated — click to refresh" banner, click it
- Otherwise, reload the page (Ctrl+R / Cmd+R)
- If it persists: go to `chrome://extensions` → click the ↻ reload button → close and reopen the tab

---

### API error — check your key

**Cause:** The API key is invalid, expired, or has no credits.

**Fix:**
1. Click the ✦ button to open the palette
2. Click the **gear icon** (⚙) in the palette header
3. Verify the correct provider is selected
4. Re-paste your API key
5. Click **Connect & Start**

If using OpenAI or Anthropic, check that your account has available credits at:
- OpenAI: [platform.openai.com/usage](https://platform.openai.com/usage)
- Anthropic: [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing)

---

### Changes not taking effect after update

**Cause:** Chrome caches content scripts. A page refresh re-runs the old cached scripts.

**Fix:** You must do all three steps in order:
1. Go to `chrome://extensions` → click the **↻ reload** button on Clippy
2. **Close** the ChatGPT/Claude tab entirely (Ctrl+W / Cmd+W)
3. Open a **new** tab and navigate to chatgpt.com or claude.ai

Simply refreshing the page is not enough — you must close the tab and open a fresh one.

---

### UI appears unstyled (large icons, horizontal layout)

**Cause:** The CSS file failed to load into the Shadow DOM (typically after an extension context invalidation).

**Fix:** Reload the page. The extension has embedded fallback styles that should prevent this, but if you see it:
1. Reload extension at `chrome://extensions`
2. Close and reopen the tab
3. Open browser DevTools (F12) → Console tab → look for `[Clippy]` warning messages

---

### Palette is stuck off-screen

**Cause:** The palette was dragged to a position that's now outside the viewport (e.g., after resizing the window).

**Fix:**
- Reload the page — the palette position resets to its smart default
- Or use keyboard navigation: open the palette (click ✦), then press Arrow keys to move it back into view

---

## Privacy & Security

### What Clippy stores locally
- Your API key (in `chrome.storage.local`)
- Your selected provider and model
- Draft history (last 5 versions per site)
- Saved prompts (up to 50)

### What Clippy sends over the network
- Your prompt text — sent **directly** to your selected API provider (Groq, OpenAI, or Anthropic)
- Your API key — sent **only** in the request header to authenticate with the provider

### What Clippy does NOT do
- No analytics or telemetry
- No data collection
- No cloud servers — there is no backend
- No account creation
- No tracking
- Your API key is never sent to anyone other than the provider you selected
- The extension source code is fully readable (no minification, no obfuscation)

### Shadow DOM Isolation
Clippy's UI runs inside a closed Shadow DOM, meaning:
- ChatGPT/Claude's JavaScript cannot access Clippy's internal state
- Clippy's styles don't leak into the host page
- The host page's styles don't affect Clippy's appearance

---

## FAQ

**Q: Is Clippy free?**
A: The extension itself is completely free. You need an API key from one of the providers — Groq offers a free tier with generous limits.

**Q: Does Clippy work on mobile?**
A: No. Chrome extensions are desktop-only. Mobile Chrome does not support extensions.

**Q: Can I use Clippy on other AI sites besides ChatGPT and Claude?**
A: Currently only chatgpt.com and claude.ai are supported. Support for other sites may be added in future versions.

**Q: Does Clippy read my conversations?**
A: No. Clippy only reads the text you type in the chat input box — and only when you explicitly click an action button. It does not access your conversation history, messages, or any other page content.

**Q: Why do I need a separate API key? Can't Clippy use ChatGPT/Claude directly?**
A: Clippy improves your prompt *before* you send it. It uses a separate API call with specialized system prompts to rewrite, structure, or score your text. This requires a direct API key. The improved prompt is then pasted back into the chat box for you to send normally.

**Q: What happens if I switch providers?**
A: Your prompts and drafts are preserved. Only the API key and model selection change. You can switch providers at any time via the gear icon.

**Q: Is my API key safe?**
A: Your key is stored in Chrome's local extension storage, which is sandboxed per-extension. It's only sent directly to the provider's API endpoint in request headers. No third parties ever see it.

**Q: Can I use Clippy offline?**
A: The extension UI works offline (buttons appear, saved prompts load, format tags work). However, the 7 AI-powered actions require an internet connection to reach the API provider.
