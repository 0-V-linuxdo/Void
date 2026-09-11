# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Working line is `voidpp` only. Do not fast-forward `Void++`.

Before any push to `voidpp`:

1. Run `bun run build` so `userscript/VoidPP.user.js` is regenerated.
2. Commit that userscript with the matching source. Do not push source-only.
3. Install and update URLs are `userscript/VoidPP.user.js`.
4. Purge jsDelivr for the canonical file only:
   `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/VoidPP.user.js`

Do not write `userscript/Void.user.js`. The hop is gone. Old Tampermonkey installs that already ate `[20260911.8]` or `[20260911.9]` follow `@updateURL` to `VoidPP.user.js`. Anyone still on a pre-hop `@updateURL` must reinstall from the canonical file.

## Runtime ids

Canonical:

- `window.VoidPP` (`window.Void` is the same object)
- IndexedDB `VoidPP` (copied from `Void` once, then the old database is deleted)
- Settings key `VoidPPSettings` (read `VoidSettings` once, then delete it)
- Cookie bridge `voidpp-cookies`
- Settings tab ids `voidpp_*_tab` and nav group `voidpp`

Do not rename:

- Firefox id `firefox@void.prism`
- CSS / dataset prefix `void-`
- AccountSwitcher crypto key `VoidCryptoRootHKDF`
- `@name Void++` / `@namespace https://github.com/0-V-linuxdo/VoidPP`
