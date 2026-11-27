const $ = (id) => document.getElementById(id);
let domain = "";
let keys = [];

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
// Same as content.js: modifiers + physical key, e.g. "alt+g", "meta+shift+k".
function tokenOf(e) {
  if (/^(Shift|Control|Alt|Meta)(Left|Right)$/.test(e.code)) return null;
  const mods = [];
  if (e.ctrlKey) mods.push("ctrl");
  if (e.altKey) mods.push("alt");
  if (e.shiftKey) mods.push("shift");
  if (e.metaKey) mods.push("meta");
  return [...mods, keyName(e.code)].join("+");
}
// Show as ⌃⌥⇧⌘K instead of "ctrl+alt+shift+meta+k".
function pretty(token) {
  const parts = token.split("+");
  const key = parts.pop();
  const sym = { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" };
  return parts.map((m) => sym[m]).join("") + (key.length === 1 ? key.toUpperCase() : key);
}
// Editing shortcuts we never want to hijack.
const RESERVED = ["meta+c", "meta+v", "meta+x", "meta+a", "meta+z", "ctrl+c", "ctrl+v", "ctrl+x", "ctrl+a", "ctrl+z"];

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function say(text, kind) {
  $("msg").textContent = text;
  $("msg").className = kind || "";
}
function say2(text, kind) {
  $("msg2").textContent = text;
  $("msg2").className = kind || "";
}

let showToken = DEFAULT_SHOW;
let editIndex = null; // which saved shortcut is loaded into the form, or null when adding
let tabUrl = "";
let replaceOnNextKey = false; // after clicking a row, the first key you press replaces its old keys

function startEdit(i, s) {
  editIndex = i;
  keys = s.keys.split(" ");
  $("keys").value = keys.map(pretty).join("  ");
  $("url").value = s.url;
  $("save").textContent = "Update";
  $("cancel").hidden = false;
  replaceOnNextKey = true;
  say("Editing. Change the URL, or press new keys to replace the old ones, then Update.", "");
  render();
}
function stopEditing() {
  editIndex = null;
  replaceOnNextKey = false;
  keys = [];
  $("keys").value = "";
  $("save").textContent = "Save";
  $("cancel").hidden = true;
}

// The hotkey that opens the shortcut list (one setting for every site).
async function initListKey() {
  showToken = await loadShowHotkey();
  $("listkey").value = pretty(showToken);
  $("listkey").addEventListener("keydown", async (e) => {
    const bare = !e.metaKey && !e.ctrlKey && !e.altKey;
    if (e.key === "Tab" && bare) return;
    e.preventDefault();
    if (e.key === "Backspace" && bare) {
      showToken = DEFAULT_SHOW;
      await saveShowHotkey(null);
      $("listkey").value = pretty(showToken);
      return say2("Back to the default.", "ok");
    }
    const token = tokenOf(e);
    if (!token) return; // modifier key on its own
    if (bare) return say2("Hold ⌘, ⌃ or ⌥ while you press the key.", "err");
    if (RESERVED.includes(token)) return say2(pretty(token) + " is copy/paste/undo etc. Pick another.", "err");
    const all = await loadAll();
    for (const [d, list] of Object.entries(all)) {
      const hit = list.find((s) => s.keys.split(" ").includes(token));
      if (hit) return say2(pretty(token) + " is already used by a shortcut on " + d + ". Pick another.", "err");
    }
    showToken = token;
    await saveShowHotkey(token);
    $("listkey").value = pretty(token);
    say2("Saved. Press it on any page to see your shortcuts.", "ok");
  });
}

async function render() {
  const list = await loadDomain(domain);
  const ul = $("list");
  ul.innerHTML = "";
  if (!list.length) {
    const p = document.createElement("li");
    p.className = "empty";
    p.textContent = "No hotkeys saved for this site yet.";
    ul.appendChild(p);
    return;
  }
  list.forEach((s, i) => {
    const li = document.createElement("li");
    li.draggable = true;
    li.title = "Click to edit, drag to reorder";
    if (i === editIndex) li.classList.add("editing");
    li.addEventListener("click", (e) => { if (!e.target.closest("button")) startEdit(i, s); });
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      ul.querySelectorAll(".over").forEach((x) => x.classList.remove("over"));
    });
    li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("over"); });
    li.addEventListener("dragleave", () => li.classList.remove("over"));
    li.addEventListener("drop", async (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      if (Number.isNaN(from) || from === i) return render();
      const arr = await loadDomain(domain);
      const [moved] = arr.splice(from, 1);
      arr.splice(i, 0, moved);
      await saveDomain(domain, arr);
      stopEditing();
      render();
    });
    const grip = document.createElement("span");
    grip.className = "grip";
    grip.textContent = "⋮⋮";
    grip.title = "Drag to reorder";
    li.appendChild(grip);
    const code = document.createElement("code");
    code.textContent = s.keys.split(" ").map(pretty).join("  ");
    const u = document.createElement("span");
    u.className = "u";
    u.textContent = s.url;
    u.title = s.url;
    const del = document.createElement("button");
    del.textContent = "✕";
    del.title = "Delete";
    del.onclick = async () => {
      const arr = await loadDomain(domain);
      arr.splice(i, 1);
      await saveDomain(domain, arr);
      stopEditing();
      render();
    };
    li.append(code, u, del);
    ul.appendChild(li);
  });
}

$("backup").onclick = (e) => { e.preventDefault(); chrome.tabs.create({ url: chrome.runtime.getURL("options.html") }); };

async function init() {
  await migrateLegacy();
  await initListKey();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  domain = tab && tab.url ? hostOf(tab.url) : "";
  if (!domain || !/^https?:/.test(tab.url)) {
    $("domain").textContent = "(not available here)";
    $("save").disabled = true;
    $("grab").disabled = true;
    say("Open a regular website, then click the icon.", "err");
    return;
  }
  $("domain").textContent = domain;
  tabUrl = tab.url;
  $("url").value = tab.url;
  $("cancel").onclick = () => { stopEditing(); $("url").value = tabUrl; say(""); render(); };
  render();

  $("grab").onclick = async () => {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    $("url").value = t.url;
  };

  $("keys").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.metaKey && !e.ctrlKey && !e.altKey) return;
    e.preventDefault();
    if (e.key === "Backspace" && !e.metaKey && !e.ctrlKey && !e.altKey) { keys = []; replaceOnNextKey = false; say(""); $("keys").value = ""; return; }
    const token = tokenOf(e);
    if (!token) return; // modifier key on its own
    if (RESERVED.includes(token)) { say(pretty(token) + " is copy/paste/undo etc. Pick another.", "err"); return; }
    if (token === showToken) { say(pretty(token) + " is your list hotkey. Pick another.", "err"); return; }
    if (replaceOnNextKey) { keys = []; replaceOnNextKey = false; }
    if (keys.length >= 3) { say("Three keys max. Backspace to start over.", "err"); return; }
    keys.push(token);
    say("");
    $("keys").value = keys.map(pretty).join("  ");
  });

  $("save").onclick = async () => {
    let url = $("url").value.trim();
    if (!url) return say("Enter a URL.", "err");
    if (!/^https?:\/\//.test(url)) url = "https://" + domain + (url.startsWith("/") ? "" : "/") + url;
    if (hostOf(url) !== domain) return say("That URL is not on " + domain + ".", "err");
    if (!keys.length) return say("Press a key sequence first.", "err");
    const seq = keys.join(" ");

    const list = await loadDomain(domain);
    const res = applyShortcut(list, { keys: seq, url }, editIndex);
    if (res.error === "clash") return say("Clashes with \"" + res.with.split(" ").map(pretty).join(" ") + "\": one is the start of the other.", "err");
    if (res.error) return say("Another shortcut on this site already uses those keys.", "err");
    try {
      await saveDomain(domain, res.list);
    } catch (err) {
      return say("Could not save: " + (err && err.message ? err.message : "storage is full for this site."), "err");
    }
    const wasEditing = editIndex !== null;
    stopEditing();
    if (wasEditing) $("url").value = tabUrl;
    say(res.action === "updated" ? "Updated." : "Saved.", "ok");
    render();
  };
}
init();
