# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Before any push to `Void++`:

1. Run `bun run build` so `userscript/Void.user.js` and the dual-path copy `userscript/VoidPP.user.js` are regenerated from current source. Extension packs write both `Void.js` and `VoidPP.js`.
2. Commit both userscript files with the matching source.
3. Do not push source-only. README install badge points at `userscript/VoidPP.user.js` for new installs. Tampermonkey `@updateURL` / `@downloadURL` stay on `userscript/Void.user.js` so existing installs keep updating.
4. Also fast-forward `voidpp` (`git push origin HEAD:refs/heads/voidpp`) so the plus-free update URL stays current.
5. Purge jsDelivr: `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/VoidPP@heads/voidpp/userscript/Void.user.js`
