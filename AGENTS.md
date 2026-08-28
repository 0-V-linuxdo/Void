# Void++

Follow `.rules`. Extra constraint for this fork:

## Push

Before any push to `Void++`:

1. Run `bun run build` so `userscript/Void.user.js` is regenerated from current source.
2. Commit `userscript/Void.user.js` with the matching source.
3. Do not push source-only. Tampermonkey installs from `userscript/Void.user.js`.
