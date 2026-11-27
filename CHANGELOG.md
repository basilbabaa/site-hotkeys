# Changelog

## 0.3.0
- Storage: each website's shortcuts are saved as their own item. The old layout put every site in one item, which Chrome caps at about 8 KB (roughly 60 to 80 shortcuts in total). Existing shortcuts are moved over automatically on update.
- New: a pop-up list of the current site's shortcuts. One hotkey for every site (Option+Command+/ by default, changeable in the popup) opens it on the page. Press a shortcut or click a row to go there; Esc closes it. The hotkey is included in Export and Import.
- Click a saved shortcut in the popup to edit it (keys and URL) instead of deleting and re-adding. Position in the list is kept.
- Hint text now says to combine ⌘ ⌃ ⌥ ⇧ with a letter or number. (Those combinations already worked.)

## 0.2.1
- Store icon resized to Chrome Web Store guidelines (96px artwork, 16px padding).
- Added build script and store listing text.

## 0.2.0
- Key sequences can use Command, Control and Option, not just plain keys.
- Export and import all hotkeys from a backup page.
- Fixed extension ID (manifest `key`) so unpacked installs match across machines.
- Drag to reorder the hotkey list.
- Toolbar icon.

## 0.1.0
- First version: per-site key sequences that jump to a saved URL.
