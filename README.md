<p align="center">
  <img src="extension/icons/icon128.png" width="80" height="80" alt="Clippy icon" />
</p>

<h1 align="center">Clippy — Prompt Editor</h1>

<p align="center">
  <strong>Your AI prompt engineering sidekick for ChatGPT & Claude</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/size-32%20KB-green?style=flat-square" alt="32 KB" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square" alt="Zero dependencies" />
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/providers-3-purple?style=flat-square" alt="3 Providers" />
</p>

<p align="center">
  Write better prompts without leaving the chat. Refine, structure, score, and compress — one click, right inside ChatGPT and Claude.
</p>

---

## The Problem

Everyone uses ChatGPT and Claude, but almost nobody writes good prompts. Research from MIT, Harvard, OpenAI, Anthropic, and Google shows that structured prompts dramatically outperform vague ones — yet the average user types *"help me write an email"* and hopes for the best.

**Clippy fixes this.** It embeds a prompt engineer directly inside your chat interface. No context switching. No separate tools. No accounts.

## How It Works

```
Write a prompt → Click ✦ → Pick an action → Get an improved prompt → Send it
```

Clippy reads your prompt from the chat input, sends it to an AI model with a specialized system prompt grounded in academic research, and replaces your text with the improved version. The entire loop takes 1–3 seconds.

---

## Features

### 7 AI-Powered Actions

| # | Action | What It Does |
|---|--------|-------------|
| 1 | **Refine & clarify** | Sharpens vague language into specific, actionable text |
| 2 | **Make structured** | Reorganizes into Role → Context → Task → Requirements → Output |
| 3 | **Expert-level** | Adds persona, constraints, edge cases, quality criteria |
| 4 | **Chain-of-thought** | Wraps with step-by-step reasoning framework |
| 5 | **Compress tokens** | Reduces token count 40–60% while preserving intent |
| 6 | **Convert to JSON** | Transforms into structured JSON schema |
| 7 | **Score my prompt** | Rates 1–10 with strengths, improvements, and a quick-fix preview |

### 6 Format Tags (instant, no API call)

Markdown · Code only · Bullets · Table · JSON · Short

### And More

- **Token count + cost estimator** — see approximate tokens and USD cost in real-time
- **Autosave drafts** — saves every 3 seconds with 5-version history
- **Prompt library** — bookmark and reuse your best prompts
- **Model switching** — 15+ models across 3 providers
- **Draggable & resizable** palette (200×200 to 800×600)
- **Keyboard shortcuts** — 1–7 for actions, Arrow keys to move, Shift+Arrow to resize
- **High contrast mode** — accessible toggle in the palette header
- **Reduced motion** — respects `prefers-reduced-motion` system setting

---

## Supported Providers

| Provider | Free Tier | Models |
|----------|-----------|--------|
| **Groq** | Yes | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2, DeepSeek R1 |
| **OpenAI** | No | GPT-4o Mini, GPT-4o, o3-mini, o1-mini |
| **Anthropic** | No | Claude 3.5 Haiku, Claude 3.5 Sonnet, Claude 3.7 Sonnet, Claude 3 Opus |

---

## Install

> Works in Chrome, Edge, Brave, Arc — any Chromium browser.

1. **Download** this repo (or the latest release ZIP)
2. Go to `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Open [chatgpt.com](https://chatgpt.com) or [claude.ai](https://claude.ai)
5. Click the chat input → click **✦** → paste your API key → done

**For a detailed step-by-step guide**, see **[INSTALL.md](INSTALL.md)**.

---

## Architecture

```
extension/
├── manifest.json          # Manifest V3 config
├── background.js          # Service worker — LLM API calls + system prompts
├── styles.css             # Glassmorphic theme (1,092 lines)
├── icons/                 # Extension icons (16, 32, 48, 128)
└── content/
    ├── guard.js           # Error boundary — loads first
    ├── autosave.js        # 3-second draft saves + history
    ├── prompts.js         # Save/retrieve prompt library
    ├── ui.js              # Command palette UI (938 lines)
    └── content.js         # Entry point — textarea detection + wiring
```

### Data Flow

```
User writes prompt in ChatGPT/Claude
         │
   content.js detects textarea (MutationObserver)
         │
   autosave.js saves draft every 3s → chrome.storage.local
         │
   User clicks ✦ → ui.js opens command palette
         │
   User picks action (1–7)
         │
   chrome.runtime.sendMessage → background.js
         │
   background.js selects system prompt + calls LLM API
         │
   Improved text flows back → ui.js injects into textarea
```

### Design Decisions

| Decision | Why |
|----------|-----|
| **Vanilla JS** | Zero dependencies, zero build tools, no version conflicts with host pages |
| **Closed Shadow DOM** | Complete style isolation from ChatGPT/Claude CSS |
| **Inline critical CSS** | Prevents unstyled flash if external CSS fails to load |
| **Research-backed system prompts** | 10 principles from MIT, Harvard, OpenAI, Anthropic, Google baked into every action |
| **Temperature tuning** | 0.2 for analytical tasks (score, JSON), 0.6 for creative rewrites |
| **Context guard pattern** | Global error boundary prevents cascading failures on extension reload |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 |
| Language | Vanilla JavaScript (ES2020) |
| UI isolation | Shadow DOM (closed mode) |
| Styling | CSS custom properties + glassmorphism |
| Storage | `chrome.storage.local` |
| APIs | OpenAI, Anthropic, Groq (direct fetch) |
| Build tools | None |
| Dependencies | None |

**Total: 3,058 lines of code · 8 files · 32 KB**

---

## Privacy & Security

- API keys stored **locally** in the browser — never transmitted to any server we control
- Prompts sent **directly** to the selected provider (OpenAI/Anthropic/Groq) — no middleman
- **No analytics, no telemetry, no tracking, no accounts, no cloud**
- Extension source is fully readable — no minification, no obfuscation
- Closed Shadow DOM prevents host page JavaScript from accessing extension state

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`7` | Run action (when palette is open) |
| `Escape` | Close palette |
| `Arrow keys` | Move palette |
| `Shift + Arrow` | Resize palette |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Buttons don't appear | Click inside the chat input box |
| "Extension context invalidated" | Reload the page or click the refresh banner |
| API error | Click ✦ → gear icon → re-enter your key |
| UI looks unstyled | Reload extension at `chrome://extensions`, close & reopen tab |
| Palette stuck off-screen | Reload page (resets position) or use Arrow keys |

See **[INSTALL.md](INSTALL.md)** for detailed troubleshooting.

---

## Contributing

This is a solo project built for a contest, but PRs are welcome:

1. Fork the repo
2. Make your changes in the `extension/` directory
3. Test by loading unpacked in Chrome
4. Submit a PR with a clear description

No build step needed — edit the files directly and reload.

---

## License

MIT — use it, modify it, share it.

---

<p align="center">
  <sub>Built with vanilla JS, Claude Code, and too much caffeine.</sub>
</p>
