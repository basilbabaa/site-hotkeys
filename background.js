// Moves shortcuts saved by version 0.2.x to the per-site storage layout.
importScripts("storage.js");
chrome.runtime.onInstalled.addListener(() => { migrateLegacy(); });
chrome.runtime.onStartup.addListener(() => { migrateLegacy(); });
