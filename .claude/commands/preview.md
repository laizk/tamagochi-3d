---
description: Push current branch and open the Vercel preview URL.
---

1. `git push -u origin HEAD` (current branch).
2. Find the open PR for this branch with `gh pr view --json url,number`.
3. Print the PR URL and the Vercel preview URL (Vercel posts a comment on the PR — `gh pr view --comments` to find it).
4. If no PR exists, ask the user: "Want to open a PR? 📬"
