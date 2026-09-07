# ⚡ DirectLink - Chrome Extension (Manifest V3)

> **Record-and-Generalize Extension to reverse-engineer ad-gate loops and provide instant 1-click downloads.**
> **Now supporting Multi-Step DAGs, Backend API Minting, and Chained Intermediate Brokers.**

---

## 🚀 How to Install in Google Chrome

1. **Locate or Extract the `/extension` Folder** on your computer.
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
3. In the top-right corner, turn on **"Developer mode"** (toggle switch).
4. In the top-left corner, click **"Load unpacked"**.
5. Select this **`extension`** folder.
6. The **DirectLink** extension is now installed and ready! Pin it to your browser toolbar.

---

## 🧠 Advanced Resolution Architectures Supported

### 1. Direct URL Template Matching
- The final download URL directly incorporates parameters, slugs, or Base64 hashes extracted from the source page DOM.

### 2. Backend Minting API (Internal or External)
- The main website's download button doesn't link to a file directly. Instead, clicking it triggers an internal API (`POST /api/v2/generate-link`) or external minting backend (`https://api.gateway.io/token`).
- That API accepts the button's `data-file-id`, `data-hash`, or session cookies and **returns a JSON payload containing the download URL**.
- **DirectLink handles this**: The background worker intercepts this API request during the recording session, binds the required parameters from the original button, and on future pages calls the Minting API directly to extract the final CDN link in the background.

### 3. Multi-Step Chained Intermediate Brokers
- The source button sends information to an intermediate service or ad gateway (`https://intermediate-broker.com/view?id=...`).
- That service returns a bridge page that hosts the real download button.
- **DirectLink handles this**: The extension captures the chain, fetches the bridge page in the background, extracts the terminal download button/link, and triggers the file stream with **zero ad popups or timers**.

---

## 🎯 2-Tag Workflow:
1. Open the source page -> Open DirectLink extension -> Click **"1. Tag Page as Source"**.
2. Complete the human verification / redirect steps manually just once.
3. On the final download link/page -> Open DirectLink extension -> Click **"2. Tag Target Download Link"**.
4. Done! On any future item on this domain, click the green **"⚡ Instant Direct Download"** button to bypass all hops automatically.
