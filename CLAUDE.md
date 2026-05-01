# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What is this project

A 3D Tamagotchi web game called **Dino Friend**. One character (a dino), 7 areas to roam, 5 needs (hunger, happiness, energy, cleanliness, health). Mobile-first. Built collaboratively by an adult and a 9-year-old, deployed on Vercel.

Spec: `docs/superpowers/specs/2026-05-01-tamagochi-3d-design.md`
Plan: `docs/superpowers/plans/2026-05-01-phase-1-skeleton.md`

## Talking to the user

The primary user may be a 9-year-old kid paired with a parent.

- **Short.** One-sentence questions when possible.
- **Multiple choice with emojis** when feasible: A 🌳 / B 🏖️ / C ⛰️.
- **Friendly, occasionally funny.** Dino/game-themed when natural. Never patronizing.
- **No unsolicited code explanations.** Just do the task. Explain only when asked.
- **Hard things:** explain like to a smart 9-year-old (analogies, no jargon).
- **Technical/admin questions** (deploy, billing, accounts, secrets, force-pushes): prefix with 🧑‍💻 to flag for the parent.

## Workflow rules

- **Always use git worktrees** for implementation tasks. Read-only research can run inline.
- **Always use the subagent team** when implementing a feature: `dino-dev` (build) → `dino-qa` (test) ∥ `dino-reviewer` (critique) → merge.
- **Never push directly to `main`.** Open a PR. Branch protection enforces this server-side; the local `.claude/settings.json` denylist enforces it client-side.

## Tech stack quick reference

- Framework: Next.js 16 App Router (Turbopack dev).
- 3D: react-three-fiber + drei + three.js. All R3F components are Client Components.
- State: Zustand store at `src/game/store.ts`. One source of truth.
- Persistence: localStorage at `tamagochi-3d:save:v1` (Phase 1). Supabase planned for Phase 2.
- Styling: Tailwind v4. Use utility classes; no CSS files outside `app/globals.css`.
- Lint/format: Biome 2.x. Run `bun run lint:fix` to auto-format.
- Tests: Vitest (`tests/unit/`), Playwright (`tests/e2e/`, mobile viewports).
- Package manager: Bun.

## Common commands

```bash
bun run dev           # http://localhost:3000
bun run show          # LAN-exposed, for testing on a real phone
bun run test          # unit
bun run test:e2e      # mobile-viewport e2e
bun run typecheck     # tsc --noEmit
bun run lint:fix      # auto-format + autofix
```

## Things to avoid

- Don't add features beyond the current plan task.
- Don't restructure folders unilaterally.
- Don't add a UI library beyond Tailwind/shadcn (shadcn arrives in Phase 1.5).
- Don't add another 3D engine, physics library, or state library.
