# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Working line is `voidpp` only. Do not fast-forward `Void++`.

Before any push to `voidpp`:

1. Run `bun run build` so `userscript/VoidPP.user.js` is regenerated.
2. Commit the userscript with the matching source. Do not push source-only.
3. Install and update URLs are `userscript/VoidPP.user.js`.
4. Purge jsDelivr for the canonical file only:
   `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/VoidPP.user.js`

## Hop sunset

`userscript/Void.user.js` is a byte-identical hop, not a second product. Its header already sets `@updateURL` / `@downloadURL` to `VoidPP.user.js`, so Tampermonkey installs still polling the old path pick up the new URL on the next check.

Keep writing the hop through `VERSION_DATE` `20260911.10` inclusive. The bump after that must:

- stop writing `userscript/Void.user.js` and `dist/Void.user.js`
- stop asserting that path in `scripts/test-build.mjs`
- delete `userscript/Void.user.js` from the tree

Do not replace the hop with a header-only stub: Tampermonkey would install an empty script. `window.Void` stays a same-object alias until a later pass.

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
