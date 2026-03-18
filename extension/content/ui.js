// content/ui.js — Command Palette UI with glassmorphism, SVG icons, keyboard shortcuts

// eslint-disable-next-line no-unused-vars
const PromptUI = (function () {
  'use strict';

  let shadowRoot = null;
  let container = null;
  let tooltip = null;
  let keyOverlay = null;
  let scorePanel = null;
  let errorEl = null;
  let isLoading = false;
  let pendingAction = null;

  let _textarea = null;
  let _site = null;
  let _getText = null;
  let _setText = null;
  let _palettePos = null;

  // ── Lucide-style SVG icons (inline paths, 24x24 viewBox) ──
  const ICONS = {
    sparkle:   '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.4L19 12l-5.2 3.6L12 21l-1.8-5.4L5 12l5.2-3.6z"/></svg>',
    bookmark:  '<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    list:      '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    spinner:   '<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    // Menu action icons
    wand:      '<svg viewBox="0 0 24 24"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72M14 7l3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>',
    layers:    '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
    zap:       '<svg viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    brain:     '<svg viewBox="0 0 24 24"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>',
    shrink:    '<svg viewBox="0 0 24 24"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></svg>',
    braces:    '<svg viewBox="0 0 24 24"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
    gauge:     '<svg viewBox="0 0 24 24"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
    // Format icons
    hash:      '<svg viewBox="0 0 24 24"><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></svg>',
    code:      '<svg viewBox="0 0 24 24"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>',
    listTree:  '<svg viewBox="0 0 24 24"><path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
    table:     '<svg viewBox="0 0 24 24"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>',
    fileJson:  '<svg viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/></svg>',
    scissors:  '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
    close:     '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  };

  // ── Token estimator ──
  function estimateTokens(text) {
    if (!text) return 0;
    const charEstimate = Math.ceil(text.length / 4);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordEstimate = Math.ceil(words.length * 1.3);
    return Math.round((charEstimate + wordEstimate) / 2);
  }

  const TOKEN_PRICES = {
    'chatgpt.com': { default: 0.0025 },
    'claude.ai':   { default: 0.003 }
  };

  function estimateCost(tokens, site) {
    const prices = TOKEN_PRICES[site] || TOKEN_PRICES['chatgpt.com'];
    return tokens * (prices.default / 1000);
  }

  function formatCost(cost) {
    if (cost < 0.001)  return '<$0.001';
    if (cost < 0.01)   return '~$' + cost.toFixed(3);
    return '~$' + cost.toFixed(2);
  }

  let tokenBadge = null;

  // ── Format tags (client-side, no API) ──
  const FORMAT_TAGS = [
    { label: 'Markdown',  icon: 'hash',     key: null, text: '\n\nRespond in well-formatted markdown with headers and bullet points.' },
    { label: 'Code only', icon: 'code',     key: null, text: '\n\nReturn only the code. No explanations, no commentary.' },
    { label: 'Bullets',   icon: 'listTree', key: null, text: '\n\nRespond using concise bullet points.' },
    { label: 'Table',     icon: 'table',    key: null, text: '\n\nPresent the information in a markdown table.' },
    { label: 'JSON',      icon: 'fileJson', key: null, text: '\n\nReturn the response as valid JSON.' },
    { label: 'Short',     icon: 'scissors', key: null, text: '\n\nKeep your response under 200 words. Be concise.' },
  ];

  // ── Menu actions ──
  const MENU_ACTIONS = [
    { section: 'improve',  action: 'refine',           icon: 'wand',   label: 'Refine & clarify',    desc: 'Sharpen vague language',          key: '1' },
    { section: 'improve',  action: 'structured',       icon: 'layers', label: 'Make structured',     desc: 'Organize into sections',          key: '2' },
    { section: 'improve',  action: 'expert',           icon: 'zap',    label: 'Expert-level',        desc: 'Add persona & constraints',       key: '3' },
    { section: 'improve',  action: 'chain_of_thought', icon: 'brain',  label: 'Chain-of-thought',    desc: 'Step-by-step reasoning',          key: '4' },
    { section: 'optimize', action: 'compress',         icon: 'shrink', label: 'Compress tokens',     desc: 'Same intent, fewer tokens',       key: '5' },
    { section: 'optimize', action: 'json_convert',     icon: 'braces', label: 'Convert to JSON',     desc: 'Structured JSON prompt',          key: '6' },
    { section: 'analyze',  action: 'score',            icon: 'gauge',  label: 'Score my prompt',     desc: 'Rate against best practices',     key: '7' },
  ];

  function createShadowUI(textarea) {
    const host = document.createElement('div');
    host.id = 'pta-host';
    host.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;overflow:visible;';
    document.body.appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'closed' });

    // ── Critical inline styles (always loads — prevents unstyled flash) ──
    const criticalCSS = document.createElement('style');
    criticalCSS.textContent = [
      ':host{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;font-size:13px;line-height:1.4;-webkit-font-smoothing:antialiased}',
      '.pta-buttons{display:flex;gap:3px;position:fixed;z-index:2147483647;pointer-events:auto;align-items:center}',
      '.pta-btn{width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,0.07);background:rgba(12,12,14,0.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;pointer-events:auto;opacity:0.7}',
      '.pta-btn svg{width:14px;height:14px;fill:none;stroke:#8b8b96;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.pta-btn-primary{opacity:0.85;border-color:rgba(129,140,248,0.2)}',
      '.pta-btn-primary svg{stroke:#818cf8}',
      '.pta-btn.loading svg{animation:pta-spin 0.7s linear infinite}',
      '@keyframes pta-spin{to{transform:rotate(360deg)}}',
      // Palette
      '.pta-palette{position:fixed;width:280px;max-height:calc(100vh - 24px);background:rgba(12,12,14,0.88);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);border:1px solid rgba(255,255,255,0.07);border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.07);display:none;pointer-events:auto;z-index:10;overflow-y:auto;overflow-x:hidden}',
      '.pta-palette.visible{display:block}',
      '.pta-palette.dragging,.pta-palette.resizing{transition:none;user-select:none}',
      '.pta-palette-header{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:10px 12px 6px;border-bottom:1px solid rgba(255,255,255,0.07);cursor:grab;user-select:none;-webkit-user-select:none}',
      '.pta-palette-title{font-size:11px;font-weight:600;color:#55555f;text-transform:uppercase;letter-spacing:1px}',
      '.pta-palette-footer-row{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%}',
      '.pta-palette-hint{font-size:10px;color:#55555f;font-family:"SF Mono","Fira Code",monospace;flex-shrink:0}',
      '.pta-model-badge{font-size:9px;color:#818cf8;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.15);border-radius:4px;padding:1px 6px;font-family:"SF Mono","Fira Code",monospace;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pta-model-badge:empty{display:none}',
      // Header actions
      '.pta-header-actions{display:flex;gap:2px;margin-left:auto}',
      '.pta-header-btn{background:none;border:1px solid transparent;border-radius:6px;cursor:pointer;padding:3px;display:flex;align-items:center;pointer-events:auto}',
      '.pta-header-btn svg{width:13px;height:13px;fill:none;stroke:#55555f;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      // Sections and items
      '.pta-section-divider{padding:8px 14px 3px;display:flex;align-items:center;gap:8px}',
      '.pta-section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#55555f;white-space:nowrap}',
      '.pta-section-divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,0.07)}',
      '.pta-action-item{display:flex;align-items:center;gap:10px;padding:7px 12px 7px 14px;margin:1px 4px;border-radius:8px;cursor:pointer;pointer-events:auto;color:#e8e8ed}',
      '.pta-action-item:hover{background:rgba(255,255,255,0.05)}',
      '.pta-action-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.pta-action-icon svg{width:15px;height:15px;fill:none;stroke:#8b8b96;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.pta-action-text{display:flex;flex-direction:column;min-width:0;flex:1}',
      '.pta-action-label{font-size:13px;font-weight:500;color:#e8e8ed}',
      '.pta-action-desc{font-size:11px;color:#55555f}',
      '.pta-kbd{font-size:10px;color:#55555f;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:1px 5px;font-family:"SF Mono","Fira Code",monospace;margin-left:auto;flex-shrink:0}',
      // Format pills
      '.pta-format-row{display:flex;flex-wrap:wrap;gap:4px;padding:6px 12px 10px}',
      '.pta-format-pill{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border:1px solid rgba(255,255,255,0.07);border-radius:6px;background:transparent;cursor:pointer;pointer-events:auto;font-size:11px;color:#8b8b96;font-family:inherit}',
      '.pta-pill-icon svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      // Drag grip
      '.pta-drag-grip{display:flex;gap:2px;margin-right:4px}',
      '.pta-drag-grip-col{display:flex;flex-direction:column;gap:2px}',
      '.pta-drag-grip-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.12)}',
      // Resize handles
      '.pta-resize-handle{position:absolute;z-index:20;pointer-events:auto}',
      '.pta-resize-handle-n{top:-3px;left:8px;right:8px;height:6px;cursor:n-resize}',
      '.pta-resize-handle-s{bottom:-3px;left:8px;right:8px;height:6px;cursor:s-resize}',
      '.pta-resize-handle-e{top:8px;bottom:8px;right:-3px;width:6px;cursor:e-resize}',
      '.pta-resize-handle-w{top:8px;bottom:8px;left:-3px;width:6px;cursor:w-resize}',
      '.pta-resize-handle-nw{top:-4px;left:-4px;width:12px;height:12px;cursor:nw-resize}',
      '.pta-resize-handle-ne{top:-4px;right:-4px;width:12px;height:12px;cursor:ne-resize}',
      '.pta-resize-handle-sw{bottom:-4px;left:-4px;width:12px;height:12px;cursor:sw-resize}',
      '.pta-resize-handle-se{bottom:-4px;right:-4px;width:12px;height:12px;cursor:se-resize}',
      // Key overlay
      '.pta-key-overlay{position:fixed;top:0;left:0;width:280px;background:rgba(12,12,14,0.88);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);border:1px solid rgba(255,255,255,0.07);border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.55);display:none;pointer-events:auto;z-index:12;overflow:hidden}',
      '.pta-key-overlay.visible{display:block}',
      '.pta-key-overlay.dragging{transition:none;user-select:none}',
      '.pta-key-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px 8px;border-bottom:1px solid rgba(255,255,255,0.07);cursor:grab;user-select:none;-webkit-user-select:none}',
      '.pta-key-title{font-size:11px;font-weight:600;color:#55555f;text-transform:uppercase;letter-spacing:1px}',
      '.pta-key-close-btn{background:none;border:none;cursor:pointer;padding:2px;pointer-events:auto;display:flex;align-items:center;border-radius:4px}',
      '.pta-key-close-btn svg{width:14px;height:14px;fill:none;stroke:#55555f;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.pta-key-body{padding:12px 14px 14px}',
      '.pta-key-body label{display:block;font-size:10px;font-weight:600;color:#55555f;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px}',
      '.pta-key-body select,.pta-key-body input{width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,0.07);border-radius:7px;font-size:13px;margin-bottom:10px;box-sizing:border-box;background:rgba(0,0,0,0.3);color:#e8e8ed;pointer-events:auto;font-family:inherit}',
      '.pta-key-hint{font-size:11px;color:#55555f;margin-bottom:10px}',
      '.pta-key-save{width:100%;padding:9px 14px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;pointer-events:auto}',
      // Score panel
      '.pta-score-panel{position:fixed;width:300px;max-height:400px;overflow-y:auto;background:rgba(12,12,14,0.88);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);border:1px solid rgba(255,255,255,0.07);border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.55);display:none;pointer-events:auto;z-index:11;color:#e8e8ed;font-size:13px}',
      '.pta-score-panel.visible{display:block}',
      '.pta-score-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px 8px;border-bottom:1px solid rgba(255,255,255,0.07);cursor:grab}',
      '.pta-score-title{font-size:11px;font-weight:600;color:#55555f;text-transform:uppercase;letter-spacing:1px}',
      '.pta-score-close{background:none;border:none;cursor:pointer;padding:2px;display:flex;align-items:center;border-radius:4px;pointer-events:auto}',
      '.pta-score-close svg{width:14px;height:14px;fill:none;stroke:#55555f;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      // Error
      '.pta-error{position:fixed;top:60px;right:24px;background:rgba(127,29,29,0.4);backdrop-filter:blur(12px);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;padding:8px 14px;border-radius:8px;font-size:12px;display:none;pointer-events:auto;z-index:13;white-space:nowrap}',
      '.pta-error.visible{display:block}',
      // Token badge
      '.pta-token-badge{position:absolute;top:100%;right:0;margin-top:6px;display:none;align-items:center;gap:8px;padding:5px 10px;background:rgba(12,12,14,0.85);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.07);border-radius:8px;pointer-events:none;white-space:nowrap;font-size:11px;color:#8b8b96}',
      '.pta-token-badge.visible{display:flex}',
    ].join('\n');
    shadowRoot.appendChild(criticalCSS);

    // ── Full theme CSS (loads async — enhances on top of critical styles) ──
    const themeStyle = document.createElement('style');
    themeStyle.textContent = '';
    shadowRoot.appendChild(themeStyle);

    if (!window.__ptaIsDead || !window.__ptaIsDead()) {
      try {
        fetch(chrome.runtime.getURL('styles.css'))
          .then(function(r) {
            if (!r.ok) throw new Error('CSS fetch failed: ' + r.status);
            return r.text();
          })
          .then(function(css) { themeStyle.textContent = css; })
          .catch(function(err) { console.warn('[Clippy] Could not load theme CSS:', err.message || err); });
      } catch (e) {
        console.warn('[Clippy] Extension context unavailable for CSS:', e.message || e);
      }
    }

    // ── Container ──
    container = document.createElement('div');
    container.className = 'pta-buttons';
    shadowRoot.appendChild(container);

    function repositionContainer() {
      const rect = textarea.getBoundingClientRect();
      container.style.top   = (rect.top + 6) + 'px';
      container.style.right = (window.innerWidth - rect.right + 8) + 'px';
    }
    repositionContainer();
    const repoInterval = setInterval(repositionContainer, 500);
    host._repoInterval = repoInterval;

    // ── Floating buttons ──
    const mainBtn = document.createElement('button');
    mainBtn.className = 'pta-btn pta-btn-primary';
    mainBtn.innerHTML = ICONS.sparkle;
    mainBtn.title = 'Clippy';
    mainBtn.addEventListener('click', onMainButtonClick);
    container.appendChild(mainBtn);

    const bookmarkBtn = document.createElement('button');
    bookmarkBtn.className = 'pta-btn';
    bookmarkBtn.innerHTML = ICONS.bookmark;
    bookmarkBtn.title = 'Save prompt';
    bookmarkBtn.addEventListener('click', onBookmarkClick);
    container.appendChild(bookmarkBtn);

    const listBtn = document.createElement('button');
    listBtn.className = 'pta-btn';
    listBtn.innerHTML = ICONS.list;
    listBtn.title = 'Saved prompts';
    listBtn.addEventListener('click', onListClick);
    container.appendChild(listBtn);

    // ── Command Palette Menu ──
    tooltip = document.createElement('div');
    tooltip.className = 'pta-palette';

    let menuHTML = '<div class="pta-palette-header">' +
      '<div class="pta-drag-grip">' +
        '<div class="pta-drag-grip-col"><div class="pta-drag-grip-dot"></div><div class="pta-drag-grip-dot"></div><div class="pta-drag-grip-dot"></div></div>' +
        '<div class="pta-drag-grip-col"><div class="pta-drag-grip-dot"></div><div class="pta-drag-grip-dot"></div><div class="pta-drag-grip-dot"></div></div>' +
      '</div>' +
      '<span class="pta-palette-title">Clippy</span>' +
      '<div class="pta-header-actions">' +
        '<button class="pta-header-btn pta-settings-btn" title="Model &amp; API settings"><svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="pta-header-btn pta-hc-btn" title="High contrast mode"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></button>' +
      '</div>' +
      '<div class="pta-palette-footer-row"><span class="pta-model-badge" title="Current model"></span><span class="pta-palette-hint">1-7 to select</span></div></div>';
    let currentSection = '';

    MENU_ACTIONS.forEach((item, i) => {
      if (item.section !== currentSection) {
        currentSection = item.section;
        const sectionLabel = currentSection.charAt(0).toUpperCase() + currentSection.slice(1);
        menuHTML += '<div class="pta-section-divider"><span class="pta-section-label">' + sectionLabel + '</span></div>';
      }
      menuHTML += '<div class="pta-action-item pta-accent-' + item.section + '" data-action="' + item.action + '" style="--i:' + i + '">' +
        '<div class="pta-action-icon">' + ICONS[item.icon] + '</div>' +
        '<div class="pta-action-text"><span class="pta-action-label">' + item.label + '</span><span class="pta-action-desc">' + item.desc + '</span></div>' +
        '<kbd class="pta-kbd">' + item.key + '</kbd>' +
        '</div>';
    });

    // Format section
    menuHTML += '<div class="pta-section-divider"><span class="pta-section-label">Format</span></div>';
    menuHTML += '<div class="pta-format-row"></div>';

    tooltip.innerHTML = menuHTML;
    tooltip.addEventListener('click', onTooltipItemClick);

    // Build format pills
    const formatRow = tooltip.querySelector('.pta-format-row');
    FORMAT_TAGS.forEach(tag => {
      const pill = document.createElement('button');
      pill.className = 'pta-format-pill';
      pill.innerHTML = '<span class="pta-pill-icon">' + ICONS[tag.icon] + '</span>' + tag.label;
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        appendFormatTag(tag.text);
      });
      formatRow.appendChild(pill);
    });

    container.appendChild(tooltip);

    // ── Palette drag ──
    const paletteHeader = tooltip.querySelector('.pta-palette-header');

    paletteHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, kbd, input, select')) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = tooltip.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const origTop = rect.top, origLeft = rect.left;
      tooltip.classList.add('dragging');

      function onMouseMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newTop = origTop + dy;
        let newLeft = origLeft + dx;
        const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
        newTop = Math.max(4, Math.min(newTop, window.innerHeight - h - 4));
        newLeft = Math.max(4, Math.min(newLeft, window.innerWidth - w - 4));
        tooltip.style.top = newTop + 'px';
        tooltip.style.left = newLeft + 'px';
      }

      function onMouseUp() {
        _palettePos = {
          top: parseInt(tooltip.style.top, 10),
          left: parseInt(tooltip.style.left, 10)
        };
        tooltip.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      }

      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    });

    // ── Resize handles for palette ──
    const MIN_W = 220, MAX_W = 800, MIN_H = 200, MAX_H = 600;
    const resizeDirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
    resizeDirs.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'pta-resize-handle pta-resize-handle-' + dir;
      tooltip.appendChild(handle);

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = tooltip.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const origW = rect.width, origH = rect.height;
        const origTop = rect.top, origLeft = rect.left;
        tooltip.classList.add('resizing');

        function onMouseMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          let newW = origW, newH = origH, newTop = origTop, newLeft = origLeft;

          // East/West resize
          if (dir.includes('e')) newW = Math.min(MAX_W, Math.max(MIN_W, origW + dx));
          if (dir.includes('w')) {
            newW = Math.min(MAX_W, Math.max(MIN_W, origW - dx));
            newLeft = origLeft + (origW - newW);
          }
          // North/South resize
          if (dir.includes('s')) newH = Math.min(MAX_H, Math.max(MIN_H, origH + dy));
          if (dir.includes('n')) {
            newH = Math.min(MAX_H, Math.max(MIN_H, origH - dy));
            newTop = origTop + (origH - newH);
          }

          // Clamp to viewport
          if (newTop < 4) { newH -= (4 - newTop); newTop = 4; }
          if (newLeft < 4) { newW -= (4 - newLeft); newLeft = 4; }

          tooltip.style.width = newW + 'px';
          tooltip.style.maxHeight = newH + 'px';
          tooltip.style.top = newTop + 'px';
          tooltip.style.left = newLeft + 'px';
        }

        function onMouseUp() {
          tooltip.classList.remove('resizing');
          _palettePos = {
            top: parseInt(tooltip.style.top, 10),
            left: parseInt(tooltip.style.left, 10)
          };
          document.removeEventListener('mousemove', onMouseMove, true);
          document.removeEventListener('mouseup', onMouseUp, true);
        }

        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('mouseup', onMouseUp, true);
      });
    });

    // ── Keyboard navigation for palette ──
    // Arrow keys to move, Shift+Arrow to resize
    tooltip.setAttribute('tabindex', '0');
    tooltip.addEventListener('keydown', (e) => {
      if (!tooltip.classList.contains('visible')) return;
      const step = 20;
      const isShift = e.shiftKey;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Don't capture arrow keys in form elements
        if (e.target.closest('input, select, textarea')) return;
        // Don't capture number key shortcuts
        e.preventDefault();
        e.stopPropagation();

        if (isShift) {
          // Resize
          let w = tooltip.offsetWidth;
          let h = parseInt(tooltip.style.maxHeight, 10) || tooltip.offsetHeight;
          if (e.key === 'ArrowRight') w = Math.min(MAX_W, w + step);
          if (e.key === 'ArrowLeft')  w = Math.max(MIN_W, w - step);
          if (e.key === 'ArrowDown')  h = Math.min(MAX_H, h + step);
          if (e.key === 'ArrowUp')    h = Math.max(MIN_H, h - step);
          tooltip.style.width = w + 'px';
          tooltip.style.maxHeight = h + 'px';
        } else {
          // Move
          let top = parseInt(tooltip.style.top, 10) || 0;
          let left = parseInt(tooltip.style.left, 10) || 0;
          if (e.key === 'ArrowUp')    top = Math.max(4, top - step);
          if (e.key === 'ArrowDown')  top = Math.min(window.innerHeight - 60, top + step);
          if (e.key === 'ArrowLeft')  left = Math.max(4, left - step);
          if (e.key === 'ArrowRight') left = Math.min(window.innerWidth - 100, left + step);
          tooltip.style.top = top + 'px';
          tooltip.style.left = left + 'px';
          _palettePos = { top, left };
        }
      }
    });

    // ── High contrast toggle ──
    let _highContrast = false;
    const hcBtn = tooltip.querySelector('.pta-hc-btn');
    if (hcBtn) {
      hcBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _highContrast = !_highContrast;
        tooltip.classList.toggle('high-contrast', _highContrast);
        hcBtn.classList.toggle('active', _highContrast);
      });
    }

    // ── Settings button (open key overlay from palette) ──
    const settingsBtn = tooltip.querySelector('.pta-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.classList.remove('visible');
        keyOverlay.classList.add('visible');
        _positionPanel(keyOverlay, 280);
      });
    }

    // ── API Key overlay ──
    keyOverlay = document.createElement('div');
    keyOverlay.className = 'pta-key-overlay';
    keyOverlay.innerHTML =
      '<div class="pta-key-header"><span class="pta-key-title">Connect AI Provider</span><button class="pta-key-close-btn">' + ICONS.close + '</button></div>' +
      '<div class="pta-key-body">' +
        '<label>Provider</label>' +
        '<select class="pta-provider-select">' +
          '<option value="groq">Groq (free tier)</option>' +
          '<option value="openai">OpenAI</option>' +
          '<option value="anthropic">Anthropic</option>' +
        '</select>' +
        '<label>Model</label>' +
        '<select class="pta-model-select"></select>' +
        '<label>API Key</label>' +
        '<input type="password" class="pta-key-input" placeholder="Paste your API key..." />' +
        '<div class="pta-key-hint">Stored locally. Never leaves your browser.</div>' +
        '<button class="pta-key-save">Connect &amp; Start</button>' +
      '</div>';

    // Populate model dropdown based on provider
    const providerSelect = keyOverlay.querySelector('.pta-provider-select');
    const modelSelect    = keyOverlay.querySelector('.pta-model-select');
    let _providerModels = null;

    // Fallback model lists in case the background message hasn't responded yet
    const FALLBACK_MODELS = {
      groq:      [
        { id: 'llama-3.3-70b-versatile',       label: 'Llama 3.3 70B' },
        { id: 'llama-3.1-8b-instant',          label: 'Llama 3.1 8B (fast)' },
        { id: 'mixtral-8x7b-32768',            label: 'Mixtral 8x7B' }
      ],
      openai:    [
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { id: 'gpt-4o',      label: 'GPT-4o' },
        { id: 'o3-mini',     label: 'o3-mini' }
      ],
      anthropic: [
        { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku (fast)' },
        { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
        { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus' }
      ]
    };

    function populateModels(provider, currentModel) {
      modelSelect.innerHTML = '';
      const src = _providerModels ? _providerModels.models : FALLBACK_MODELS;
      const models = src[provider] || [];
      models.forEach(function(m) {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.label;
        if (currentModel && m.id === currentModel) opt.selected = true;
        modelSelect.appendChild(opt);
      });
    }

    // Fetch models list from background
    try {
      chrome.runtime.sendMessage({ type: 'get-provider-models' }, function(resp) {
        if (resp && resp.models) {
          _providerModels = resp;
          // Load saved settings to pre-select
          chrome.storage.local.get('settings', function(res) {
            const s = res.settings;
            if (s && s.provider) {
              providerSelect.value = s.provider;
              populateModels(s.provider, s.model);
              if (s.apiKey) keyOverlay.querySelector('.pta-key-input').value = s.apiKey;
            } else {
              populateModels('groq');
            }
          });
        }
      });
    } catch (_) {
      // extension context may be invalidated
    }

    providerSelect.addEventListener('change', function() {
      populateModels(providerSelect.value);
    });

    keyOverlay.querySelector('.pta-key-save').addEventListener('click', onKeySave);
    keyOverlay.querySelector('.pta-key-close-btn').addEventListener('click', () => {
      keyOverlay.classList.remove('visible');
    });

    // Make key overlay draggable
    const keyHeader = keyOverlay.querySelector('.pta-key-header');
    keyHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = keyOverlay.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const origTop = rect.top, origLeft = rect.left;
      keyOverlay.classList.add('dragging');

      function onMouseMove(ev) {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        let newTop = origTop + dy, newLeft = origLeft + dx;
        const w = keyOverlay.offsetWidth, h = keyOverlay.offsetHeight;
        newTop = Math.max(4, Math.min(newTop, window.innerHeight - h - 4));
        newLeft = Math.max(4, Math.min(newLeft, window.innerWidth - w - 4));
        keyOverlay.style.top = newTop + 'px';
        keyOverlay.style.left = newLeft + 'px';
      }

      function onMouseUp() {
        keyOverlay.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      }

      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    });

    container.appendChild(keyOverlay);

    // ── Score Panel ──
    scorePanel = document.createElement('div');
    scorePanel.className = 'pta-score-panel';
    container.appendChild(scorePanel);

    // ── Error ──
    errorEl = document.createElement('div');
    errorEl.className = 'pta-error';
    container.appendChild(errorEl);

    // ── Token Badge ──
    tokenBadge = document.createElement('div');
    tokenBadge.className = 'pta-token-badge';
    container.appendChild(tokenBadge);

    // ── Show/Hide logic ──
    let blurTimeout = null;
    let uiActive = false;

    function showButtons() {
      clearTimeout(blurTimeout);
      container.style.display = 'flex';
    }

    function scheduleHide() {
      if (uiActive) return;
      blurTimeout = setTimeout(() => {
        if (uiActive) return;
        container.style.display = 'none';
        hideAll();
      }, 300);
    }

    textarea.addEventListener('focus', showButtons);
    textarea.addEventListener('blur', scheduleHide);

    shadowRoot.addEventListener('focusin', () => {
      uiActive = true;
      clearTimeout(blurTimeout);
    });

    shadowRoot.addEventListener('focusout', (e) => {
      const relatedInShadow = e.relatedTarget && shadowRoot.contains(e.relatedTarget);
      if (!relatedInShadow) {
        uiActive = false;
        if (document.activeElement !== textarea) scheduleHide();
      }
    });

    shadowRoot.addEventListener('mousedown', (e) => {
      const tag = e.target && e.target.tagName;
      const isFormEl = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'OPTION';
      if (!isFormEl) e.preventDefault();
      clearTimeout(blurTimeout);
      uiActive = true;
    });

    document.addEventListener('mousedown', (e) => {
      if (!host.contains(e.target) && e.target !== host) uiActive = false;
    });

    // ── Keyboard shortcuts (1-7 when palette is open) ──
    shadowRoot.addEventListener('keydown', onKeyboardShortcut);
    document.addEventListener('keydown', (e) => {
      if (tooltip && tooltip.classList.contains('visible') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7) {
          e.preventDefault();
          const action = MENU_ACTIONS[num - 1];
          if (action) {
            tooltip.classList.remove('visible');
            if (action.action === 'score') runScoreAction();
            else runImproveAction(action.action);
          }
        }
        if (e.key === 'Escape') {
          tooltip.classList.remove('visible');
        }
      }
    });

    container.style.display = 'none';
    return host;
  }

  function onKeyboardShortcut(e) {
    if (!tooltip || !tooltip.classList.contains('visible')) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 7) {
      e.preventDefault();
      e.stopPropagation();
      const action = MENU_ACTIONS[num - 1];
      if (action) {
        tooltip.classList.remove('visible');
        if (action.action === 'score') runScoreAction();
        else runImproveAction(action.action);
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      tooltip.classList.remove('visible');
    }
  }

  // ── Token badge ──
  function showTokenBadge(text) {
    if (!tokenBadge) return;
    const tokens = estimateTokens(text);
    const cost = estimateCost(tokens, _site);
    tokenBadge.innerHTML =
      '<span class="pta-token-count">' + tokens.toLocaleString() + ' tokens</span>' +
      '<span class="pta-token-cost">' + formatCost(cost) + ' input cost</span>';
    tokenBadge.classList.add('visible');
    clearTimeout(tokenBadge._hideTimer);
    tokenBadge._hideTimer = setTimeout(() => tokenBadge.classList.remove('visible'), 8000);
  }

  // ── Format tag append ──
  function appendFormatTag(text) {
    const current = _getText(_textarea);
    const newText = current + text;
    _setText(_textarea, newText);
    tooltip.classList.remove('visible');
    showTokenBadge(newText);
    showToast('Format added');
  }

  // Position the palette, restoring saved position or using smart default
  function restorePalettePos() {
    if (_palettePos) {
      const maxTop = window.innerHeight - 60;
      const maxLeft = window.innerWidth - 100;
      tooltip.style.top = Math.min(Math.max(0, _palettePos.top), maxTop) + 'px';
      tooltip.style.left = Math.min(Math.max(0, _palettePos.left), maxLeft) + 'px';
    } else {
      _positionPanel(tooltip, tooltip.offsetWidth || 280);
    }
  }

  // Update the model badge in the palette header
  function updateModelBadge() {
    const badge = tooltip && tooltip.querySelector('.pta-model-badge');
    if (!badge) return;
    try {
      chrome.storage.local.get('settings', function(res) {
        const s = res.settings;
        if (s && s.model) {
          badge.textContent = s.model;
          badge.style.display = '';
        } else if (s && s.provider) {
          const defaults = { groq: 'llama-3.3-70b-versatile', openai: 'gpt-4o-mini', anthropic: 'claude-3-5-haiku-20241022' };
          badge.textContent = defaults[s.provider] || '';
          badge.style.display = '';
        } else {
          badge.style.display = 'none';
        }
      });
    } catch (_) {
      badge.style.display = 'none';
    }
  }

  // Position a fixed panel near the buttons with smart overflow handling
  function _positionPanel(panel, defaultW) {
    const btnRect = container.getBoundingClientRect();
    const w = defaultW || 280;
    const h = panel.offsetHeight || 300;
    let top = btnRect.top + btnRect.height + 8;
    let left = btnRect.right - w;
    if (top + h > window.innerHeight - 12) top = btnRect.top - h - 8;
    if (top < 12) top = 12;
    if (left < 12) left = 12;
    if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
  }

  function hideAll() {
    if (tooltip)     tooltip.classList.remove('visible');
    if (keyOverlay)  keyOverlay.classList.remove('visible');
    if (scorePanel)  scorePanel.classList.remove('visible');
    if (errorEl)     errorEl.classList.remove('visible');
    if (typeof SavedPrompts !== 'undefined') SavedPrompts.hideDropdown();
  }

  // ── Main button click ──
  async function onMainButtonClick(e) {
    e.stopPropagation();
    if (isLoading) return;
    if (window.__ptaIsDead && window.__ptaIsDead()) return;

    hideAll();

    let settings;
    try {
      const res = await chrome.storage.local.get('settings');
      settings = res.settings;
    } catch (_) { return; }

    if (!settings || !settings.apiKey) {
      pendingAction = null;
      keyOverlay.classList.add('visible');
      _positionPanel(keyOverlay, 280);
      return;
    }

    const wasVisible = tooltip.classList.contains('visible');
    tooltip.classList.toggle('visible');
    if (!wasVisible && tooltip.classList.contains('visible')) {
      restorePalettePos();
      updateModelBadge();
    }
  }

  function onTooltipItemClick(e) {
    const item = e.target.closest('.pta-action-item');
    const action = item?.dataset?.action;
    if (!action || isLoading) return;
    tooltip.classList.remove('visible');
    if (action === 'score') runScoreAction();
    else runImproveAction(action);
  }

  async function onKeySave(e) {
    e.stopPropagation();
    const provider = keyOverlay.querySelector('.pta-provider-select').value;
    const model    = keyOverlay.querySelector('.pta-model-select').value;
    const apiKey   = keyOverlay.querySelector('.pta-key-input').value.trim();
    if (!apiKey) return;
    if (window.__ptaIsDead && window.__ptaIsDead()) return;
    try { await chrome.storage.local.set({ settings: { provider, model, apiKey } }); }
    catch (_) { return; }
    keyOverlay.classList.remove('visible');
    if (pendingAction) {
      const a = pendingAction; pendingAction = null;
      runImproveAction(a);
    } else {
      tooltip.classList.add('visible');
      restorePalettePos();
    }
  }

  let _lastOriginalText = null;

  async function runImproveAction(action) {
    if (isLoading) return;
    if (window.__ptaIsDead && window.__ptaIsDead()) return;
    const text = _getText(_textarea);
    if (!text.trim()) return;

    _lastOriginalText = text;
    const beforeTokens = estimateTokens(text);
    isLoading = true;
    const mainBtn = container.querySelector('.pta-btn-primary');
    mainBtn.innerHTML = ICONS.spinner;
    mainBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'improve-prompt', action, prompt: text
      });
      if (!response) return;
      if (response.success) {
        _setText(_textarea, response.text);
        showTokenBadge(response.text);
        if (action === 'compress') {
          const afterTokens = estimateTokens(response.text);
          const pct = beforeTokens > 0 ? Math.round(((beforeTokens - afterTokens) / beforeTokens) * 100) : 0;
          showToast('Compressed: ' + beforeTokens + ' \u2192 ' + afterTokens + ' tokens (\u2212' + pct + '%)');
        } else {
          const labels = { refine:'Refined',structured:'Structured',expert:'Expert-level',chain_of_thought:'Chain-of-thought added',json_convert:'Converted to JSON' };
          showToast(labels[action] || 'Prompt improved');
        }
      } else {
        showError(response.error || 'API error \u2014 check your key');
      }
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) return;
      showError('Connection error');
    } finally {
      isLoading = false;
      mainBtn.innerHTML = ICONS.sparkle;
      mainBtn.classList.remove('loading');
    }
  }

  async function runScoreAction() {
    if (isLoading) return;
    if (window.__ptaIsDead && window.__ptaIsDead()) return;
    const text = _getText(_textarea);
    if (!text.trim()) return;

    isLoading = true;
    const mainBtn = container.querySelector('.pta-btn-primary');
    mainBtn.innerHTML = ICONS.spinner;
    mainBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'improve-prompt', action: 'score', prompt: text
      });
      if (!response) return;
      if (response.success) showScorePanel(response.text);
      else showError(response.error || 'API error \u2014 check your key');
    } catch (err) {
      if (err.message && err.message.includes('Extension context invalidated')) return;
      showError('Connection error');
    } finally {
      isLoading = false;
      mainBtn.innerHTML = ICONS.sparkle;
      mainBtn.classList.remove('loading');
    }
  }

  let _scorePanelPos = null;

  function showScorePanel(rawText) {
    let data;
    try {
      const cleaned = rawText.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
      data = JSON.parse(cleaned);
    } catch (_) {
      scorePanel.innerHTML =
        '<div class="pta-score-header"><span class="pta-score-title">Analysis</span><button class="pta-score-close">' + ICONS.close + '</button></div>' +
        '<div class="pta-score-body">' + escapeHtml(rawText) + '</div>';
      scorePanel.classList.add('visible');
      _positionScorePanel();
      _setupScorePanelDrag();
      scorePanel.querySelector('.pta-score-close').addEventListener('click', () => scorePanel.classList.remove('visible'));
      return;
    }

    const scoreColor = data.score >= 8 ? '#34d399' : data.score >= 5 ? '#fbbf24' : '#f87171';
    const verdictClass = data.score >= 8 ? 'good' : data.score >= 5 ? 'ok' : 'poor';
    const barWidth = (data.score / 10) * 100;

    const strengthsHtml = (data.strengths || []).map(s => '<li class="pta-score-strength">' + escapeHtml(s) + '</li>').join('');
    const improvementsHtml = (data.improvements || []).map(s => '<li class="pta-score-improvement">' + escapeHtml(s) + '</li>').join('');

    scorePanel.innerHTML =
      '<div class="pta-score-header"><span class="pta-score-title">Prompt Score</span><button class="pta-score-close">' + ICONS.close + '</button></div>' +
      '<div class="pta-score-ring">' +
        '<div class="pta-score-num-row"><span class="pta-score-number" style="color:' + scoreColor + '">' + data.score + '</span><span class="pta-score-max">/10</span></div>' +
        '<div class="pta-score-bar"><div class="pta-score-bar-fill" style="width:' + barWidth + '%;background:' + scoreColor + '"></div></div>' +
        '<span class="pta-score-verdict ' + verdictClass + '">' + escapeHtml(data.verdict || '') + '</span>' +
      '</div>' +
      (strengthsHtml ? '<div class="pta-score-section-title">Strengths</div><ul class="pta-score-list">' + strengthsHtml + '</ul>' : '') +
      (improvementsHtml ? '<div class="pta-score-section-title">Improve</div><ul class="pta-score-list">' + improvementsHtml + '</ul>' : '') +
      (data.rewritten_preview ? '<div class="pta-score-section-title">Quick fix</div><div class="pta-score-preview">' + escapeHtml(data.rewritten_preview) + '</div>' : '');

    scorePanel.classList.add('visible');
    _positionScorePanel();
    _setupScorePanelDrag();
    scorePanel.querySelector('.pta-score-close').addEventListener('click', () => scorePanel.classList.remove('visible'));
  }

  function _positionScorePanel() {
    if (_scorePanelPos) {
      const maxTop = window.innerHeight - 60;
      const maxLeft = window.innerWidth - 100;
      scorePanel.style.top = Math.min(Math.max(0, _scorePanelPos.top), maxTop) + 'px';
      scorePanel.style.left = Math.min(Math.max(0, _scorePanelPos.left), maxLeft) + 'px';
    } else {
      // Position near the buttons
      const btnRect = container.getBoundingClientRect();
      const w = 300, h = scorePanel.offsetHeight || 350;
      let top = btnRect.top + btnRect.height + 8;
      let left = btnRect.right - w;
      if (top + h > window.innerHeight - 12) top = btnRect.top - h - 8;
      if (top < 12) top = 12;
      if (left < 12) left = 12;
      if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
      scorePanel.style.top = top + 'px';
      scorePanel.style.left = left + 'px';
    }
  }

  function _setupScorePanelDrag() {
    const header = scorePanel.querySelector('.pta-score-header');
    if (!header) return;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = scorePanel.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const origTop = rect.top, origLeft = rect.left;
      scorePanel.classList.add('dragging');

      function onMouseMove(ev) {
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        let newTop = origTop + dy, newLeft = origLeft + dx;
        const w = scorePanel.offsetWidth, h = scorePanel.offsetHeight;
        newTop = Math.max(4, Math.min(newTop, window.innerHeight - h - 4));
        newLeft = Math.max(4, Math.min(newLeft, window.innerWidth - w - 4));
        scorePanel.style.top = newTop + 'px';
        scorePanel.style.left = newLeft + 'px';
      }

      function onMouseUp() {
        _scorePanelPos = {
          top: parseInt(scorePanel.style.top, 10),
          left: parseInt(scorePanel.style.left, 10)
        };
        scorePanel.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
      }

      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    setTimeout(() => errorEl.classList.remove('visible'), 3000);
  }

  function onBookmarkClick(e) {
    e.stopPropagation(); hideAll();
    const text = _getText(_textarea);
    if (!text.trim()) return;
    if (typeof SavedPrompts !== 'undefined') {
      SavedPrompts.save(text);
      showToast('Prompt saved');
    }
  }

  function onListClick(e) {
    e.stopPropagation(); hideAll();
    if (typeof SavedPrompts !== 'undefined') {
      SavedPrompts.showDropdown(container, _site, (text) => _setText(_textarea, text));
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('pta-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pta-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:rgba(10,10,10,0.92);color:#e0e0e0;padding:10px 18px;border-radius:10px;font-size:13px;z-index:9999999;opacity:0;transition:opacity 0.2s,transform 0.2s;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06);transform:translateY(4px);';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(4px)'; }, 2200);
  }

  return {
    attach(textarea, site, getText, setText) {
      _textarea = textarea;
      _site     = site;
      _getText  = getText;
      _setText  = setText;
      const prev = document.getElementById('pta-host');
      if (prev) { if (prev._repoInterval) clearInterval(prev._repoInterval); prev.remove(); }
      createShadowUI(textarea);
    },
    showToast
  };
})();
