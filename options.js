const $ = (id) => document.getElementById(id);

function say(text, kind) {
  $("msg").textContent = text;
  $("msg").className = kind || "";
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}

async function getAll() {
  await migrateLegacy();
  return loadAll();
}

function total(all) {
  return Object.values(all).reduce((n, l) => n + l.length, 0);
}

async function showCount() {
  const all = await getAll();
  const sites = Object.keys(all).length;
  $("count").textContent = total(all) + " hotkeys saved across " + sites + " site" + (sites === 1 ? "" : "s") + ".";
}

$("export").onclick = async () => {
  const all = await getAll();
  const data = { app: "site-hotkeys", version: 1, showHotkey: await loadShowHotkey(), shortcuts: all };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "site-hotkeys-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  say("Exported " + total(all) + " hotkeys.", "ok");
};

function clashes(list, seq) {
  return list.some((s) => s.keys !== seq && (s.keys.startsWith(seq + " ") || seq.startsWith(s.keys + " ")));
}

$("file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { return say("That file is not valid JSON.", "err"); }
  if (!data || data.app !== "site-hotkeys" || typeof data.shortcuts !== "object" || !data.shortcuts) {
    return say("That does not look like a Site Hotkeys export.", "err");
  }

  const all = await getAll();
  const touched = new Set();
  let added = 0, skipped = 0;
  for (const [domain, entries] of Object.entries(data.shortcuts)) {
    if (!Array.isArray(entries)) { skipped++; continue; }
    const list = all[domain] || [];
    for (const item of entries) {
      const ok = item && typeof item.keys === "string" && typeof item.url === "string" &&
        /^\S+( \S+){0,2}$/.test(item.keys) && /^https?:\/\//.test(item.url) &&
        hostOf(item.url) === domain.replace(/^www\./, "");
      if (!ok || clashes(list, item.keys)) { skipped++; continue; }
      const i = list.findIndex((s) => s.keys === item.keys);
      const entry = { keys: item.keys, url: item.url };
      if (i >= 0) list[i] = entry; else list.push(entry);
      added++;
      touched.add(domain);
    }
    if (list.length) all[domain] = list;
  }
  try {
    for (const domain of touched) await saveDomain(domain, all[domain]);
    // the list hotkey, unless it would clash with a shortcut
    if (validShowHotkey(data.showHotkey)) {
      const used = Object.values(all).some((l) => l.some((s) => s.keys.split(" ").includes(data.showHotkey)));
      if (!used) await saveShowHotkey(data.showHotkey);
    }
  } catch (err) {
    return say("Could not save everything: " + (err && err.message ? err.message : "storage is full."), "err");
  }
  e.target.value = "";
  say("Imported " + added + " hotkeys" + (skipped ? ", skipped " + skipped + " that were invalid or clashed." : "."), skipped && !added ? "err" : "ok");
  showCount();
};

showCount();
