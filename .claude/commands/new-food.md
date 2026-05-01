---
description: Add a food item the dino can eat.
argument-hint: <food name, e.g. "pizza">
---

Add "$ARGUMENTS" as a food item.

Process via `dino-dev` in a worktree:
1. Add an entry to a `FOODS` map in `src/game/systems/interactions.ts`: name, hunger restored, happy bonus.
2. Add an icon (emoji ok for Phase 1) to the feed menu in `src/game/HUD/`.
3. Add a unit test that feeding raises hunger correctly.

Ask the kid: "How yummy is $ARGUMENTS? 🍔 (1=meh, 5=amazing)" — set hunger restored to that × 10.
