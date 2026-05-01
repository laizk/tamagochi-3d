---
description: Add a new dino skin (color or pattern variant).
argument-hint: <skin name, e.g. "rainbow" or "stripes">
---

Add a dino skin called "$ARGUMENTS".

Process via `dino-dev` in a worktree:
1. Add a `SkinId` literal to `src/game/store.ts`.
2. Add a color/material entry to `src/game/world/Dino.tsx`'s skin map.
3. Add a unit test that the skin id is registered.
4. Add a HUD button in the settings menu to switch skins.

If the kid wants something custom (e.g., "purple polka dots"), ask them: "Two colors? Which two? 🎨"
