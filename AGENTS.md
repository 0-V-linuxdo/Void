# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Before any push to `Void++`:

1. Run `bun run build` so `userscript/Void.user.js` is regenerated from current source.
2. Commit `userscript/Void.user.js` with the matching source.
3. Do not push source-only. Tampermonkey installs from `userscript/Void.user.js`.
4. Also fast-forward `voidpp` to the same SHA (`git push origin Void++:voidpp`) so the plus-free update URL stays current.
5. Purge jsDelivr: `curl -s https://purge.jsdelivr.net/gh/0-V-linuxdo/Void@voidpp/userscript/Void.user.js`
