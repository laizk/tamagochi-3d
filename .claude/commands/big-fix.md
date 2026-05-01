---
description: Run all checks, autofix lint, commit if anything was fixed.
---

Run the following in order, fail fast:
1. `bun run lint:fix`
2. `bun run typecheck`
3. `bun run test`

If lint:fix changed files, commit them: `git add -A && git commit -m "chore: autofix lint"`. If anything fails after autofix, report the failure to the user — do NOT attempt to fix it manually.
