# Void++

[English](README.md) · [中文](README.zh.md)

## Install

[![Install userscript](https://img.shields.io/badge/Install-userscript-00d26a?style=for-the-badge)](https://cdn.jsdelivr.net/gh/0-V-linuxdo/Void@voidpp/userscript/Void.user.js)

## Changes

### Added

#### Plugin

| Feature | Default | What it does |
| --- | --- | --- |
| Cleaner default-on | On | Upstream plugin; Void++ turns it on by default. Hides upgrade nags, the home banner, the composer SuperGrok chip, and locked models. |
| InputHistory | On | Recall previous chat prompts with Arrow Up and Arrow Down, like a shell. |
| NoGrokBot | On | Hide the top-right Grok Bot promo button. |
| NoSidebarIdentity | On | Hide username and/or email in the Grok sidebar (separate toggles). Avatar stays so the account menu still opens. |
| ChatStateFavicons | On | Tab favicon reflects chat state (streaming, done, ready, error) with five overlay styles. |
| NoShareLink | On | Hide Share Project (in a project) and Create share link (top-right of chats); separate toggles. |
| NoDictation | On | Hide the Dictation (voice input) button from the chat input bar. Optional toggle hides Dictation Refinement in Settings → Behavior. |
| UsageDisplay | On | Shows official weekly SuperGrok usage in the chat bar. Optional daily stats (`usageStats`, off by default): hover week first, then today; click opens per-day history. |
| Placeholder | Off | Replace the rotating chat input placeholder. |
| ThemedScrollbar | On | Project pane scrollbar follows Grok’s light and dark theme. |
| ComposerOpacity | On | Customizable chat input background opacity and blur. |
| RecentTopics | On | Switch recently opened chats with Ctrl+` (glass cards, project name, last Q&A preview). |
| CompactModeSelect | On | Keep the chat input model selector as an icon at every width. |
| UserQuotes | On | Keep quoted lines in your own bubbles marked with a visible left bar after markdown hides `>`. |

#### Settings UI

| Feature | Default | What it does |
| --- | --- | --- |
| Plugin pin | — | Pin plugin cards to the top of the current category. |
| Plugin favorites | — | Star a plugin to collect it in the Favorites tab (the default Plugins view). Categories: Favorites, All, Chat, UI, Privacy, Other. |

### Fixed

#### Plugin

| Feature | Default | What it does |
| --- | --- | --- |
| Cleaner | On | Hide inaccessible models in the model selector again. |

#### Settings UI

| Feature | Default | What it does |
| --- | --- | --- |
| Settings / icons | — | Void tabs in the Grok settings sidebar. Avatar-menu Void row uses a 16px V++ glyph; script `@icon` is the same mark on the app tile. The Plugins flyout shows each plugin’s icon. |
| Chat bar buttons | — | Restored after Grok removed `ButtonWithTooltipOptimized`. |

### Removed

#### Plugin

| Feature | Default | What it does |
| --- | --- | --- |
| RateLimitDisplay | — | Dropped after Grok credit rules changed; the old per-mode rate-limit readout no longer works. Weekly usage now lives in UsageDisplay. |
