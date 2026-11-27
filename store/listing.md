# Site Hotkeys: Chrome Web Store checklist

Go top to bottom. Tick each box as you go.
- **Click** = something to click or switch on or off.
- **Paste** = copy the grey box and paste it into the field named above it.
- **Upload** = pick the file at the path shown. In the Mac file picker, press **⌘⇧G**, paste the path, press Return.

Version in this guide: **0.3.0**. Rebuild with `./build.sh` after any code change (the zip must have a higher version than the last one you uploaded).

---

## 0. Open the draft
- [ ] Go to the developer dashboard:
```text
https://chrome.google.com/webstore/devconsole
```
- [ ] Check the **Publisher** at the top is your personal account.
- [ ] **Click** the item **Site Hotkeys** (Status: Draft).

---

## 1. Package (left menu: Build > Package)
- [ ] **Click** "Upload new package".
- [ ] **Upload** the zip:
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/dist/site-hotkeys-0.3.0.zip
```
- [ ] If it complains about the version, it needs a bigger number than the last upload. Bump `version` in `manifest.json`, run `./build.sh`, upload again.
- [ ] Check the page now shows **Title: Site Hotkeys** and **Summary: Per-site key sequences that jump to a saved URL on that site.** (They come from the zip; nothing to type.)

---

## 2. Store listing (left menu: Store listing)

### Product details
- [ ] **Paste** into **Description**:
```text
Site Hotkeys lets you jump to the pages you use most on a website with a short keyboard shortcut.

How it works:
1. Open a website and click the Site Hotkeys icon.
2. Click "Grab current" to fill in the page's URL, or type one.
3. Press your key sequence: up to three keys, each one a plain key or a combination of Command, Control, Option and Shift with a letter or number.
4. Click Save.
5. On any page, press your list hotkey (Option+Command+/ unless you change it) to see all your shortcuts for that site. Press one, or click a row, to go there.

From then on, typing that sequence on that website takes you straight to the saved page. Shortcuts only work on the site you saved them for, so the same keys can mean different things on different sites.

Features:
- A pop-up reference of your shortcuts for the site, opened with one hotkey you choose
- Combine Command, Control, Option and Shift with a letter or number, or chain up to three keys
- Per-site shortcuts, as many as you need on each site
- Click a saved shortcut to edit it, or drag and drop to reorder your list
- Export and import all your shortcuts as a file
- Syncs through your Chrome profile
- Plain-key shortcuts stay out of the way while you type in a text box

Your shortcuts are stored in your own Chrome profile. Nothing is sent anywhere.
```
- [ ] **Click** the **Category** dropdown, choose **Productivity**, then the subcategory **Tools**.
- [ ] **Click** the **Language** dropdown, choose **English**.

### Graphic assets
- [ ] **Store icon**: it should already show the blue link icon (it comes from the zip). If the box is empty, **Upload**:
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/icons/icon-128.png
```
- [ ] **Global promo video**: leave empty.
- [ ] **Screenshots**: delete any old ones first (hover over one, click the trash icon). Then **Upload** screenshot 1:
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/store/screenshots/screenshot-1-1280x800.jpg
```
- [ ] **Upload** screenshot 2 (the shortcut list over a page):
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/store/screenshots/screenshot-2-1280x800.jpg
```
- [ ] **Small promo tile**: **Upload**:
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/store/screenshots/promo-small-440x280.jpg
```
- [ ] **Marquee promo tile**: **Upload**:
```text
/Users/basilbabaa/Development/basilbabaa/site-hotkeys/store/screenshots/promo-marquee-1400x560.jpg
```

### Additional fields
- [ ] **Official URL**: leave empty.
- [ ] **Paste** into **Homepage URL**:
```text
https://basilbabaa.com/site-hotkeys/
```
- [ ] **Paste** into **Support URL**:
```text
https://basilbabaa.com/site-hotkeys/
```
- [ ] **Mature content**: leave the switch **off**.
- [ ] **Click** "Save draft" (top right).

---

## 3. Privacy (left menu: Build > Privacy)
The yellow banner about a host permission and an in-depth review is expected. Ignore it.

- [ ] **Paste** into **Single purpose description**:
```text
Lets the user save keyboard shortcuts that navigate to specific pages on a website.
```
- [ ] **Paste** into **storage justification**:
```text
Saves the user's shortcuts (a key sequence and a destination URL for each website) in Chrome's synced extension storage, so they persist and follow the user between devices.
```
- [ ] **Paste** into **activeTab justification**:
```text
When the user clicks the extension icon, reads the address of the current tab so it can show which website the shortcuts belong to and fill in the URL field. It is only used at that moment, on the user's click.
```
- [ ] **Paste** into **Host permission justification**:
```text
The extension runs a small content script on http and https pages because the user can save shortcuts for any website, and the script has to listen for key presses on whichever site that is. On each page it looks up only the shortcuts saved for that page's own domain. It also watches for one hotkey the user chose for showing a list of their shortcuts for that site; when it is pressed, the script shows that list on top of the page. On a site where the user has saved no shortcuts, that hotkey is all it listens for. When the user types a saved key sequence, or clicks a row in the list, it navigates to the URL the user saved. It does not read, modify or collect page content, it makes no network requests, and no data leaves the browser.
```
- [ ] **Remote code** question (only if it appears): choose **No, I am not using remote code**.
- [ ] **Data usage**, "What user data do you plan to collect": leave **all nine boxes empty**.
- [ ] **Check all three** boxes under "I certify that the following disclosures are true".
- [ ] **Paste** into **Privacy policy URL**:
```text
https://basilbabaa.com/site-hotkeys/privacy/
```
- [ ] **Click** "Save draft".

---

## 4. Distribution (left menu: Build > Distribution)
This tab has three sections, top to bottom. The labels below are exactly what the dashboard shows.

### Payments
- [ ] **Click** the radio button **Free of charge** ("Your item is free of charge and doesn't contain any functionality to purchase additional goods, content, services or functionality").
- [ ] Leave **Contains in-app purchases** unselected.

### Visibility
- [ ] **Click** the radio button **Unlisted** ("Only people with the link can see it").
  Note the dashboard says an unlisted item may still show up in web search results. That is fine here.
- [ ] Leave **Public** and **Private** unselected.
- [ ] The dropdown under Private (currently **None**) belongs to Private only. Leave it on **None**.

### Distribution (regions)
- [ ] Leave **All regions** checked.
- [ ] Leave **All unlisted regions** checked.
- [ ] Leave every country in the list below them checked (Albania, Algeria, American Samoa, Angola, and so on). Nothing to change.

- [ ] **Click** "Save draft".

---

## 5. Test instructions (left menu: Access > Test instructions), optional but helps review
Google shows a form with sign-in fields for reviewers. Site Hotkeys has no accounts and no sign-in, so there is nothing to give them.

- [ ] **Username**: leave empty.
- [ ] **Password**: leave empty.
- [ ] If the dashboard will not save with those empty, type `none` in both. Never put a real username or password here: reviewers and the store team can read it.
- [ ] **Paste** into the **Additional instructions** box (this tells the reviewer no sign-in is needed and how to try it):
```text
No account or sign-in is needed. Open any website, click the Site Hotkeys icon, click "Grab current" to fill in the page address, click the Key sequence box and press a key combination such as Control+Option+Command+K, then click Save. Reload that website and press the same keys: the browser goes to the saved address. Press Option+Command+/ on any page to see a list of the saved shortcuts for that site; click a row to go there, or press Escape to close it. Shortcuts only run on the website they were saved for. The extension makes no network requests and collects no data.
```
- [ ] **Click** "Save draft".

---

## 6. Submit
- [ ] **Click** "Why can't I submit?" (top). It should list nothing missing. If it lists something, fix that tab first.
- [ ] **Click** "Submit for review".
- [ ] If a box asks when to publish, choose to **publish automatically after it is approved**.
- [ ] Wait for the review email (a few days; the host permission can make it longer).

---

## 7. After it is approved
- [ ] Open the live listing and copy its address.
- [ ] On https://basilbabaa.com/site-hotkeys/, replace the "Chrome Web Store listing coming soon" line with the link. Also put the link in this repo\'s README.
- [ ] Move your saved hotkeys across: in the old unpacked copy, click "Export / import all hotkeys" > Export. In the store copy, open the same page > Import.

---

## If the store sends it back
Usual causes: a permission justification it did not like, or the description not matching what the extension does. Edit the text above, **Save draft**, then **Submit for review** again.

---

## Rebuilding for a new version (for later)
1. Change `version` in `manifest.json`, add a line to `CHANGELOG.md`.
2. `node test/test.js` (should print "all passed").
3. `./build.sh` writes the new zip to `dist/`.
4. If the look changed: `store/make-screenshot.sh` and `store/make-promos.sh` re-render the three images.
5. Upload the zip on the Package page, re-do any changed fields above, submit.
6. If behavior or permissions changed, update the privacy page first: `sites/basilbabaa-site/site-hotkeys/privacy/index.html`.
