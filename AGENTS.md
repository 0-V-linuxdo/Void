# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Before any push to `voidpp`:

1. Run `bun run build` so `userscript/VoidPP.user.js` is regenerated. This migration still writes hop `userscript/Void.user.js` (same bytes; `@updateURL` / `@downloadURL` already point at VoidPP.user.js) so Tampermonkey installs that still poll the old path pick up the hop.
2. Commit the userscript files with the matching source.
3. Do not push source-only. Install and update URLs are `userscript/VoidPP.user.js`.
4. Also fast-forward `Void++` (`git push origin HEAD:refs/heads/Void++`).
5. Purge jsDelivr:
   - `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/VoidPP.user.js`
   - `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/Void.user.js`

## Runtime ids

Canonical:

- `window.VoidPP` (`window.Void` is the same object)
- IndexedDB `VoidPP` (copied from `Void` once)
- Settings key `VoidPPSettings` (read `VoidSettings` once, then delete it)
- Cookie bridge `voidpp-cookies`
- Settings tab ids `voidpp_*_tab` and nav group `voidpp`

Do not rename:

- Firefox id `firefox@void.prism`
- CSS / dataset prefix `void-`
- AccountSwitcher crypto key `VoidCryptoRootHKDF`
