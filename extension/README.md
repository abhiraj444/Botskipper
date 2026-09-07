# ⚡ DirectLink - Chrome Extension (Manifest V3)

> **Record-and-Generalize Extension to reverse-engineer ad-gate loops and provide instant 1-click downloads.**

---

## 🚀 How to Install in Google Chrome

1. **Download or Locate the `/extension` Folder** in your workspace or project.
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
3. In the top-right corner, turn on **"Developer mode"** (toggle switch).
4. In the top-left corner, click **"Load unpacked"**.
5. Select this **`extension`** folder.
6. The **DirectLink** extension is now installed and ready! You can pin it to your browser toolbar.

---

## 🎯 How to Use (2-Tag Workflow)

### Step 1: Tag the Source Page
1. Visit any resource/download page that typically makes you jump through ad redirect pages.
2. Click the **DirectLink extension icon** in your toolbar.
3. Click **"1. Tag Page as Source"**.
4. The extension captures all metadata, DOM entities, data attributes, and URL tokens.

### Step 2: Navigate through the Ad Loop (Only Once!)
- Complete the human verification/redirect steps manually just once.

### Step 3: Tag the Final Target Download Link
1. Once you land on the final download page or direct link, open the DirectLink extension.
2. Click **"2. Tag Target Download Link"**.
3. The internal **Relationship Solver** automatically reverse-engineers the relationship between the source page's identifiers and the final target parameters!
4. The synthesized bypass recipe is saved to your browser's local storage.

---

## ⚡ Future Visits to That Domain
- Visit **any other book, file, or item page** on that domain.
- DirectLink automatically injects a green **"⚡ Instant Direct Download"** button next to the standard download button.
- Clicking this button invokes the direct binary link immediately—**0 ad redirects, 0 popups, 0 countdown timers!**

---

## 📂 File Structure
- `manifest.json` — Chrome Extension Manifest V3 configuration.
- `solver.js` — Core Relationship Solver Engine (token alignment, inverse Base64/Hex decoding, Next.js hydration prober).
- `background.js` — Service worker managing sessions, network analysis, and storage.
- `content_script.js` — DOM snapshot extractor and 1-click bypass button injector.
- `popup.html` & `popup.js` & `popup.css` — High-contrast extension popup interface.
