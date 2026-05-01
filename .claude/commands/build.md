---
description: Build a feature end-to-end (plan → dev → qa → reviewer → PR).
argument-hint: <one-line feature description>
---

You are orchestrating a feature for tamagochi-3d. The feature: $ARGUMENTS

Process:
1. **Brainstorm** with the user (use superpowers:brainstorming) — keep it short, ≤ 3 questions, kid-friendly.
2. **Plan** (use superpowers:writing-plans) — save to `docs/superpowers/plans/`.
3. **Implement** (use superpowers:subagent-driven-development) — dispatch `dino-dev` in an isolated worktree.
4. **QA** — dispatch `dino-qa` against the dev branch (in parallel: `dino-reviewer`).
5. **Loop** if bugs/changes requested.
6. **Open PR** when green. Do NOT auto-merge — show the user the PR URL and the preview Vercel URL.
