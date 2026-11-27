// Run with: node test/test.js
// Exercises content.js (key combos and sequences) and storage.js (migration)
// against a fake chrome.storage and a fake page. No browser needed.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let failed = 0;
function check(name, cond) {
  console.log((cond ? "ok   " : "FAIL ") + name);
  if (!cond) failed++;
}
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

// ---------- fake chrome.storage.sync ----------
function makeStorage(initial) {
  const data = { ...initial };
  return {
    data,
    get(keys, cb) {
      let out = {};
      if (keys === null) out = { ...data };
      else if (typeof keys === "string") { if (keys in data) out[keys] = data[keys]; }
      else for (const k of keys) if (k in data) out[k] = data[k];
      if (cb) { cb(out); return; }
      return Promise.resolve(out);
    },
    set(items) { Object.assign(data, items); return Promise.resolve(); },
    remove(keys) { for (const k of [].concat(keys)) delete data[k]; return Promise.resolve(); },
  };
}

// ---------- a very small fake DOM (just enough for the list pop-up) ----------
class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.attrs = {}; this.listeners = {}; this.className = ""; this._text = ""; this.parent = null; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  attachShadow() { this.shadow = new El("shadow"); this.shadow.parent = this; return this.shadow; }
  remove() { if (this.parent) { this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; } }
  fire(type, ev) { (this.listeners[type] || []).forEach((f) => f(ev || { target: this })); }
}
function walk(n, out = []) { out.push(n); n.children.forEach((c) => walk(c, out)); if (n.shadow) walk(n.shadow, out); return out; }

// ---------- content.js ----------
function runPage(host, storageData) {
  const handlers = [];
  const store = makeStorage(storageData);
  const ctx = {
    chrome: { storage: { sync: store, onChanged: { addListener() {} } } },
    location: { hostname: host, href: "" },
    document: { documentElement: new El("html"), createElement: (t) => new El(t) },
    window: { addEventListener(type, fn) { if (type === "keydown") handlers.push(fn); } },
    setTimeout, clearTimeout,
  };
  vm.createContext(ctx);
  vm.runInContext(read("content.js"), ctx);
  return {
    ctx,
    rows() { return walk(ctx.document.documentElement).filter((n) => n.className === "row"); },
    overlayOpen() { return ctx.document.documentElement.children.length > 0; },
    text() { return walk(ctx.document.documentElement).map((n) => n._text).join(" "); },
    press(code, mods = {}, tag = "BODY") {
      const e = { code, repeat: false, ctrlKey: !!mods.ctrl, altKey: !!mods.alt, shiftKey: !!mods.shift, metaKey: !!mods.meta,
                  target: { tagName: tag }, prevented: false, preventDefault() { this.prevented = true; } };
      handlers.forEach((h) => h(e));
      return e;
    },
  };
}

(function overlayTests() {
  const sc = [
    { keys: "ctrl+alt+meta+k", url: "https://example.com/dashboard" },
    { keys: "meta+k meta+j", url: "https://example.com/billing" },
  ];
  const p = runPage("example.com", { "sc:example.com": sc });
  check("list is closed at first", !p.overlayOpen());

  const e = p.press("Slash", { alt: true, meta: true });
  check("default hotkey (option+command+/) opens the list", p.overlayOpen() && e.prevented);
  check("list shows a row per shortcut", p.rows().length === 2);
  check("list shows the site and the keys", p.text().includes("example.com") && p.text().includes("⌃⌥⌘K") && p.text().includes("⌘K  ⌘J"));
  check("list shows where each one goes", p.text().includes("example.com/dashboard") && p.text().includes("example.com/billing"));

  p.rows()[1].fire("click");
  check("clicking a row goes to its URL and closes the list", p.ctx.location.href === "https://example.com/billing" && !p.overlayOpen());

  p.ctx.location.href = "";
  p.press("Slash", { alt: true, meta: true });
  p.press("KeyK", { ctrl: true, alt: true, meta: true });
  check("pressing a shortcut's keys goes to its URL and closes the list", p.ctx.location.href === "https://example.com/dashboard" && !p.overlayOpen());

  p.press("Slash", { alt: true, meta: true });
  p.press("Escape");
  check("Escape closes the list without going anywhere", !p.overlayOpen() && p.ctx.location.href === "https://example.com/dashboard");

  p.press("Slash", { alt: true, meta: true });
  p.press("Slash", { alt: true, meta: true });
  check("the hotkey again closes the list", !p.overlayOpen());

  p.press("Slash", { alt: true, meta: true }, "INPUT");
  check("the hotkey works while typing in a text box", p.overlayOpen());
  p.press("Escape");

  p.press("Slash", {});
  check("a plain / does nothing", !p.overlayOpen());

  const none = runPage("empty.com", {});
  none.press("Slash", { alt: true, meta: true });
  check("on a site with no shortcuts the list says so", none.overlayOpen() && none.text().includes("No hotkeys saved"));

  const custom = runPage("example.com", { "sc:example.com": sc, "cfg:showHotkey": "ctrl+shift+h" });
  custom.press("Slash", { alt: true, meta: true });
  check("a custom hotkey replaces the default", !custom.overlayOpen());
  custom.press("KeyH", { ctrl: true, shift: true });
  check("a custom hotkey opens the list", custom.overlayOpen());
})();

(function contentTests() {
  const sc = [
    { keys: "ctrl+alt+meta+k", url: "https://example.com/a" },
    { keys: "ctrl+meta+j", url: "https://example.com/b" },
    { keys: "ctrl+alt+1", url: "https://example.com/c" },
    { keys: "shift+meta+u", url: "https://example.com/d" },
    { keys: "meta+k meta+j", url: "https://example.com/seq" },
    { keys: "g h", url: "https://example.com/plain" },
  ];
  const p = runPage("example.com", { "sc:example.com": sc });

  p.press("KeyK", { ctrl: true, alt: true, meta: true });
  check("ctrl+option+command+letter", p.ctx.location.href === "https://example.com/a");

  p.press("KeyJ", { ctrl: true, meta: true });
  check("control+command+letter", p.ctx.location.href === "https://example.com/b");

  p.press("Digit1", { ctrl: true, alt: true });
  check("control+option+number", p.ctx.location.href === "https://example.com/c");

  p.press("KeyU", { shift: true, meta: true });
  check("shift+command+letter", p.ctx.location.href === "https://example.com/d");

  p.ctx.location.href = "";
  p.press("KeyK", { meta: true });
  const mid = p.press("KeyJ", { meta: true });
  check("two-step sequence cmd+K then cmd+J", p.ctx.location.href === "https://example.com/seq" && mid.prevented);

  p.ctx.location.href = "";
  p.press("KeyG"); p.press("KeyH");
  check("plain key sequence g then h", p.ctx.location.href === "https://example.com/plain");

  p.ctx.location.href = "";
  p.press("KeyG", {}, "INPUT"); p.press("KeyH", {}, "INPUT");
  check("plain keys ignored while typing in a text box", p.ctx.location.href === "");

  p.press("KeyJ", { ctrl: true, meta: true }, "INPUT");
  check("modifier combo still works inside a text box", p.ctx.location.href === "https://example.com/b");

  p.ctx.location.href = "";
  p.press("ShiftLeft", { shift: true }); p.press("MetaLeft", { meta: true });
  check("modifier key alone does nothing", p.ctx.location.href === "");

  const other = runPage("other.com", { "sc:example.com": sc });
  other.press("KeyK", { ctrl: true, alt: true, meta: true });
  check("shortcuts do not fire on a different site", other.ctx.location.href === "");

  const legacy = runPage("example.com", { shortcuts: { "example.com": [{ keys: "ctrl+meta+j", url: "https://example.com/old" }] } });
  legacy.press("KeyJ", { ctrl: true, meta: true });
  check("old single-item layout still works before migration", legacy.ctx.location.href === "https://example.com/old");
})();

// ---------- storage.js ----------
(async function storageTests() {
  const store = makeStorage({
    shortcuts: {
      "a.com": [{ keys: "meta+1", url: "https://a.com/1" }],
      "b.com": [{ keys: "g h", url: "https://b.com/h" }],
      "empty.com": [],
    },
    "sc:b.com": [{ keys: "meta+2", url: "https://b.com/newer" }], // newer data must not be overwritten
  });
  const ctx = { chrome: { storage: { sync: store } } };
  vm.createContext(ctx);
  vm.runInContext(read("storage.js"), ctx);

  await vm.runInContext("migrateLegacy()", ctx);
  check("migration creates a per-site item", JSON.stringify(store.data["sc:a.com"]) === JSON.stringify([{ keys: "meta+1", url: "https://a.com/1" }]));
  check("migration does not overwrite newer data", store.data["sc:b.com"][0].url === "https://b.com/newer");
  check("migration skips empty sites", !("sc:empty.com" in store.data));
  check("migration removes the old item", !("shortcuts" in store.data));
  await vm.runInContext("migrateLegacy()", ctx);
  check("migration is safe to run twice", Object.keys(store.data).sort().join() === "sc:a.com,sc:b.com");

  check("list hotkey defaults to option+command+/", (await vm.runInContext("loadShowHotkey()", ctx)) === "alt+meta+/");
  await vm.runInContext('saveShowHotkey("ctrl+alt+h")', ctx);
  check("list hotkey can be changed", (await vm.runInContext("loadShowHotkey()", ctx)) === "ctrl+alt+h");
  await vm.runInContext('saveShowHotkey("alt+meta+/")', ctx);
  check("setting it back to the default stores nothing", !("cfg:showHotkey" in store.data));
  check("list hotkey must include command, control or option",
    vm.runInContext('validShowHotkey("meta+k") && validShowHotkey("ctrl+alt+/") && !validShowHotkey("shift+k") && !validShowHotkey("k") && !validShowHotkey("meta+ k")', ctx));

  const apply = (list, entry, idx) => vm.runInContext(`applyShortcut(${JSON.stringify(list)}, ${JSON.stringify(entry)}, ${idx})`, ctx);
  const L = [{ keys: "meta+1", url: "u1" }, { keys: "meta+2", url: "u2" }, { keys: "g h", url: "u3" }];
  let r = apply(L, { keys: "meta+3", url: "u4" }, null);
  check("adding a new shortcut appends it", r.action === "saved" && r.list.length === 4 && r.list[3].keys === "meta+3");
  r = apply(L, { keys: "meta+1", url: "new" }, null);
  check("adding existing keys updates that shortcut", r.action === "updated" && r.list.length === 3 && r.list[0].url === "new");
  r = apply(L, { keys: "meta+9", url: "edited" }, 1);
  check("editing replaces in place, keeping its position", r.action === "updated" && r.list.length === 3 && r.list[1].keys === "meta+9" && r.list[1].url === "edited");
  r = apply(L, { keys: "meta+2", url: "only url changed" }, 1);
  check("editing only the URL keeps the same keys", r.action === "updated" && r.list[1].url === "only url changed" && r.list.length === 3);
  r = apply(L, { keys: "meta+1", url: "x" }, 1);
  check("editing onto another shortcut's keys is refused", r.error === "duplicate");
  r = apply(L, { keys: "g", url: "x" }, 0);
  check("editing to a prefix of another shortcut is refused", r.error === "clash" && r.with === "g h");
  r = apply(L, { keys: "g h b", url: "x" }, null);
  check("adding a longer sequence that starts with another is refused", r.error === "clash");
  r = apply(L, { keys: "g", url: "x" }, 2);
  check("a shortcut may be edited to something that only overlapped its old self", r.action === "updated");

  const all = await vm.runInContext("loadAll()", ctx);
  check("loadAll groups by site", Object.keys(all).sort().join() === "a.com,b.com");

  // capacity: 10 shortcuts on each of 40 sites, each site is its own item
  const big = makeStorage({});
  const bctx = { chrome: { storage: { sync: big } } };
  vm.createContext(bctx);
  vm.runInContext(read("storage.js"), bctx);
  let worst = 0;
  for (let s = 0; s < 40; s++) {
    const list = [];
    for (let i = 0; i < 10; i++) list.push({ keys: "ctrl+alt+meta+" + i, url: "https://site" + s + ".example.com/some/longer/path/number/" + i });
    await vm.runInContext(`saveDomain("site${s}.example.com", ${JSON.stringify(list)})`, bctx);
    worst = Math.max(worst, JSON.stringify(list).length);
  }
  check("10 shortcuts on 40 sites: largest item " + worst + " bytes (limit 8192)", worst < 8192);

  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
