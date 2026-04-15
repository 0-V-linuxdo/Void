# Privacy Policy

**Last updated:** April 15, 2026

## Overview

Void is a client-side modification for [Grok](https://grok.com). It runs entirely in your browser and does not collect, store, or transmit any personal data.

## Data Collection

Void does not collect any data. There are no analytics, telemetry, error reporting, or tracking mechanisms of any kind. In fact, Void actively blocks Grok's own telemetry by default.

## Data Storage

All settings stay on your device. Nothing ever leaves it.

- **Plugin toggles, themes, custom CSS** — stored in IndexedDB (extension) or userscript-manager storage (`GM_setValue`).
- **AccountSwitcher snapshots** *(browser extension only)* — if you use this plugin, your Grok and xAI SSO session cookies (both `grok.com` and `accounts.x.ai`) are captured and stored locally so you can switch between accounts without logging out. Snapshots are encrypted at rest with AES-GCM-256 using a non-extractable HKDF key that is generated once per install and kept in IndexedDB. The key is never transmitted or derivable from the source code — it is random per installation. Encryption defends against other extensions, synced profile backups, and casual storage inspection. It does **not** defend against malicious code running on grok.com itself, which already has access to your live session.
- **Storage cleanup on switch** — when you switch accounts, AccountSwitcher clears per-account `localStorage` keys (feature-flag bucketing, cached user settings, mixpanel queues, etc.), wipes `sessionStorage`, and deletes the `mixpanelBrowserDb` IndexedDB so Grok's UI doesn't show the previous user's state. Global preferences (theme, language, sidebar layout, Void settings) are preserved.

Void is open source. Anyone can audit the storage and crypto code at [src/utils/crypto.ts](src/utils/crypto.ts) and [src/plugins/accountSwitcher.extension/](src/plugins/accountSwitcher.extension/).

## Network Requests

Void makes the following outbound network requests, none of which transmit user data:

- **Update check** — A read-only request to a static GitHub file (`package.json`) to compare version numbers.
- **Themes** — When you import a theme by URL, Void downloads the CSS file you provide. This is user-initiated and optional.
- **Grok APIs** — Some plugins interact with Grok's own APIs (e.g. exporting chat history, text-to-speech downloads). These go to `grok.com`, the service you are already signed into.
- **Profile avatars** — when you save an account in AccountSwitcher, Void fetches your own profile picture from Grok's CDN once and stores it locally as a data URL so it can be displayed after switching. No other images are fetched.

## Permissions (Browser Extension)

The extension requests the minimum permissions it needs:

- **`*://grok.com/*`** — so Void can inject its patches into Grok pages. No other site is ever touched.
- **`declarativeNetRequest`** — relaxes Grok's Content Security Policy at the network layer so plugins can fetch themes and inline styles. No request content is read or modified.
- **`cookies`** + **`*://x.ai/*`** + **`*://*.x.ai/*`** — used exclusively by the **AccountSwitcher** plugin to snapshot and restore the httpOnly session cookies that back each Grok account (Grok delegates sign-in to xAI SSO, so both `grok.com` and `accounts.x.ai` cookies must be swapped together). The SSO cookie is scoped to the parent `.x.ai` domain, which is why both apex and subdomains are covered. The background service worker enforces an allowlist and refuses cookie operations for any other URL. No code runs on xAI pages; this is cookies-only.

These cookie-related permissions exist only in the browser-extension build. The userscript build does not include AccountSwitcher and never touches cookies.

## Third Parties

Void does not share any data with third parties. There are no ads, affiliate links, or external services.

## Contact

For questions about this policy, open an issue on [GitHub](https://github.com/imjustprism/Void/issues) or reach out on [Discord](https://discord.gg/4Rx3qUCR5Y).
