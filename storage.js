// Shared storage helpers (popup, options page and background worker).
// Each website's shortcuts are their own item in chrome.storage.sync under the
// key "sc:<domain>". Chrome caps one item at ~8 KB, so one item per site keeps
// every site far from the limit (the old layout put every site in ONE item).
const SC_PREFIX = "sc:";

async function loadDomain(domain) {
  const k = SC_PREFIX + domain;
  const o = await chrome.storage.sync.get(k);
  return o[k] || [];
}

async function saveDomain(domain, list) {
  const k = SC_PREFIX + domain;
  if (list.length) await chrome.storage.sync.set({ [k]: list });
  else await chrome.storage.sync.remove(k);
}

// { "example.com": [{keys, url}], ... }
async function loadAll() {
  const all = await chrome.storage.sync.get(null);
  const out = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(SC_PREFIX) && Array.isArray(v) && v.length) out[k.slice(SC_PREFIX.length)] = v;
  }
  return out;
}

// Version 0.2.x kept everything in one item called "shortcuts". Move it to the
// per-site layout. Safe to run any number of times.
async function migrateLegacy() {
  const { shortcuts } = await chrome.storage.sync.get("shortcuts");
  if (!shortcuts || typeof shortcuts !== "object") return;
  const items = {};
  for (const [domain, list] of Object.entries(shortcuts)) {
    if (Array.isArray(list) && list.length) items[SC_PREFIX + domain] = list;
  }
  const have = await chrome.storage.sync.get(Object.keys(items));
  for (const k of Object.keys(have)) delete items[k]; // never overwrite newer data
  if (Object.keys(items).length) await chrome.storage.sync.set(items);
  await chrome.storage.sync.remove("shortcuts");
}

// The one hotkey that opens the shortcut list on any site (a key token like "alt+meta+/").
// Keep DEFAULT_SHOW in sync with content.js.
const CFG_SHOW = "cfg:showHotkey";
const DEFAULT_SHOW = "alt+meta+/";

async function loadShowHotkey() {
  const o = await chrome.storage.sync.get(CFG_SHOW);
  return o[CFG_SHOW] || DEFAULT_SHOW;
}

async function saveShowHotkey(token) {
  if (token && token !== DEFAULT_SHOW) await chrome.storage.sync.set({ [CFG_SHOW]: token });
  else await chrome.storage.sync.remove(CFG_SHOW);
}

// Needs Command, Control or Option so it never fires while typing normally.
function validShowHotkey(token) {
  return typeof token === "string" && /^(ctrl\+)?(alt\+)?(shift\+)?(meta\+)?[^\s+]+$/.test(token) && /(^|\+)(ctrl|alt|meta)\+/.test(token);
}

// Add a shortcut, or replace the one at editIndex. Returns {list, action} or {error}.
// Rules: no two shortcuts on a site may share keys, and none may be the start of another
// (a shorter one would always fire first). Adding keys that already exist updates that one.
function applyShortcut(list, entry, editIndex = null) {
  const seq = entry.keys;
  const others = list.map((s, i) => ({ s, i })).filter((x) => x.i !== editIndex);
  const clash = others.find(({ s }) => s.keys !== seq && (s.keys.startsWith(seq + " ") || seq.startsWith(s.keys + " ")));
  if (clash) return { error: "clash", with: clash.s.keys };
  const next = list.slice();
  if (editIndex !== null) {
    if (others.some(({ s }) => s.keys === seq)) return { error: "duplicate" };
    next[editIndex] = entry;
    return { list: next, action: "updated" };
  }
  const i = next.findIndex((s) => s.keys === seq);
  if (i >= 0) { next[i] = entry; return { list: next, action: "updated" }; }
  next.push(entry);
  return { list: next, action: "saved" };
}
