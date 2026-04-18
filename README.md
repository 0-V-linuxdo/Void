# Void

[![License](https://img.shields.io/github/license/imjustprism/Void?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/imjustprism/Void/lint.yml?branch=main&style=flat-square&label=ci)](https://github.com/imjustprism/Void/actions/workflows/lint.yml)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ojhnaooipkeakpjnpcjgbllfehmocjpk?style=flat-square&label=chrome)](https://chromewebstore.google.com/detail/void/ojhnaooipkeakpjnpcjgbllfehmocjpk)
[![Firefox Add-ons](https://img.shields.io/amo/v/void-cutest-grok-mod?style=flat-square&label=firefox)](https://addons.mozilla.org/en-US/firefox/addon/void-cutest-grok-mod/)
[![Greasy Fork](https://img.shields.io/greasyfork/v/567871?style=flat-square&label=greasy%20fork)](https://greasyfork.org/en/scripts/567871-void)
[![Contributing](https://img.shields.io/badge/contributing-guide-blue?style=flat-square)](CONTRIBUTING.md)

A client-side modification for [Grok](https://grok.com), inspired by [Vencord](https://github.com/Vendicated/Vencord). Patches Grok's bundled code at runtime with a plugin system, custom CSS editor, and theme support. No server-side changes, no telemetry. Works as a userscript or browser extension.

## Installation

### Browser Extension

- **Chrome / Edge / Opera / Brave** — [Chrome Web Store](https://chromewebstore.google.com/detail/void/ojhnaooipkeakpjnpcjgbllfehmocjpk).
- **Firefox** — [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/void-cutest-grok-mod/).

> [!NOTE]
> The Chrome Web Store build may lag behind the latest release. Chrome's manual review process is slow, so updates can take a while to publish. For the newest version, use the Firefox add-on, the userscript, or install from source.

### Userscript

Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/), then install from [Greasy Fork](https://greasyfork.org/en/scripts/567871-void).

> A few plugins (currently just **AccountSwitcher**) are extension-only because they need APIs userscript managers don't expose. They simply won't appear in the userscript build.

### Install from Source

Requires [Bun](https://bun.sh/) >= 1.0.

```sh
git clone https://github.com/imjustprism/Void.git
cd Void
bun install
bun run build
```

Then load `dist/chrome-unpacked` via `chrome://extensions` (Developer Mode → Load unpacked), or `dist/firefox-unpacked/manifest.json` via `about:debugging#/runtime/this-firefox` (Load Temporary Add-on), or install `userscript/Void.user.js` in your userscript manager.

## Support

Join our [Discord server](https://discord.gg/4Rx3qUCR5Y) to report bugs, request plugins, or get help.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Grok is a trademark of xAI Corp. and is mentioned here purely for descriptive purposes. This project is not affiliated with, endorsed by, or associated with xAI Corp. in any way.

<details>
<summary>Using Void violates Grok's Terms of Service</summary>

Client modifications like Void go against [xAI's Terms of Service](https://x.ai/legal/terms-of-service), which prohibit reverse engineering, modifying, or creating derivative works from the service.

There are currently no known cases of accounts being suspended for using client modifications on Grok. You should be fine as long as you stick to plugins that don't abuse or spam the platform. All built-in plugins are designed with this in mind.

That said, if losing access to your account would be a serious problem for you, consider not using any client modifications at all. This applies to Void and any similar tool.

</details>

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

[GPL-3.0-or-later](LICENSE)
