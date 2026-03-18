# Clippy — Prompt Editor
### Contest Submission

---

## What Problem Were We Trying to Solve?

Everyone using ChatGPT or Claude writes prompts, but almost nobody writes *good* prompts. Research from MIT, Harvard, OpenAI, Anthropic, and Google shows that structured, specific prompts dramatically outperform vague ones — yet the average user types "help me write an email" and hopes for the best.

The gap is clear:
- **Prompt engineering guides exist** — but nobody reads a 30-page PDF before asking ChatGPT a question.
- **Standalone prompt tools exist** — but they live in separate tabs, breaking the user's flow.
- **Paid prompt platforms exist** — but they require accounts, cloud sync, and subscriptions.

**Clippy solves this by embedding a prompt engineer directly inside ChatGPT and Claude.** It appears right next to the chat input — one click to refine, structure, score, or compress any prompt. No accounts. No cloud. No context switching. Users bring their own API key (OpenAI, Anthropic, or Groq) and everything stays on their device.

The core loop: **Write → Improve → Save → Reuse.**

---

## Describe Your Workflow / Process

### Architecture Decisions

**Stack:** Vanilla JavaScript, Chrome Manifest V3, Shadow DOM, CSS custom properties. Zero dependencies. Zero build tools. The entire extension is 3,058 lines across 8 files and ships at 32 KB.

**Why vanilla JS?** Chrome extensions inject into pages we don't control (ChatGPT, Claude). Frameworks add weight, version conflicts, and attack surface. Vanilla JS in a closed Shadow DOM gives us complete style isolation and zero footprint on the host page.

**Why Shadow DOM (closed mode)?** ChatGPT and Claude have aggressive CSS and JavaScript. A closed shadow root guarantees our glassmorphic UI renders identically regardless of what the host page does. Their styles can't leak in; ours can't leak out.

### Development Flow

1. **Research phase** — Distilled 10 prompt engineering principles from academic papers and official guides into a 3,000-character knowledge base. This gets injected into every LLM system prompt, so the AI doesn't just rewrite — it applies research-backed techniques.

2. **Background service worker** — Built 7 specialized system prompts, each targeting a different dimension of prompt quality (clarity, structure, expertise, reasoning, compression, schema conversion, scoring). Chose deliberate temperature settings: 0.2 for analytical tasks (scoring, JSON), 0.6 for creative rewrites.

3. **Content script architecture** — Five scripts load in strict order:
   - `guard.js` (error boundary — catches "Extension context invalidated" before anything else runs)
   - `autosave.js` (3-second draft saves with 5-version history)
   - `prompts.js` (save/retrieve prompt library)
   - `ui.js` (command palette, score panel, settings overlay — 960 lines)
   - `content.js` (orchestrator — detects textarea, wires modules together)

4. **UI design** — Glassmorphic dark theme (`backdrop-filter: blur(20px) saturate(1.3)`) with three accent colors mapping to action categories (indigo=improve, amber=optimize, emerald=analyze). Staggered cascade animations (35ms per item) make the palette feel alive. Every panel is draggable, the palette is resizable (200x200 to 800x600), and positions persist across sessions.

5. **Accessibility** — High contrast mode toggle, full keyboard navigation (Arrow keys to move, Shift+Arrow to resize, 1-7 for actions, Escape to close), `prefers-reduced-motion` support, semantic HTML throughout.

6. **Multi-provider support** — Three providers (Groq free tier, OpenAI, Anthropic) with model selection per provider. Settings stored locally in `chrome.storage.local`. API keys never leave the browser.

### Key Technical Challenges Solved

| Challenge | Solution |
|-----------|----------|
| ChatGPT migrated from `<textarea>` to `<div contenteditable>` | Adaptive detection with multiple fallback strategies (execCommand → clipboard → direct set) |
| Extension reloads kill content scripts mid-session | Global guard pattern with sync/async dead checks + user-facing refresh banner |
| Shadow DOM clicks steal focus from host textarea | `mousedown preventDefault` on non-form elements + `focusin/focusout` tracking with `uiActive` flag |
| SPA navigation destroys/recreates textareas | MutationObserver on document.body with 300ms debounce |
| Panels render off-screen near viewport edges | Smart overflow detection that flips panels upward/leftward when needed |

---

## What Was the Outcome?

A fully functional, production-quality Chrome extension that:

**7 prompt actions** powered by research-backed system prompts:
1. **Refine & clarify** — sharpens vague language into specific, actionable prompts
2. **Make structured** — reorganizes into Role → Context → Task → Requirements → Output Format
3. **Expert-level** — adds persona, constraints, edge cases, and quality criteria
4. **Chain-of-thought** — classifies task type and wraps with appropriate reasoning framework
5. **Compress tokens** — reduces token count 40-60% while preserving intent
6. **Convert to JSON** — transforms natural language into structured JSON schema
7. **Score my prompt** — rates 1-10 against 5 research-backed criteria with strengths, improvements, and a quick-fix preview

**6 format tags** (client-side, zero latency): Markdown, Code only, Bullets, Table, JSON, Short

**Token count + cost estimator** showing approximate input tokens and USD cost in real-time

**Autosave drafts** every 3 seconds with 5-version history per site

**Prompt library** to save, browse, and reuse prompts across sessions

**Model switching** across 3 providers and 15+ models — from free Groq Llama to Claude 3 Opus

**Draggable, resizable command palette** with keyboard navigation and high contrast mode

**32 KB total size.** No build step. No dependencies. No accounts. No cloud.

---

## How Generic Is This?

### Rating: **5 — Universally Applicable**

This extension works for *anyone who uses ChatGPT or Claude* — which means hundreds of millions of users. It doesn't target a niche domain or specific profession. A developer, a marketer, a student, a product manager, and a researcher all benefit equally because the underlying problem (writing better prompts) is universal.

**Why it's a 5:**

- **Zero domain specificity** — The 10 prompt engineering principles apply to any prompt, in any field, for any task. "Add constraints and context" helps a developer writing a code review prompt just as much as it helps a teacher writing a lesson plan prompt.

- **Zero configuration required** — Works out of the box on chatgpt.com and claude.ai. No setup beyond pasting an API key (and Groq offers a free tier, so cost isn't a barrier).

- **Zero lock-in** — Three providers, 15+ models, local storage only. Users can switch providers or delete the extension with zero consequences.

- **Accessible by design** — Keyboard navigation, high contrast mode, reduced motion support, and a simple 1-7 shortcut system mean it works for users with different abilities and preferences.

- **Scales with expertise** — Beginners use "Refine" and "Score" to learn what makes a good prompt. Advanced users use "Compress" and "JSON Convert" to optimize token spend. The same tool serves both.

The only constraint is the platform (Chromium browsers + ChatGPT/Claude sites), which covers the vast majority of LLM users today.

---

## Technical Summary

| Metric | Value |
|--------|-------|
| Total lines of code | 3,058 |
| Number of files | 8 |
| Package size | 32 KB |
| External dependencies | 0 |
| Build tools required | None |
| Accounts required | None |
| Data stored in cloud | None |
| Providers supported | 3 (Groq, OpenAI, Anthropic) |
| Models available | 15+ |
| Prompt actions | 7 |
| Format tags | 6 |
| Accessibility features | 6 (keyboard nav, high contrast, reduced motion, focus management, semantic HTML, color-independent indicators) |

---

## Architecture at a Glance

```
User types prompt in ChatGPT/Claude
         |
    content.js detects textarea (MutationObserver)
         |
    autosave.js saves draft every 3s
         |
    User clicks Clippy button → ui.js opens command palette
         |
    User picks action (1-7) or format tag
         |
    chrome.runtime.sendMessage → background.js
         |
    background.js selects system prompt + calls LLM API
         |
    Response flows back → ui.js injects improved text
         |
    Token badge shows count + cost estimate
```

All UI lives inside a closed Shadow DOM. All data lives in chrome.storage.local. All API calls go directly from the user's browser to the provider. Nothing touches a server we control.
