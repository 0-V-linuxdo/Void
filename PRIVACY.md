# Privacy Policy

**Last updated:** April 7, 2026

## Overview

Void is a client-side modification for [Grok](https://grok.com). It runs entirely in your browser and does not collect, store, or transmit any personal data.

## Data Collection

Void does not collect any data. There are no analytics, telemetry, error reporting, or tracking mechanisms of any kind. In fact, Void actively blocks Grok's own telemetry by default.

## Data Storage

All user settings (plugin toggles, theme preferences, custom CSS) are stored locally in your browser using IndexedDB (extension) or userscript manager storage (Tampermonkey/Violentmonkey). This data never leaves your device.

## Network Requests

Void makes the following outbound network requests, none of which transmit user data:

- **Update check** — A read-only request to a static GitHub file (`package.json`) to compare version numbers.
- **Themes** — When you import a theme by URL, Void downloads the CSS file you provide. This is user-initiated and optional.
- **Grok APIs** — Some plugins interact with Grok's own APIs (e.g. exporting chat history, text-to-speech downloads). These go to `grok.com`, the service you are already signed into.

## Permissions

The browser extension only requests access to `grok.com`. It has no access to other websites, tabs, browsing history, cookies, or any data outside of Grok.

## Third Parties

Void does not share any data with third parties. There are no ads, affiliate links, or external services.

## Contact

For questions about this policy, open an issue on [GitHub](https://github.com/imjustprism/Void/issues) or reach out on [Discord](https://discord.gg/4Rx3qUCR5Y).
