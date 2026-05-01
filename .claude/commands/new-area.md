---
description: Add a new explorable area to the map.
argument-hint: <area name>
---

Add a new area called "$ARGUMENTS" to tamagochi-3d.

Steps (use superpowers:subagent-driven-development with `dino-dev`):
1. Create `src/game/world/areas/<PascalName>.tsx` with a `<Ground>`, `<Sky>`, and a `<Portal to="town">` exit.
2. Add an entry to `src/game/world/areas/registry.ts`.
3. Add a Town `<Portal>` pointing to the new area.
4. Write a Vitest test that the area is in the registry.
5. Manually open `bun run show` and walk the dino there.

Ask the kid: "What should be in $ARGUMENTS? 🌳 Trees? 🪨 Rocks? 🌸 Flowers?" — then add 2-3 props they pick.
