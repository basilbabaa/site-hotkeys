// Watches keystrokes on the page. Two jobs:
//  1. Jump to a saved URL when a saved key sequence for this domain is typed.
//  2. Show a reference list of this site's shortcuts when the "list hotkey" is
//     pressed. Click a row, or press its keys, to go there. Esc closes it.
// A sequence is stored as tokens joined by spaces, e.g. "meta+k meta+j" or
// "alt+g b". Tokens use the physical key (e.code), so Option+G works even
// though macOS turns it into a different character.
(() => {
  const host = location.hostname.replace(/^www\./, "");
  const TIMEOUT_MS = 1200;
  const DEFAULT_SHOW = "alt+meta+/"; // keep in sync with storage.js
  const KEY = "sc:" + host;
  const CFG_SHOW = "cfg:showHotkey";

  let shortcuts = [];
  let showToken = DEFAULT_SHOW;
  let buffer = [];
  let timer = null;
  let overlay = null;

  const SPECIAL = {
    Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]",
    Backslash: "\\", Semicolon: ";", Quote: "'", Comma: ",", Period: ".",
    Slash: "/", Backquote: "`", Space: "space",
  };
  function keyName(code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit\d$/.test(code)) return code.slice(5);
    return SPECIAL[code] || code.toLowerCase();
  }
  function tokenOf(e) {
    if (/^(Shift|Control|Alt|Meta)(Left|Right)$/.test(e.code)) return null;
    const mods = [];
    if (e.ctrlKey) mods.push("ctrl");
    if (e.altKey) mods.push("alt");
    if (e.shiftKey) mods.push("shift");
    if (e.metaKey) mods.push("meta");
    return [...mods, keyName(e.code)].join("+");
  }
  // "ctrl+alt+meta+k" -> "⌃⌥⌘K"
  const SYM = { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" };
  function pretty(token) {
    const parts = token.split("+");
    const key = parts.pop();
    return parts.map((m) => SYM[m]).join("") + (key.length === 1 ? key.toUpperCase() : key);
  }
  const prettySeq = (seq) => seq.split(" ").map(pretty).join("  ");

  function load() {
    // "shortcuts" is the old single-item layout; used only until it is migrated.
    chrome.storage.sync.get([KEY, "shortcuts", CFG_SHOW], (data) => {
      shortcuts = data[KEY] || (data.shortcuts && data.shortcuts[host]) || [];
      showToken = data[CFG_SHOW] || DEFAULT_SHOW;
    });
  }
  load();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes[KEY] || changes.shortcuts || changes[CFG_SHOW])) load();
  });

  function isTyping(el) {
    if (!el) return false;
    const tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  function reset() {
    buffer = [];
    clearTimeout(timer);
  }

  // ---------- the list pop-up ----------
  const CSS = `
    .backdrop{position:fixed;inset:0;z-index:2147483647;background:rgba(15,20,30,.45);display:flex;align-items:center;justify-content:center;font:14px/1.4 -apple-system,system-ui,"Segoe UI",sans-serif;color:#1d1d1f}
    .card{box-sizing:border-box;width:min(560px,calc(100vw - 32px));max-height:min(80vh,640px);overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.35);padding:18px}
    h2{margin:0 0 12px;font-size:15px;font-weight:600}
    h2 span{color:#0a66c2}
    .row{display:flex;align-items:center;gap:14px;width:100%;box-sizing:border-box;padding:10px 12px;border:0;background:none;border-radius:8px;cursor:pointer;text-align:left;font:inherit;color:inherit}
    .row:hover,.row:focus-visible{background:#eef3fb;outline:none}
    .keys{flex:0 0 auto;min-width:92px;font:600 14px ui-monospace,Menlo,monospace;background:#eef3fb;border-radius:6px;padding:3px 8px;white-space:nowrap}
    .row:hover .keys,.row:focus-visible .keys{background:#dce8f8}
    .url{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444}
    .empty{color:#6e6e73;padding:10px 12px}
    .foot{margin-top:12px;border-top:1px solid #e5e5ea;padding-top:10px;color:#6e6e73;font-size:12px}
  `;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function closeOverlay() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function go(url) {
    closeOverlay();
    location.href = url;
  }

  function openOverlay() {
    closeOverlay();
    if (!document.documentElement) return;
    const hostEl = document.createElement("div");
    const root = hostEl.attachShadow({ mode: "closed" });
    try { // constructed stylesheets are not blocked by a page's content security policy
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      root.adoptedStyleSheets = [sheet];
    } catch (_) {
      root.appendChild(el("style", "", CSS));
    }

    const backdrop = el("div", "backdrop");
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeOverlay(); });
    const card = el("div", "card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Site Hotkeys");

    const h = el("h2", "", "Hotkeys for ");
    h.appendChild(el("span", "", host));
    card.appendChild(h);

    if (!shortcuts.length) {
      card.appendChild(el("div", "empty", "No hotkeys saved for this site yet. Click the Site Hotkeys icon in the toolbar to add one."));
    } else {
      shortcuts.forEach((s) => {
        const row = el("button", "row");
        row.setAttribute("type", "button");
        row.appendChild(el("span", "keys", prettySeq(s.keys)));
        const u = el("span", "url", s.url.replace(/^https?:\/\//, ""));
        u.setAttribute("title", s.url);
        row.appendChild(u);
        row.addEventListener("click", () => go(s.url));
        card.appendChild(row);
      });
    }
    card.appendChild(el("div", "foot", "Press a shortcut or click a row to go there. Esc or " + pretty(showToken) + " closes this list."));

    backdrop.appendChild(card);
    root.appendChild(backdrop);
    document.documentElement.appendChild(hostEl);
    overlay = hostEl;
  }

  // ---------- keys ----------
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat) return;
      const token = tokenOf(e);
      if (!token) return; // a modifier key on its own
      const hasMod = e.ctrlKey || e.altKey || e.metaKey;

      // The list hotkey works on every site and needs a Command, Control or Option key.
      if (hasMod && token === showToken) {
        e.preventDefault();
        reset();
        if (overlay) closeOverlay(); else openOverlay();
        return;
      }
      if (overlay && e.code === "Escape") {
        e.preventDefault();
        closeOverlay();
        return;
      }

      if (!shortcuts.length) return;
      // Plain or Shift-only keys are just typing: leave them alone in text boxes.
      if (!hasMod && isTyping(e.target)) return;

      buffer.push(token);
      clearTimeout(timer);
      timer = setTimeout(reset, TIMEOUT_MS);

      const typed = buffer.join(" ");
      const hit = shortcuts.find((s) => s.keys === typed);
      if (hit) {
        e.preventDefault();
        reset();
        go(hit.url);
        return;
      }
      // Keep the key from reaching the page if it could still become a match.
      if (shortcuts.some((s) => s.keys.startsWith(typed + " "))) {
        e.preventDefault();
      } else {
        reset();
      }
    },
    true
  );
})();
