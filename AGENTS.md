# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Before any push to `voidpp`:

1. Run `bun run build` so `userscript/VoidPP.user.js` and the compatibility copy `userscript/Void.user.js` are regenerated from current source. Extension packs write both `VoidPP.js` and `Void.js`.
2. Commit both userscript files with the matching source.
3. Do not push source-only. README install badge points at `userscript/VoidPP.user.js` for new installs. Tampermonkey `@updateURL` / `@downloadURL` stay on `userscript/Void.user.js` so existing installs keep updating.
4. Also fast-forward `Void++` (`git push origin HEAD:refs/heads/Void++`) so the plus-named alias stays current.
5. Purge jsDelivr:
   - `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/VoidPP.user.js`
   - `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/Void.user.js`
