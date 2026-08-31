# Contributing to Void++

Void++ is a community fork of Void and we welcome contributions!

## Writing Plugins

The main way to contribute is by writing plugins.

Before starting, please:

- Check existing [pull requests](https://github.com/0-V-linuxdo/Void/pulls) to make sure someone isn't already working on the same thing
- Check [issues](https://github.com/0-V-linuxdo/Void/issues) for existing requests or rejected ideas

### Plugin Rules

- No raw DOM manipulation — use patches and React
- No plugins that just hide UI elements — use CSS for that
- No plugins that spam Grok's API

## Other Ways to Contribute

- Fix bugs, typos, or improve existing code
- Propose new features or plugin APIs

## Development Setup

Prerequisites: [Bun](https://bun.sh/) >= 1.0

```sh
git clone -b Void++ https://github.com/0-V-linuxdo/Void.git
cd Void
bun install
bun run build
```

## Code Style

We use [oxlint](https://oxc.rs/) for linting and [Stylelint](https://stylelint.io/) for CSS. All source files need the license header.

Before committing, make sure the following all pass:

```sh
bun run lint:fix
bun run lint:styles:fix
bun run tsc
bun run build
```

## Pull Requests

- Fork the repo and branch off `Void++`
- Make sure everything builds and lints cleanly
- Open a PR against `Void++`
