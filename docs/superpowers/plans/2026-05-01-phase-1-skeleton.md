# Tamagochi-3D Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable 3D Tamagotchi web game on Vercel: 1 dino, 5 stats, 7 areas, 3 control modes, localStorage save, with a kid-collaborative agent workflow (dino-dev, dino-qa, dino-reviewer).

**Architecture:** Next.js 15 App Router serving an R3F (react-three-fiber) Canvas inside a React HUD. Single Zustand store, JSON-serializable, persisted to localStorage. Per-area React components mounted via a registry. Mobile-first, Vercel auto-deploy on push to `main`.

**Tech Stack:** Bun, Next.js 15 (App Router), TypeScript, react-three-fiber, drei, three.js, Zustand, Tailwind CSS, Biome, Vitest, Playwright, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-05-01-tamagochi-3d-design.md`

**Stages:** Each stage ends with a deployable increment.

- **Stage A — Bootstrap (Tasks 1-5):** Scaffolded repo loads "Hello dino" on Vercel.
- **Stage B — Claude config (Tasks 6-9):** Subagents and kid-friendly slash commands ready to use.
- **Stage C — State + persistence (Tasks 10-14):** Stats decay, save/load, offline drain — verified by tests, no UI yet.
- **Stage D — First scene (Tasks 15-19):** Stats HUD + placeholder dino + Home area visible.
- **Stage E — Controls (Tasks 20-23):** Three control modes selectable.
- **Stage F — World (Tasks 24-27):** Six remaining areas, portals, mini-map.
- **Stage G — Interactions (Tasks 28-31):** Feed, bath, sleep, pet — needs become satisfiable.
- **Stage H — Ship polish (Tasks 32-34):** Onboarding, mobile polish, e2e smoke.

---

## File Structure

```
tamagochi-3d/
├── app/
│   ├── layout.tsx               (Task 3)
│   ├── page.tsx                 (Task 3 → enriched in 15)
│   └── globals.css              (Task 3)
├── src/
│   ├── game/
│   │   ├── Game.tsx             (Task 15)
│   │   ├── HUD/
│   │   │   ├── StatsBar.tsx     (Task 16)
│   │   │   ├── AreaName.tsx     (Task 26)
│   │   │   ├── MiniMap.tsx      (Task 27)
│   │   │   └── SettingsMenu.tsx (Task 23)
│   │   ├── world/
│   │   │   ├── World.tsx        (Task 24)
│   │   │   ├── Dino.tsx         (Task 17)
│   │   │   ├── Portal.tsx       (Task 25)
│   │   │   ├── areas/
│   │   │   │   ├── registry.ts  (Task 24)
│   │   │   │   ├── Home.tsx     (Task 18)
│   │   │   │   ├── Town.tsx     (Task 26)
│   │   │   │   ├── Park.tsx     (Task 26)
│   │   │   │   ├── Beach.tsx    (Task 26)
│   │   │   │   ├── Forest.tsx   (Task 26)
│   │   │   │   ├── Cave.tsx     (Task 26)
│   │   │   │   └── SkyIsland.tsx (Task 26, locked)
│   │   │   └── props/
│   │   │       ├── Ground.tsx   (Task 18)
│   │   │       └── Sky.tsx      (Task 18)
│   │   ├── controls/
│   │   │   ├── TapControls.tsx  (Task 20)
│   │   │   ├── Joystick.tsx     (Task 21)
│   │   │   ├── AutoRoam.tsx     (Task 22)
│   │   │   └── index.tsx        (Task 23)
│   │   ├── systems/
│   │   │   ├── tick.ts          (Task 12)
│   │   │   └── interactions.ts  (Tasks 28-31)
│   │   ├── config/
│   │   │   └── decay.ts         (Task 11)
│   │   └── store.ts             (Task 10)
│   └── lib/
│       ├── persistence.ts       (Task 13)
│       └── time.ts              (Task 14)
├── public/
│   └── manifest.webmanifest     (Task 33)
├── tests/
│   ├── unit/
│   │   ├── store.test.ts        (Task 10)
│   │   ├── decay.test.ts        (Task 11)
│   │   ├── tick.test.ts         (Task 12)
│   │   ├── persistence.test.ts  (Task 13)
│   │   └── time.test.ts         (Task 14)
│   └── e2e/
│       └── smoke.spec.ts        (Task 34)
├── .github/workflows/ci.yml     (Task 5)
├── .claude/
│   ├── settings.json            (Task 6)
│   ├── agents/
│   │   ├── dino-dev.md          (Task 7)
│   │   ├── dino-qa.md           (Task 7)
│   │   └── dino-reviewer.md     (Task 7)
│   └── commands/                (Task 9)
├── CLAUDE.md                    (Task 8 — replaces stub)
├── biome.json                   (Task 2)
├── tsconfig.json                (Task 1)
├── next.config.ts               (Task 1)
├── package.json                 (Task 1)
├── playwright.config.ts         (Task 4)
├── vitest.config.ts             (Task 4)
└── tailwind.config.ts           (Task 3)
```

---

## Stage A — Bootstrap

### Task 1: Scaffold Next.js + TypeScript + Bun

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `bun.lockb`

- [ ] **Step 1: Initialize Next.js project (non-interactive)**

Run from repo root:

```bash
bunx create-next-app@latest . \
  --typescript --tailwind --app --eslint=false --src-dir=false \
  --import-alias "@/*" --turbopack --use-bun --yes
```

Expected: creates `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`. Adds Bun lockfile.

- [ ] **Step 2: Verify dev server runs**

```bash
bun run dev
```

Expected: starts on `http://localhost:3000`, default Next.js page renders. Stop with Ctrl-C.

- [ ] **Step 3: Add scripts package.json needs**

Edit `package.json` `scripts` block to:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "show": "next dev --turbopack --hostname 0.0.0.0"
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + TS + Tailwind + Bun"
```

---

### Task 2: Add Biome, replace ESLint

**Files:**
- Create: `biome.json`
- Modify: `package.json` (remove eslint deps if any), `.gitignore`
- Delete: `.eslintrc*` if present

- [ ] **Step 1: Install Biome**

```bash
bun add -D --exact @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "noNonNullAssertion": "off" },
      "suspicious": { "noExplicitAny": "warn" },
      "correctness": { "noUnusedVariables": "warn" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } },
  "files": {
    "ignore": [".next", "node_modules", "public", "playwright-report", "test-results"]
  }
}
```

- [ ] **Step 3: Remove ESLint artifacts if any**

```bash
rm -f .eslintrc.json .eslintrc.js .eslint.config.mjs
```

- [ ] **Step 4: Run `bun run lint` to verify**

```bash
bun run lint
```

Expected: PASS (no findings on scaffolded code, or only minor warnings).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: switch lint/format to Biome"
```

---

### Task 3: Install game runtime deps + base layout

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1: Install runtime deps**

```bash
bun add three @react-three/fiber @react-three/drei zustand
bun add -D @types/three
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dino Friend',
  description: 'A 3D dino pet you take care of.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#88c47a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 h-dvh w-dvw overflow-hidden bg-sky-200 text-slate-900 antialiased select-none touch-none">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx` with a "Hello dino" placeholder**

```tsx
export default function Page() {
  return (
    <main className="flex h-dvh w-dvw items-center justify-center">
      <h1 className="text-4xl font-bold">🦕 Dino Friend</h1>
    </main>
  );
}
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #cbe9ff;
  --foreground: #0f172a;
}

html, body { height: 100%; }
canvas { touch-action: none; }
```

- [ ] **Step 5: Run dev server, verify "🦕 Dino Friend" renders**

```bash
bun run dev
```

Open `http://localhost:3000`. Expected: large emoji + title centered. Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: base layout + hello dino"
```

---

### Task 4: Test infra (Vitest + Playwright)

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/.gitkeep`, `tests/e2e/.gitkeep`

- [ ] **Step 1: Install test deps**

```bash
bun add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
bun add -D @playwright/test
bunx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: [],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 3: Create `playwright.config.ts`** (mobile viewport by default)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'Pixel 7',   use: { ...devices['Pixel 7']   } },
  ],
  webServer: {
    command: 'bun run build && bun run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 4: Add a placeholder unit test** `tests/unit/sanity.test.ts`

```ts
import { describe, expect, it } from 'vitest';

describe('sanity', () => {
  it('truth holds', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run unit test**

```bash
bun run test
```

Expected: 1 passed.

- [ ] **Step 6: Add a placeholder e2e test** `tests/e2e/loads.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('home page loads with dino title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /dino friend/i })).toBeVisible();
});
```

- [ ] **Step 7: Run e2e**

```bash
bun run test:e2e
```

Expected: 2 passed (iPhone 13 + Pixel 7).

- [ ] **Step 8: Update `.gitignore`**

Append:

```
playwright-report/
test-results/
coverage/
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: vitest + playwright (mobile viewports)"
```

---

### Task 5: GitHub Actions CI + initial Vercel deploy

**Files:**
- Create: `.github/workflows/ci.yml`, `README.md`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
```

- [ ] **Step 2: Minimal `README.md`**

```md
# 🦕 Dino Friend

A 3D Tamagotchi web game.

## Dev
```bash
bun install
bun run dev          # http://localhost:3000
bun run show         # exposes on LAN for phone testing
bun run test         # unit
bun run test:e2e     # mobile-viewport smoke
```

## Stack
Next.js 15 · react-three-fiber · Zustand · Tailwind · Biome · Vitest · Playwright · Vercel.
```

- [ ] **Step 3: Commit + push to GitHub**

```bash
git add -A
git commit -m "ci: github actions (typecheck, lint, vitest, playwright)"
gh repo create tamagochi-3d --public --source=. --remote=origin --push
```

🧑‍💻 **(parent action — one-time):** Open `https://vercel.com/new`, import the `tamagochi-3d` repo. Vercel auto-detects Next.js. Click Deploy. Confirm the deploy succeeds and the production URL renders "🦕 Dino Friend".

- [ ] **Step 4: Verify CI is green on GitHub**

```bash
gh run list --limit 1
```

Expected: latest run on `main` is `completed success` for both `check` and `e2e`.

🎯 **Stage A done. Live URL exists. Push-to-deploy works.**

---

## Stage B — Claude Config

### Task 6: `.claude/settings.json`

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Write file**

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(bun:*)",
      "Bash(bunx:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(git status)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push)",
      "Bash(git push origin:*)",
      "Bash(git checkout:*)",
      "Bash(git switch:*)",
      "Bash(git branch:*)",
      "Bash(git fetch:*)",
      "Bash(git pull)",
      "Bash(git pull --rebase)",
      "Bash(gh pr:*)",
      "Bash(gh repo view:*)",
      "Bash(gh run:*)",
      "Bash(vercel:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(rg:*)",
      "Bash(find:*)",
      "Read",
      "Write",
      "Edit",
      "Grep",
      "Glob",
      "WebFetch",
      "WebSearch"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git reset --hard:*)",
      "Bash(git checkout main)",
      "Bash(git switch main)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bun run typecheck --silent || true" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/settings.json
git commit -m "chore(claude): permissions + post-edit typecheck hook"
```

---

### Task 7: Subagent definitions

**Files:**
- Create: `.claude/agents/dino-dev.md`, `.claude/agents/dino-qa.md`, `.claude/agents/dino-reviewer.md`

- [ ] **Step 1: Create `dino-dev.md`**

```md
---
name: dino-dev
description: Implements features for tamagochi-3d following a provided plan. Use when executing implementation plans on a feature branch in an isolated worktree.
model: sonnet
tools: Bash, Read, Write, Edit, Grep, Glob
---

You are the developer for tamagochi-3d, a 3D Tamagotchi web game (Next.js 15 App Router + react-three-fiber + Zustand + Tailwind, deployed on Vercel).

## Constraints
- **Mobile-first.** Validate at viewports ≤ 414px. Use `touch-action: none` on the canvas. Never use hover-only UI.
- **Performance.** Lazy-load GLBs per area with `<Suspense>`. Use `useMemo` for geometries/materials. Prefer instanced meshes for repeated props. Keep per-area triangle counts low (< 5k Phase 1).
- **TDD.** When the plan specifies a test step, write the failing test first, see it fail, then implement.
- **Small commits.** Conventional Commits format. One logical change per commit.
- **Run `bun run typecheck` and `bun run test`** before claiming a task done.
- **Branch.** You operate on a `feat/<slug>` branch in an isolated git worktree. Never touch `main`.
- **Ask, don't guess.** If a task description is ambiguous, return to the orchestrator with the question.

## Code style
- TypeScript strict. No `any`.
- Single Zustand store; one selector per consumer (no big object subscriptions).
- Functional React components only. Server Components where possible; Client Components for anything inside the Canvas, anything using state, or anything using `window`/`document`.
- Tailwind utility classes; no styled-components.

## Definition of done for a task
- All listed steps checked.
- `bun run typecheck` green.
- `bun run lint` green.
- `bun run test` green.
- Commits pushed to the feature branch.
```

- [ ] **Step 2: Create `dino-qa.md`**

```md
---
name: dino-qa
description: Validates a feature branch by running unit tests, e2e tests, and a manual mobile-viewport sanity check. Use after dino-dev completes a task.
model: sonnet
tools: Bash, Read, Grep, Glob
---

You are QA for tamagochi-3d. You receive a feature branch and a feature description. You verify the feature works end-to-end on mobile viewports.

## Process
1. `bun install --frozen-lockfile` (if dependencies changed).
2. `bun run typecheck` — must be green.
3. `bun run lint` — must be green.
4. `bun run test` — all unit tests pass.
5. `bun run build` — must succeed (catches Next.js build-time errors).
6. `bun run test:e2e` — mobile viewports must pass.
7. If the feature has new interactive behavior not covered by an e2e test, write one in `tests/e2e/` before signing off.
8. Test the golden path AND at least one edge case per feature (e.g., "what if dino is already full when player feeds?").

## Output
Return a structured report:
- **Status:** PASS | FAIL
- **Tests run:** counts per suite.
- **Bugs found:** numbered list, each with reproduction steps and severity (blocker/major/minor).
- **Coverage gaps:** features visible in the diff that have no test.

If FAIL: do NOT attempt fixes. Return to orchestrator.
```

- [ ] **Step 3: Create `dino-reviewer.md`**

```md
---
name: dino-reviewer
description: Reviews a feature branch diff for code quality, performance, accessibility, and kid-readability. Read-only. Use after dino-dev completes a task. Can run in parallel with dino-qa.
model: opus
tools: Bash, Read, Grep, Glob
---

You are a senior code reviewer for tamagochi-3d. You read the diff and produce severity-ranked feedback.

## What to check
1. **Correctness.** Does the code do what the task said? Logic errors, off-by-ones, wrong types.
2. **Performance (mobile).** Re-renders that could be memoized? Inline objects creating new refs each frame? Non-instanced repeated meshes? Sync-loaded large assets?
3. **State discipline.** Zustand selectors narrow? No prop drilling we could avoid? No state duplicated between store and component state?
4. **Kid-readability.** Names a 9-year-old could understand? Files focused on one thing? Avoid clever tricks; prefer obvious code. If a kid will be editing this file later, would they get lost?
5. **Tests.** Do unit tests exercise behavior, not implementation details? Are there tests for the offline drain / migration / decay edge cases?
6. **Accessibility.** Touch targets ≥ 44px, contrast OK, semantic HTML for HUD?
7. **Scope creep.** Anything in the diff that isn't required by the task? Flag it.

## Output
- **Severity-ranked findings.** Use blocker / major / minor / nit.
- For each finding: **file:line — what's wrong — suggested fix.**
- **Overall:** approve | request-changes.

You do not write code. You produce review notes only.
```

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/
git commit -m "chore(claude): dino-dev, dino-qa, dino-reviewer subagents"
```

---

### Task 8: Replace stub CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (currently has a 1-line stub)

- [ ] **Step 1: Replace contents**

```md
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

- Framework: Next.js 15 App Router (Turbopack dev).
- 3D: react-three-fiber + drei + three.js. All R3F components are Client Components.
- State: Zustand store at `src/game/store.ts`. One source of truth.
- Persistence: localStorage at `tamagochi-3d:save:v1` (Phase 1). Supabase planned for Phase 2.
- Styling: Tailwind. Use utility classes; no CSS files outside `app/globals.css`.
- Lint/format: Biome. Run `bun run lint:fix` to auto-format.
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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): full project guide"
```

---

### Task 9: Kid-friendly slash commands

**Files:**
- Create: `.claude/commands/build.md`, `.claude/commands/show.md`, `.claude/commands/new-area.md`, `.claude/commands/new-skin.md`, `.claude/commands/new-food.md`, `.claude/commands/explain.md`, `.claude/commands/big-fix.md`, `.claude/commands/preview.md`

- [ ] **Step 1: `build.md`**

```md
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
```

- [ ] **Step 2: `show.md`**

```md
---
description: Start the dev server and show a phone-friendly URL + QR code.
---

Run `bun run show` in the background. Then print:
- The local URL (http://localhost:3000)
- The LAN URL (e.g., http://192.168.x.x:3000) for phone testing — derive from `ifconfig | grep "inet " | grep -v 127.0.0.1`.
- A QR code for the LAN URL using `bunx qrcode-terminal <url>`.

Tell the kid: "Open this on your phone! 📱"
```

- [ ] **Step 3: `new-area.md`**

```md
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
```

- [ ] **Step 4: `new-skin.md`**

```md
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
```

- [ ] **Step 5: `new-food.md`**

```md
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
```

- [ ] **Step 6: `explain.md`**

```md
---
description: Explain a piece of code or concept to a 9-year-old.
argument-hint: <thing to explain>
---

Explain "$ARGUMENTS" in plain language a smart 9-year-old can understand.

Rules:
- ≤ 5 sentences.
- Use an analogy from games, animals, or food.
- One concrete example if it's a piece of code.
- No jargon. If you must use a real term (like "function" or "state"), define it once in plain words.
```

- [ ] **Step 7: `big-fix.md`**

```md
---
description: Run all checks, autofix lint, commit if anything was fixed.
---

Run the following in order, fail fast:
1. `bun run lint:fix`
2. `bun run typecheck`
3. `bun run test`

If lint:fix changed files, commit them: `git add -A && git commit -m "chore: autofix lint"`. If anything fails after autofix, report the failure to the user — do NOT attempt to fix it manually.
```

- [ ] **Step 8: `preview.md`**

```md
---
description: Push current branch and open the Vercel preview URL.
---

1. `git push -u origin HEAD` (current branch).
2. Find the open PR for this branch with `gh pr view --json url,number`.
3. Print the PR URL and the Vercel preview URL (Vercel posts a comment on the PR — `gh pr view --comments` to find it).
4. If no PR exists, ask the user: "Want to open a PR? 📬"
```

- [ ] **Step 9: Commit**

```bash
git add .claude/commands/
git commit -m "chore(claude): kid-friendly slash commands"
```

🎯 **Stage B done. Subagents and slash commands ready.**

---

## Stage C — State + Persistence (TDD)

### Task 10: Zustand store + dino types

**Files:**
- Create: `src/game/store.ts`, `tests/unit/store.test.ts`

- [ ] **Step 1: Write the failing test** `tests/unit/store.test.ts`

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useGame, INITIAL_DINO } from '@/src/game/store';

describe('game store', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('starts as an egg with 100 in every stat', () => {
    const { dino } = useGame.getState();
    expect(dino.stage).toBe('egg');
    expect(dino.stats.hunger).toBe(100);
    expect(dino.stats.happy).toBe(100);
    expect(dino.stats.energy).toBe(100);
    expect(dino.stats.clean).toBe(100);
    expect(dino.stats.health).toBe(100);
  });

  it('starts at home', () => {
    expect(useGame.getState().currentArea).toBe('home');
  });

  it('updates a stat by delta and clamps 0..100', () => {
    useGame.getState().applyStatDelta('hunger', -150);
    expect(useGame.getState().dino.stats.hunger).toBe(0);
    useGame.getState().applyStatDelta('hunger', 9999);
    expect(useGame.getState().dino.stats.hunger).toBe(100);
  });

  it('exposes a stable INITIAL_DINO factory', () => {
    const a = INITIAL_DINO();
    const b = INITIAL_DINO();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);  // different objects (no shared mutation)
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
bun run test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/store.ts`**

```ts
import { create } from 'zustand';

export type StatKey = 'hunger' | 'happy' | 'energy' | 'clean' | 'health';
export type Stat = number; // 0..100
export type AreaId = 'home' | 'town' | 'park' | 'beach' | 'forest' | 'cave' | 'sky';
export type ControlMode = 'tap' | 'joystick' | 'auto';
export type ThemeId = 'default';
export type SkinId = 'default';

export type Dino = {
  id: string;
  name: string;
  species: 'dino';
  skinId: SkinId;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number; // seconds
  stats: Record<StatKey, Stat>;
  position: [number, number, number];
};

export type GameState = {
  dino: Dino;
  currentArea: AreaId;
  controlMode: ControlMode;
  lastSeenAt: number;
  settings: { soundOn: boolean; theme: ThemeId };
  version: 1;
};

export type GameActions = {
  applyStatDelta: (k: StatKey, delta: number) => void;
  setStat: (k: StatKey, value: Stat) => void;
  setArea: (a: AreaId) => void;
  setControlMode: (m: ControlMode) => void;
  setPosition: (p: [number, number, number]) => void;
  ageBy: (seconds: number) => void;
  hydrate: (s: GameState) => void;
  touchSeenAt: () => void;
};

export const INITIAL_DINO = (): Dino => ({
  id: 'dino-1',
  name: 'Dino',
  species: 'dino',
  skinId: 'default',
  stage: 'egg',
  age: 0,
  stats: { hunger: 100, happy: 100, energy: 100, clean: 100, health: 100 },
  position: [0, 0, 0],
});

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const initialState: GameState = {
  dino: INITIAL_DINO(),
  currentArea: 'home',
  controlMode: 'tap',
  lastSeenAt: Date.now(),
  settings: { soundOn: true, theme: 'default' },
  version: 1,
};

export const useGame = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  applyStatDelta: (k, delta) =>
    set((s) => ({
      dino: { ...s.dino, stats: { ...s.dino.stats, [k]: clamp(s.dino.stats[k] + delta) } },
    })),
  setStat: (k, value) =>
    set((s) => ({
      dino: { ...s.dino, stats: { ...s.dino.stats, [k]: clamp(value) } },
    })),
  setArea: (a) => set({ currentArea: a }),
  setControlMode: (m) => set({ controlMode: m }),
  setPosition: (p) => set((s) => ({ dino: { ...s.dino, position: p } })),
  ageBy: (seconds) => set((s) => ({ dino: { ...s.dino, age: s.dino.age + seconds } })),
  hydrate: (next) => set(next),
  touchSeenAt: () => set({ lastSeenAt: Date.now() }),
}));

useGame.getInitialState = () => ({ ...initialState, dino: INITIAL_DINO() });
```

- [ ] **Step 4: Run tests, expect pass**

```bash
bun run test
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): zustand store with stats, clamping, hydrate"
```

---

### Task 11: Decay config

**Files:**
- Create: `src/game/config/decay.ts`, `tests/unit/decay.test.ts`

- [ ] **Step 1: Write failing test** `tests/unit/decay.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { DECAY_PER_MINUTE, OFFLINE_MULTIPLIER, computeDecay } from '@/src/game/config/decay';

describe('decay config', () => {
  it('exports per-minute rates for all actionable stats', () => {
    expect(DECAY_PER_MINUTE.hunger).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.happy).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.energy).toBeGreaterThan(0);
    expect(DECAY_PER_MINUTE.clean).toBeGreaterThan(0);
  });

  it('offline multiplier slows drain ≥ 5x', () => {
    expect(OFFLINE_MULTIPLIER).toBeLessThanOrEqual(0.2);
  });

  it('computeDecay returns negative deltas proportional to elapsed minutes', () => {
    const d = computeDecay(60, 1.0); // 60 sec live
    expect(d.hunger).toBeCloseTo(-DECAY_PER_MINUTE.hunger, 5);
  });

  it('computeDecay scales by multiplier', () => {
    const live = computeDecay(60, 1.0);
    const offline = computeDecay(60, OFFLINE_MULTIPLIER);
    expect(Math.abs(offline.hunger)).toBeLessThan(Math.abs(live.hunger));
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
bun run test tests/unit/decay.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/config/decay.ts`**

```ts
import type { StatKey } from '@/src/game/store';

export const DECAY_PER_MINUTE: Record<Exclude<StatKey, 'health'>, number> = {
  hunger: 5,
  happy: 3,
  energy: 4,
  clean: 2,
};

export const OFFLINE_MULTIPLIER = 0.1;

export type StatDelta = Partial<Record<StatKey, number>>;

export function computeDecay(elapsedSeconds: number, multiplier: number): StatDelta {
  const minutes = elapsedSeconds / 60;
  const delta: StatDelta = {};
  for (const k of Object.keys(DECAY_PER_MINUTE) as Array<keyof typeof DECAY_PER_MINUTE>) {
    delta[k] = -DECAY_PER_MINUTE[k] * minutes * multiplier;
  }
  return delta;
}

export function computeHealth(stats: Record<StatKey, number>): number {
  // Health is the average of the others, with a penalty if any is critical (<20).
  const others = ['hunger', 'happy', 'energy', 'clean'] as const;
  const avg = others.reduce((s, k) => s + stats[k], 0) / others.length;
  const critical = others.some((k) => stats[k] < 20);
  return Math.max(0, Math.min(100, avg - (critical ? 15 : 0)));
}
```

- [ ] **Step 4: Run, expect pass**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(decay): per-minute decay + offline multiplier + health derivation"
```

---

### Task 12: Tick system

**Files:**
- Create: `src/game/systems/tick.ts`, `tests/unit/tick.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useGame } from '@/src/game/store';
import { tick } from '@/src/game/systems/tick';

describe('tick', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('reduces stats by per-second decay over a 60s tick', () => {
    tick(60);
    const { hunger, happy, energy, clean } = useGame.getState().dino.stats;
    expect(hunger).toBeLessThan(100);
    expect(happy).toBeLessThan(100);
    expect(energy).toBeLessThan(100);
    expect(clean).toBeLessThan(100);
  });

  it('ages dino by elapsed seconds', () => {
    tick(10);
    expect(useGame.getState().dino.age).toBe(10);
  });

  it('recomputes health after decay', () => {
    useGame.getState().setStat('hunger', 5);
    tick(0);
    expect(useGame.getState().dino.stats.health).toBeLessThan(100);
  });

  it('clamps stats at 0', () => {
    useGame.getState().setStat('hunger', 1);
    tick(60 * 60);  // an hour
    expect(useGame.getState().dino.stats.hunger).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
bun run test tests/unit/tick.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/game/systems/tick.ts`**

```ts
import { useGame, type StatKey } from '@/src/game/store';
import { computeDecay, computeHealth } from '@/src/game/config/decay';

const ACTIONABLE: Array<Exclude<StatKey, 'health'>> = ['hunger', 'happy', 'energy', 'clean'];

export function tick(elapsedSeconds: number, multiplier = 1): void {
  if (elapsedSeconds < 0) return;
  const delta = computeDecay(elapsedSeconds, multiplier);
  const state = useGame.getState();
  for (const k of ACTIONABLE) {
    if (delta[k] !== undefined) state.applyStatDelta(k, delta[k]!);
  }
  const stats = useGame.getState().dino.stats;
  state.setStat('health', computeHealth(stats));
  if (elapsedSeconds > 0) state.ageBy(elapsedSeconds);
}
```

- [ ] **Step 4: Run, expect pass**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(tick): foreground decay tick with health derivation"
```

---

### Task 13: Persistence (localStorage)

**Files:**
- Create: `src/lib/persistence.ts`, `tests/unit/persistence.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { save, load, SAVE_KEY } from '@/src/lib/persistence';
import { useGame } from '@/src/game/store';

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.setState(useGame.getInitialState(), true);
  });

  it('save writes a versioned blob to localStorage under SAVE_KEY', () => {
    save();
    const raw = localStorage.getItem(SAVE_KEY);
    expect(raw).not.toBeNull();
    const blob = JSON.parse(raw!);
    expect(blob.version).toBe(1);
    expect(blob.dino.stats.hunger).toBe(100);
    expect(typeof blob.lastSeenAt).toBe('number');
  });

  it('load returns null when no save exists', () => {
    expect(load()).toBeNull();
  });

  it('load returns the persisted state when present', () => {
    useGame.getState().setStat('hunger', 42);
    save();
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.dino.stats.hunger).toBe(42);
  });

  it('load backs up corrupt save and returns null', () => {
    localStorage.setItem(SAVE_KEY, 'not-json{');
    const result = load();
    expect(result).toBeNull();
    const corruptKeys = Object.keys(localStorage).filter((k) => k.startsWith(`${SAVE_KEY}:corrupt:`));
    expect(corruptKeys.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
bun run test tests/unit/persistence.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/persistence.ts`**

```ts
import { useGame, type GameState } from '@/src/game/store';

export const SAVE_KEY = 'tamagochi-3d:save:v1';

type SaveBlob = GameState;

export function save(): void {
  if (typeof localStorage === 'undefined') return;
  const state = useGame.getState();
  const blob: SaveBlob = {
    dino: state.dino,
    currentArea: state.currentArea,
    controlMode: state.controlMode,
    lastSeenAt: Date.now(),
    settings: state.settings,
    version: 1,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
}

export function load(): GameState | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SaveBlob;
    return migrate(parsed);
  } catch {
    localStorage.setItem(`${SAVE_KEY}:corrupt:${Date.now()}`, raw);
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

function migrate(blob: unknown): GameState | null {
  if (typeof blob !== 'object' || blob === null) return null;
  const b = blob as Partial<GameState>;
  if (b.version === 1) return b as GameState;
  // Future versions handled here.
  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave(debounceMs = 2000): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, debounceMs);
}
```

- [ ] **Step 4: Run, expect pass**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(persistence): localStorage save/load + corrupt-save backup"
```

---

### Task 14: Offline drain on app open

**Files:**
- Create: `src/lib/time.ts`, `tests/unit/time.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useGame } from '@/src/game/store';
import { applyOfflineDrain } from '@/src/lib/time';
import { OFFLINE_MULTIPLIER, DECAY_PER_MINUTE } from '@/src/game/config/decay';

describe('applyOfflineDrain', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('drains hunger proportionally for elapsed minutes × OFFLINE_MULTIPLIER', () => {
    const lastSeen = Date.now() - 60_000; // 1 minute ago
    applyOfflineDrain(lastSeen);
    const expectedDrop = DECAY_PER_MINUTE.hunger * 1 * OFFLINE_MULTIPLIER;
    expect(useGame.getState().dino.stats.hunger).toBeCloseTo(100 - expectedDrop, 4);
  });

  it('caps elapsed at 7 days to prevent insane drains', () => {
    const lastSeen = Date.now() - 30 * 24 * 60 * 60_000; // 30 days
    applyOfflineDrain(lastSeen);
    // 7 days × 5 hunger/min × 0.1 = 7 × 24 × 60 × 5 × 0.1 = 5040 → clamped to 0
    expect(useGame.getState().dino.stats.hunger).toBe(0);
  });

  it('returns the human-readable summary of biggest drop', () => {
    const lastSeen = Date.now() - 10 * 60_000; // 10 min
    const summary = applyOfflineDrain(lastSeen);
    expect(summary).toMatchObject({ biggestDrop: expect.any(String) });
  });

  it('no-ops when lastSeen is in the future', () => {
    applyOfflineDrain(Date.now() + 10_000);
    expect(useGame.getState().dino.stats.hunger).toBe(100);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
bun run test tests/unit/time.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/time.ts`**

```ts
import { tick } from '@/src/game/systems/tick';
import { useGame, type StatKey } from '@/src/game/store';
import { OFFLINE_MULTIPLIER } from '@/src/game/config/decay';

const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60;

const STAT_LABEL: Record<Exclude<StatKey, 'health'>, string> = {
  hunger: 'hungry',
  happy: 'sad',
  energy: 'sleepy',
  clean: 'stinky',
};

export type OfflineSummary = { elapsedSeconds: number; biggestDrop: string };

export function applyOfflineDrain(lastSeenAt: number): OfflineSummary {
  const before = { ...useGame.getState().dino.stats };
  const elapsedMs = Math.max(0, Date.now() - lastSeenAt);
  const elapsedSeconds = Math.min(MAX_OFFLINE_SECONDS, elapsedMs / 1000);
  if (elapsedSeconds === 0) {
    return { elapsedSeconds: 0, biggestDrop: 'okay' };
  }
  tick(elapsedSeconds, OFFLINE_MULTIPLIER);
  const after = useGame.getState().dino.stats;
  let biggestKey: keyof typeof STAT_LABEL = 'hunger';
  let biggestDelta = 0;
  for (const k of Object.keys(STAT_LABEL) as Array<keyof typeof STAT_LABEL>) {
    const drop = before[k] - after[k];
    if (drop > biggestDelta) {
      biggestDelta = drop;
      biggestKey = k;
    }
  }
  return {
    elapsedSeconds,
    biggestDrop: biggestDelta > 5 ? STAT_LABEL[biggestKey] : 'okay',
  };
}
```

- [ ] **Step 4: Run, expect pass**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(time): offline drain capped at 7d with summary"
```

🎯 **Stage C done. Game logic verified by tests. Still no UI connected.**

---

## Stage D — First Scene

### Task 15: Game root component (Canvas + HUD shell)

**Files:**
- Create: `src/game/Game.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write `src/game/Game.tsx`**

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { useGame } from '@/src/game/store';
import { load, scheduleSave } from '@/src/lib/persistence';
import { applyOfflineDrain } from '@/src/lib/time';
import { tick } from '@/src/game/systems/tick';
import { World } from '@/src/game/world/World';
import { StatsBar } from '@/src/game/HUD/StatsBar';

export function Game() {
  useEffect(() => {
    const loaded = load();
    if (loaded) {
      useGame.getState().hydrate(loaded);
      applyOfflineDrain(loaded.lastSeenAt);
    }
    useGame.getState().touchSeenAt();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      tick(1);
      scheduleSave();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') scheduleSave(0);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  return (
    <div className="relative h-dvh w-dvw">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
      <StatsBar />
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { Game } from '@/src/game/Game';

export default function Page() {
  return <Game />;
}
```

(Note: `<Game />` is a Client Component because of the `'use client'` directive in `Game.tsx`. `page.tsx` itself stays a Server Component.)

- [ ] **Step 3: Stub the imports** — create empty placeholders so this compiles, to be filled by Tasks 16-18:

`src/game/world/World.tsx`:

```tsx
'use client';
export function World() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
    </>
  );
}
```

`src/game/HUD/StatsBar.tsx`:

```tsx
'use client';
export function StatsBar() {
  return null;
}
```

- [ ] **Step 4: `bun run dev` and confirm no errors**

Open `http://localhost:3000`. Expected: empty sky-blue canvas, no errors in console.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: game root mounts canvas, hydrates save, runs tick"
```

---

### Task 16: Stats HUD

**Files:**
- Modify: `src/game/HUD/StatsBar.tsx`

- [ ] **Step 1: Implement `src/game/HUD/StatsBar.tsx`**

```tsx
'use client';

import { useGame, type StatKey } from '@/src/game/store';

const STATS: Array<{ key: StatKey; emoji: string; color: string }> = [
  { key: 'hunger', emoji: '🍔', color: 'bg-orange-400' },
  { key: 'happy',  emoji: '😊', color: 'bg-yellow-400' },
  { key: 'energy', emoji: '⚡', color: 'bg-blue-400' },
  { key: 'clean',  emoji: '🛁', color: 'bg-cyan-400' },
  { key: 'health', emoji: '❤️',  color: 'bg-rose-400' },
];

export function StatsBar() {
  const stats = useGame((s) => s.dino.stats);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
      <div className="pointer-events-auto flex gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-lg backdrop-blur">
        {STATS.map(({ key, emoji, color }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <span aria-hidden className="text-xl">{emoji}</span>
            <div className="h-2 w-12 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full ${color} transition-[width] duration-500`}
                style={{ width: `${stats[key]}%` }}
                aria-label={`${key} ${Math.round(stats[key])} percent`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Run `bun run dev`. Expected: 5 stat bars float at top of screen, all full.

- [ ] **Step 3: Sanity test by waiting**

Leave dev server running ~60s. Bars should slowly tick down (visible after ~1 minute).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(hud): stats bar (5 needs with emojis)"
```

---

### Task 17: Placeholder Dino component

**Files:**
- Create: `src/game/world/Dino.tsx`

- [ ] **Step 1: Implement (placeholder cube/sphere — real GLB later)**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGame } from '@/src/game/store';

export function Dino() {
  const ref = useRef<Mesh>(null);
  const position = useGame((s) => s.dino.position);
  const stats = useGame((s) => s.dino.stats);

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Idle bob
    const bob = Math.sin(performance.now() / 400) * 0.05;
    ref.current.position.set(position[0], position[1] + 0.5 + bob, position[2]);
    // Sad lean if any need is critical
    const sad = Math.min(stats.hunger, stats.happy, stats.energy, stats.clean) < 25;
    ref.current.rotation.x = sad ? 0.2 : 0;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial color={'#6dbf6d'} roughness={0.6} />
    </mesh>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(dino): placeholder green sphere with idle bob + sad lean"
```

---

### Task 18: Home area + ground/sky props

**Files:**
- Create: `src/game/world/props/Ground.tsx`, `src/game/world/props/Sky.tsx`, `src/game/world/areas/Home.tsx`
- Modify: `src/game/world/World.tsx`

- [ ] **Step 1: `src/game/world/props/Ground.tsx`**

```tsx
'use client';

type Props = { color?: string; size?: number };

export function Ground({ color = '#88c47a', size = 30 }: Props) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

- [ ] **Step 2: `src/game/world/props/Sky.tsx`**

```tsx
'use client';
import { Sky as DreiSky } from '@react-three/drei';

export function Sky() {
  return <DreiSky sunPosition={[8, 4, 5]} turbidity={6} rayleigh={2} />;
}
```

- [ ] **Step 3: `src/game/world/areas/Home.tsx`**

```tsx
'use client';
import { Sky } from '@/src/game/world/props/Sky';
import { Ground } from '@/src/game/world/props/Ground';
import { Dino } from '@/src/game/world/Dino';

export function Home() {
  return (
    <>
      <Sky />
      <Ground color="#a98e6a" />
      {/* Simple "house" — a box */}
      <mesh position={[0, 1, -3]} castShadow>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#d97a5e" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.5, -3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color="#7e3f2c" />
      </mesh>
      <Dino />
    </>
  );
}
```

- [ ] **Step 4: Update `src/game/world/World.tsx`**

```tsx
'use client';
import { OrbitControls } from '@react-three/drei';
import { Home } from '@/src/game/world/areas/Home';

export function World() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={1.2} />
      <Home />
      <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={4} maxDistance={14} />
    </>
  );
}
```

- [ ] **Step 5: `bun run dev`, confirm scene**

Expected: green sphere ("dino"), brown ground, red house, drag-rotate camera works on desktop and touch.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(world): home area with ground, sky, house, dino"
```

---

### Task 19: First-load welcome message

**Files:**
- Create: `src/game/HUD/Welcome.tsx`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: `src/game/HUD/Welcome.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

type Props = { message: string | null };

export function Welcome({ message }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (message) {
      setOpen(true);
      const t = setTimeout(() => setOpen(false), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);
  if (!open || !message) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
      <div className="rounded-2xl bg-white/90 px-5 py-3 text-center shadow-xl backdrop-blur">
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/game/Game.tsx`** — add a state for the welcome message and show it after offline drain:

Replace the first `useEffect` with:

```tsx
const [welcome, setWelcome] = useState<string | null>(null);
useEffect(() => {
  const loaded = load();
  if (loaded) {
    useGame.getState().hydrate(loaded);
    const summary = applyOfflineDrain(loaded.lastSeenAt);
    if (summary.biggestDrop !== 'okay') {
      setWelcome(`Dino is ${summary.biggestDrop}!`);
    } else {
      setWelcome('Dino missed you! 🦕');
    }
  } else {
    setWelcome("It's an egg! Tap to hatch.");
  }
  useGame.getState().touchSeenAt();
}, []);
```

Add `import { useState } from 'react';` at the top, and `import { Welcome } from '@/src/game/HUD/Welcome';`. Add `<Welcome message={welcome} />` next to `<StatsBar />`.

- [ ] **Step 3: Verify in browser**

Refresh dev server. Expected: welcome banner appears for ~4s then fades.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(hud): welcome banner with offline-drain summary"
```

🎯 **Stage D done. Visible game on Vercel.** Push to main → preview deploy → confirm in browser.

---

## Stage E — Controls

### Task 20: Tap-to-walk + camera drag (default mode)

**Files:**
- Create: `src/game/controls/TapControls.tsx`
- Modify: `src/game/world/World.tsx`

- [ ] **Step 1: Implement tap controls**

```tsx
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Raycaster, Vector2, Vector3 } from 'three';
import { useGame } from '@/src/game/store';

const MOVE_SPEED = 2.2; // units / second

export function TapControls() {
  const { camera, gl, scene } = useThree();
  const target = useRef<Vector3 | null>(null);
  const raycaster = useRef(new Raycaster());
  const ndc = useRef(new Vector2());

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      // Ignore if user is dragging (track movement after down)
      const downX = e.clientX, downY = e.clientY;
      const onUp = (u: PointerEvent) => {
        const dx = Math.abs(u.clientX - downX), dy = Math.abs(u.clientY - downY);
        if (dx + dy < 8) {
          // Treat as tap
          const rect = gl.domElement.getBoundingClientRect();
          ndc.current.set(
            ((u.clientX - rect.left) / rect.width) * 2 - 1,
            -((u.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.current.setFromCamera(ndc.current, camera);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          const groundHit = hits.find((h) => h.object.userData?.kind === 'ground' || (h.object as any).geometry?.type === 'PlaneGeometry');
          if (groundHit) target.current = groundHit.point.clone().setY(0);
        }
        gl.domElement.removeEventListener('pointerup', onUp);
      };
      gl.domElement.addEventListener('pointerup', onUp);
    };
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    return () => gl.domElement.removeEventListener('pointerdown', onPointerDown);
  }, [camera, gl, scene]);

  useFrame((_, dt) => {
    if (!target.current) return;
    const pos = useGame.getState().dino.position;
    const dx = target.current.x - pos[0];
    const dz = target.current.z - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      target.current = null;
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    const nx = pos[0] + (dx / dist) * step;
    const nz = pos[2] + (dz / dist) * step;
    useGame.getState().setPosition([nx, pos[1], nz]);
  });

  return null;
}
```

- [ ] **Step 2: Mark ground as tap target** — modify `src/game/world/props/Ground.tsx` to include `userData`:

```tsx
<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} userData={{ kind: 'ground' }}>
```

- [ ] **Step 3: Mount controls in World** — add to `src/game/world/World.tsx`:

```tsx
import { TapControls } from '@/src/game/controls/TapControls';
// ...
<TapControls />
```

- [ ] **Step 4: Verify in browser** — tap ground, dino glides to that point. Drag screen, camera orbits.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(controls): tap-to-walk + drag camera (default mode)"
```

---

### Task 21: Joystick mode

**Files:**
- Create: `src/game/controls/Joystick.tsx`

- [ ] **Step 1: Implement joystick (HUD-overlay, not in Canvas)**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/src/game/store';

const RADIUS = 60;
const MOVE_SPEED = 2.2;

export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [vec, setVec] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!vec) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const pos = useGame.getState().dino.position;
      const nx = pos[0] + vec.x * MOVE_SPEED * dt;
      const nz = pos[2] + vec.y * MOVE_SPEED * dt;
      useGame.getState().setPosition([nx, pos[1], nz]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vec]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    update(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    update(e);
  };
  const onUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setVec(null);
  };
  function update(e: React.PointerEvent) {
    const rect = baseRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, RADIUS);
    const ux = (dx / len) * (clamped / RADIUS);
    const uy = (dy / len) * (clamped / RADIUS);
    setVec({ x: ux, y: uy }); // y here = world Z (forward/back)
  }

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 z-10 select-none touch-none">
      <div
        ref={baseRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative grid h-32 w-32 place-items-center rounded-full bg-white/40 backdrop-blur"
      >
        <div
          className="h-12 w-12 rounded-full bg-white shadow-md transition-transform"
          style={{
            transform: vec ? `translate(${vec.x * RADIUS}px, ${vec.y * RADIUS}px)` : 'translate(0,0)',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(controls): joystick mode"
```

---

### Task 22: Auto-roam mode

**Files:**
- Create: `src/game/controls/AutoRoam.tsx`

- [ ] **Step 1: Implement (dino picks a random point every few seconds and walks there)**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/src/game/store';

const MOVE_SPEED = 1.4;
const WANDER_RADIUS = 6;
const PAUSE_MIN = 1.5;
const PAUSE_MAX = 3.5;

export function AutoRoam() {
  const target = useRef<[number, number] | null>(null);
  const cooldown = useRef(0);

  useEffect(() => {
    target.current = pickTarget();
  }, []);

  useFrame((_, dt) => {
    const pos = useGame.getState().dino.position;
    if (cooldown.current > 0) {
      cooldown.current -= dt;
      return;
    }
    if (!target.current) {
      target.current = pickTarget();
      return;
    }
    const [tx, tz] = target.current;
    const dx = tx - pos[0];
    const dz = tz - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.1) {
      target.current = null;
      cooldown.current = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      return;
    }
    const step = Math.min(dist, MOVE_SPEED * dt);
    useGame.getState().setPosition([
      pos[0] + (dx / dist) * step,
      pos[1],
      pos[2] + (dz / dist) * step,
    ]);
  });

  return null;
}

function pickTarget(): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * WANDER_RADIUS;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(controls): auto-roam mode"
```

---

### Task 23: Settings menu + control mode switching

**Files:**
- Create: `src/game/HUD/SettingsMenu.tsx`, `src/game/controls/index.tsx`
- Modify: `src/game/world/World.tsx`, `src/game/Game.tsx`

- [ ] **Step 1: `src/game/controls/index.tsx`**

```tsx
'use client';
import { useGame } from '@/src/game/store';
import { TapControls } from './TapControls';
import { AutoRoam } from './AutoRoam';

export function ActiveSceneControls() {
  const mode = useGame((s) => s.controlMode);
  if (mode === 'tap') return <TapControls />;
  if (mode === 'auto') return <AutoRoam />;
  return null; // joystick lives in HUD layer, not the canvas
}
```

- [ ] **Step 2: Update `src/game/world/World.tsx`**

Replace `<TapControls />` with `<ActiveSceneControls />` and import from `@/src/game/controls`.

- [ ] **Step 3: `src/game/HUD/SettingsMenu.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useGame, type ControlMode } from '@/src/game/store';
import { Joystick } from '@/src/game/controls/Joystick';

const MODES: Array<{ id: ControlMode; label: string; emoji: string }> = [
  { id: 'tap',      label: 'Tap to walk', emoji: '👆' },
  { id: 'joystick', label: 'Joystick',    emoji: '🕹️' },
  { id: 'auto',     label: 'Auto roam',   emoji: '🤖' },
];

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const mode = useGame((s) => s.controlMode);
  const setMode = useGame((s) => s.setControlMode);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-xl shadow-md backdrop-blur"
        aria-label="Settings"
      >
        ⚙️
      </button>
      {open && (
        <div className="pointer-events-auto absolute right-3 top-16 z-20 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <p className="mb-2 font-medium">Controls</p>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left ${
                  mode === m.id ? 'bg-emerald-200' : 'bg-slate-100'
                }`}
              >
                <span aria-hidden>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'joystick' && <Joystick />}
    </>
  );
}
```

- [ ] **Step 4: Mount `<SettingsMenu />` in `Game.tsx`**

Add `import { SettingsMenu } from '@/src/game/HUD/SettingsMenu';` and `<SettingsMenu />` next to `<StatsBar />`.

- [ ] **Step 5: Verify in browser** — settings gear top-right, switch modes, dino's movement style changes accordingly.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(controls): settings menu, joystick HUD, mode switching"
```

🎯 **Stage E done. All 3 control modes live.**

---

## Stage F — World System

### Task 24: Area registry + World router

**Files:**
- Create: `src/game/world/areas/registry.ts`
- Modify: `src/game/world/World.tsx`

- [ ] **Step 1: `src/game/world/areas/registry.ts`**

```ts
import type { ComponentType } from 'react';
import type { AreaId } from '@/src/game/store';
import { Home } from './Home';
// Stubs imported in Task 26
import { Town } from './Town';
import { Park } from './Park';
import { Beach } from './Beach';
import { Forest } from './Forest';
import { Cave } from './Cave';
import { SkyIsland } from './SkyIsland';

export type AreaConfig = {
  id: AreaId;
  name: string;
  emoji: string;
  Component: ComponentType;
  spawn: [number, number, number];
  exits: AreaId[];
  locked?: boolean;
};

export const AREAS: Record<AreaId, AreaConfig> = {
  home:   { id: 'home',   name: 'Home',         emoji: '🏠', Component: Home,      spawn: [0, 0, 0], exits: ['town'] },
  town:   { id: 'town',   name: 'Town Square',  emoji: '🏘️', Component: Town,      spawn: [0, 0, 0], exits: ['home', 'park', 'beach', 'forest'] },
  park:   { id: 'park',   name: 'Park',         emoji: '🌳', Component: Park,      spawn: [0, 0, 0], exits: ['town'] },
  beach:  { id: 'beach',  name: 'Beach',        emoji: '🏖️', Component: Beach,     spawn: [0, 0, 0], exits: ['town', 'cave'] },
  forest: { id: 'forest', name: 'Forest',       emoji: '🌲', Component: Forest,    spawn: [0, 0, 0], exits: ['town', 'cave'] },
  cave:   { id: 'cave',   name: 'Cave',         emoji: '⛰️', Component: Cave,      spawn: [0, 0, 0], exits: ['beach', 'forest'] },
  sky:    { id: 'sky',    name: 'Sky Island',   emoji: '☁️', Component: SkyIsland, spawn: [0, 0, 0], exits: ['town'], locked: true },
};
```

- [ ] **Step 2: Update `src/game/world/World.tsx`**

```tsx
'use client';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { AREAS } from '@/src/game/world/areas/registry';
import { useGame } from '@/src/game/store';
import { ActiveSceneControls } from '@/src/game/controls';
import { Dino } from '@/src/game/world/Dino';

export function World() {
  const areaId = useGame((s) => s.currentArea);
  const Area = AREAS[areaId].Component;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[5, 10, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <Area />
      </Suspense>
      <Dino />
      <ActiveSceneControls />
      <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={4} maxDistance={14} />
    </>
  );
}
```

- [ ] **Step 3: Remove `<Dino />` from `Home.tsx`** — it's now rendered at world level so it persists across area swaps.

- [ ] **Step 4: Add registry test** `tests/unit/registry.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { AREAS } from '@/src/game/world/areas/registry';

describe('area registry', () => {
  it('has 7 areas', () => {
    expect(Object.keys(AREAS)).toHaveLength(7);
  });
  it('every exit references a valid area id', () => {
    for (const a of Object.values(AREAS)) {
      for (const exit of a.exits) {
        expect(AREAS[exit]).toBeDefined();
      }
    }
  });
  it('sky island is locked in phase 1', () => {
    expect(AREAS.sky.locked).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
bun run test
```

Expected: PASS (note: this depends on Task 26 stubs existing — do them now or run after).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(world): area registry + world router"
```

---

### Task 25: Portal component

**Files:**
- Create: `src/game/world/Portal.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGame, type AreaId } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

type Props = {
  to: AreaId;
  position: [number, number, number];
};

export function Portal({ to, position }: Props) {
  const ref = useRef<Mesh>(null);
  const setArea = useGame((s) => s.setArea);
  const setPosition = useGame((s) => s.setPosition);
  const targetLocked = AREAS[to].locked;

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.7;
  });

  useFrame(() => {
    if (targetLocked) return;
    const dino = useGame.getState().dino.position;
    const dx = dino[0] - position[0];
    const dz = dino[2] - position[2];
    if (Math.hypot(dx, dz) < 1) {
      const target = AREAS[to];
      setArea(to);
      setPosition(target.spawn);
    }
  });

  return (
    <mesh ref={ref} position={position} onPointerDown={() => {
      if (targetLocked) return;
      setArea(to);
      setPosition(AREAS[to].spawn);
    }}>
      <torusGeometry args={[0.7, 0.15, 12, 24]} />
      <meshStandardMaterial
        color={targetLocked ? '#888' : '#4ec0ff'}
        emissive={targetLocked ? '#000' : '#2280bb'}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Add a portal to Home** — modify `src/game/world/areas/Home.tsx`:

```tsx
import { Portal } from '@/src/game/world/Portal';
// ...
<Portal to="town" position={[6, 0.7, 0]} />
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(world): portal component (proximity + tap to travel)"
```

---

### Task 26: Stub remaining 6 areas

**Files:**
- Create: `Town.tsx`, `Park.tsx`, `Beach.tsx`, `Forest.tsx`, `Cave.tsx`, `SkyIsland.tsx` (in `src/game/world/areas/`)
- Create: `src/game/HUD/AreaName.tsx`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: Each area follows the same shape** — create 6 files. Pattern (`Town.tsx` shown; repeat for the rest with different colors and a portal back to the appropriate area):

`src/game/world/areas/Town.tsx`:

```tsx
'use client';
import { Sky } from '@/src/game/world/props/Sky';
import { Ground } from '@/src/game/world/props/Ground';
import { Portal } from '@/src/game/world/Portal';

export function Town() {
  return (
    <>
      <Sky />
      <Ground color="#c8c2a6" size={40} />
      {/* central plaza fountain */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 1, 16]} />
        <meshStandardMaterial color="#9aa9b6" />
      </mesh>
      <Portal to="home"   position={[-8, 0.7,  0]} />
      <Portal to="park"   position={[ 0, 0.7, -8]} />
      <Portal to="beach"  position={[ 8, 0.7,  0]} />
      <Portal to="forest" position={[ 0, 0.7,  8]} />
    </>
  );
}
```

**Concrete example — `Park.tsx`:**

```tsx
'use client';
import { Sky } from '@/src/game/world/props/Sky';
import { Ground } from '@/src/game/world/props/Ground';
import { Portal } from '@/src/game/world/Portal';

const TREES: Array<[number, number]> = [[3, 4], [-4, 5], [5, -3], [-3, -4], [-6, 0]];

export function Park() {
  return (
    <>
      <Sky />
      <Ground color="#88c47a" />
      {TREES.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#7a4a2c" />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <coneGeometry args={[0.7, 1.4, 8]} />
            <meshStandardMaterial color="#3f8a3a" />
          </mesh>
        </group>
      ))}
      <Portal to="town" position={[0, 0.7, 8]} />
    </>
  );
}
```

**Other areas — same skeleton, different ground color + props + portals:**

| Area      | Ground color | Props | Portals back |
|-----------|--------------|-------|--------------|
| Beach     | `#f6e2a3` (sand) | a flat blue plane at `y=0.01, args=[20, 12]` near `z=8` as "water" | `town` at `[-8, 0.7, 0]`, `cave` at `[8, 0.7, 0]` |
| Forest    | `#4a7a3c` (dark green) | 12 cone-trees densely placed (use the `TREES` pattern from Park, scaled up) | `town` at `[0, 0.7, 8]`, `cave` at `[0, 0.7, -8]` |
| Cave      | `#3a3a40` (dark gray) | add `<ambientLight intensity={0.15} />` to override world light; 4 box "rocks" of varying sizes | `beach` at `[-8, 0.7, 0]`, `forest` at `[0, 0.7, -8]` |
| SkyIsland | `#e0d6ff` (pastel) | none beyond Ground + Sky | `town` at `[0, 0.7, 8]` (rendered as locked because `AREAS.sky.locked === true`) |

For each, use this skeleton:

```tsx
'use client';
import { Sky } from '@/src/game/world/props/Sky';
import { Ground } from '@/src/game/world/props/Ground';
import { Portal } from '@/src/game/world/Portal';

export function <Name>() {
  return (
    <>
      <Sky />
      <Ground color="<hex>" />
      {/* props */}
      <Portal to="<exit>" position={[<x>, 0.7, <z>]} />
    </>
  );
}
```

- [ ] **Step 2: `src/game/HUD/AreaName.tsx`**

```tsx
'use client';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

export function AreaName() {
  const id = useGame((s) => s.currentArea);
  const a = AREAS[id];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
      <div className="rounded-full bg-white/70 px-4 py-1 text-sm font-medium shadow backdrop-blur">
        <span className="mr-1" aria-hidden>{a.emoji}</span>
        {a.name}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount `<AreaName />`** in `Game.tsx`.

- [ ] **Step 4: Verify**

`bun run dev`. Walk dino through portals. Each area should look distinct. Sky Island portal looks gray and refuses entry.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(world): 6 stub areas + area name HUD"
```

---

### Task 27: Mini-map fast travel

**Files:**
- Create: `src/game/HUD/MiniMap.tsx`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: Implement (2D dialog with area buttons)**

```tsx
'use client';

import { useState } from 'react';
import { useGame } from '@/src/game/store';
import { AREAS } from '@/src/game/world/areas/registry';

export function MiniMap() {
  const [open, setOpen] = useState(false);
  const current = useGame((s) => s.currentArea);
  const setArea = useGame((s) => s.setArea);
  const setPosition = useGame((s) => s.setPosition);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto absolute right-16 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-xl shadow-md backdrop-blur"
        aria-label="Map"
      >
        🗺️
      </button>
      {open && (
        <div className="pointer-events-auto absolute right-3 top-16 z-20 grid grid-cols-2 gap-2 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur">
          {Object.values(AREAS).map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={a.locked}
              onClick={() => {
                setArea(a.id);
                setPosition(a.spawn);
                setOpen(false);
              }}
              className={`flex flex-col items-center rounded-lg px-3 py-2 ${
                a.id === current ? 'bg-emerald-200' :
                a.locked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100'
              }`}
            >
              <span className="text-2xl" aria-hidden>{a.emoji}</span>
              <span className="text-xs">{a.locked ? '🔒' : a.name}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Mount `<MiniMap />`** in `Game.tsx`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(hud): mini-map with fast travel"
```

🎯 **Stage F done. Full world traversable.**

---

## Stage G — Interactions

### Task 28: Feed action

**Files:**
- Create: `src/game/systems/interactions.ts`, `src/game/HUD/ActionBar.tsx`, `tests/unit/interactions.test.ts`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: Write failing test** `tests/unit/interactions.test.ts`

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { useGame } from '@/src/game/store';
import { feed, FOODS } from '@/src/game/systems/interactions';

describe('feed', () => {
  beforeEach(() => useGame.setState(useGame.getInitialState(), true));

  it('raises hunger by the food\'s value, clamped at 100', () => {
    useGame.getState().setStat('hunger', 30);
    feed('apple');
    const food = FOODS.apple;
    expect(useGame.getState().dino.stats.hunger).toBe(Math.min(100, 30 + food.hungerRestored));
  });

  it('does not raise above 100', () => {
    useGame.getState().setStat('hunger', 95);
    feed('cake');
    expect(useGame.getState().dino.stats.hunger).toBe(100);
  });

  it('also raises happy by happyBonus', () => {
    useGame.getState().setStat('happy', 50);
    feed('cake');
    expect(useGame.getState().dino.stats.happy).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
bun run test tests/unit/interactions.test.ts
```

Expected: FAIL.

- [ ] **Step 3: `src/game/systems/interactions.ts`**

```ts
import { useGame } from '@/src/game/store';

export type FoodId = 'apple' | 'meat' | 'cake';

export const FOODS: Record<FoodId, { name: string; emoji: string; hungerRestored: number; happyBonus: number }> = {
  apple: { name: 'Apple', emoji: '🍎', hungerRestored: 25, happyBonus: 0 },
  meat:  { name: 'Meat',  emoji: '🍖', hungerRestored: 45, happyBonus: 5 },
  cake:  { name: 'Cake',  emoji: '🍰', hungerRestored: 35, happyBonus: 15 },
};

export function feed(food: FoodId): void {
  const f = FOODS[food];
  const s = useGame.getState();
  s.applyStatDelta('hunger', f.hungerRestored);
  if (f.happyBonus) s.applyStatDelta('happy', f.happyBonus);
}

export function pet(): void {
  useGame.getState().applyStatDelta('happy', 8);
}

export function bath(): void {
  useGame.getState().applyStatDelta('clean', 50);
  useGame.getState().applyStatDelta('happy', -5); // dino doesn't love it
}

export function sleep(): void {
  useGame.getState().applyStatDelta('energy', 60);
}
```

- [ ] **Step 4: Run, expect pass**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: `src/game/HUD/ActionBar.tsx`**

```tsx
'use client';

import { useGame } from '@/src/game/store';
import { FOODS, feed, pet, bath, sleep, type FoodId } from '@/src/game/systems/interactions';

export function ActionBar() {
  const area = useGame((s) => s.currentArea);
  const homeOnly = area === 'home';
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
      <div className="flex gap-2 rounded-2xl bg-white/85 px-3 py-2 shadow-lg backdrop-blur">
        <button type="button" onClick={pet} className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-200 text-2xl" aria-label="Pet">🤗</button>
        {homeOnly && (
          <>
            {(Object.keys(FOODS) as FoodId[]).map((id) => (
              <button key={id} type="button" onClick={() => feed(id)} className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-2xl" aria-label={`Feed ${FOODS[id].name}`}>
                {FOODS[id].emoji}
              </button>
            ))}
            <button type="button" onClick={bath} className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-2xl" aria-label="Bath">🛁</button>
            <button type="button" onClick={sleep} className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-200 text-2xl" aria-label="Sleep">💤</button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Mount `<ActionBar />` in `Game.tsx`**

- [ ] **Step 7: Verify in browser** — at Home, tap apple → hunger bar fills.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(interactions): feed/pet/bath/sleep + action bar"
```

---

### Task 29: Pet action visual feedback

**Files:**
- Modify: `src/game/world/Dino.tsx`, `src/game/systems/interactions.ts`

- [ ] **Step 1: Add a "happy bounce" trigger**

In `interactions.ts`, add a tiny event emitter:

```ts
type Listener = () => void;
const listeners = new Set<Listener>();
export function onPet(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function pet(): void {
  useGame.getState().applyStatDelta('happy', 8);
  for (const l of listeners) l();
}
```

- [ ] **Step 2: React to `onPet` in Dino**

In `Dino.tsx`, add inside the component:

```tsx
import { useEffect, useState } from 'react';
import { onPet } from '@/src/game/systems/interactions';
// ...
const [bounce, setBounce] = useState(0);
useEffect(() => onPet(() => setBounce(performance.now())), []);
```

In `useFrame`, modify the bob:

```tsx
const bouncePhase = (performance.now() - bounce) / 1000;
const bounceY = bouncePhase < 0.6 ? Math.sin(bouncePhase * Math.PI / 0.6) * 0.4 : 0;
ref.current.position.set(position[0], position[1] + 0.5 + bob + bounceY, position[2]);
```

- [ ] **Step 3: Verify**

Tap pet button — dino bounces.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(dino): pet bounce animation"
```

---

### Task 30: Critical-stat thought bubble

**Files:**
- Create: `src/game/HUD/ThoughtBubble.tsx`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useGame } from '@/src/game/store';

export function ThoughtBubble() {
  const stats = useGame((s) => s.dino.stats);
  let msg: string | null = null;
  if (stats.hunger < 25) msg = '🍔';
  else if (stats.energy < 25) msg = '💤';
  else if (stats.clean < 25) msg = '🛁';
  else if (stats.happy < 25) msg = '😢';
  if (!msg) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center">
      <div className="animate-bounce rounded-full bg-white/90 px-3 py-1 text-2xl shadow-lg">{msg}</div>
    </div>
  );
}
```

- [ ] **Step 2: Mount in `Game.tsx`**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(hud): thought bubble for critical needs"
```

---

### Task 31: Onboarding (name your dino)

**Files:**
- Create: `src/game/HUD/Onboarding.tsx`
- Modify: `src/game/Game.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useState } from 'react';
import { useGame } from '@/src/game/store';

type Props = { onDone: () => void };

export function Onboarding({ onDone }: Props) {
  const [name, setName] = useState('');
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-sky-300/80 backdrop-blur">
      <div className="flex w-72 flex-col gap-3 rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-center text-4xl">🥚</p>
        <p className="text-center text-lg font-bold">It's an egg!</p>
        <p className="text-center text-sm text-slate-600">What's your dino's name?</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Rex"
          className="rounded-lg border border-slate-300 px-3 py-2 text-center text-lg"
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            const trimmed = name.trim() || 'Dino';
            useGame.setState((s) => ({ dino: { ...s.dino, name: trimmed, stage: 'baby' } }));
            onDone();
          }}
          className="rounded-lg bg-emerald-500 py-2 text-lg font-bold text-white shadow disabled:bg-slate-300"
        >
          Hatch! 🦕
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: In `Game.tsx`** track an onboarding state. Show `<Onboarding />` if no save existed:

```tsx
const [needsOnboarding, setNeedsOnboarding] = useState(false);
// In the load effect:
if (!loaded) setNeedsOnboarding(true);
// Render:
{needsOnboarding && <Onboarding onDone={() => setNeedsOnboarding(false)} />}
```

- [ ] **Step 3: Verify**

Clear localStorage, refresh — onboarding appears. Name + hatch → game proceeds.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(onboarding): name + hatch flow on first play"
```

🎯 **Stage G done. Game is fully playable.**

---

## Stage H — Ship Polish

### Task 32: PWA manifest + iOS niceties

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Generate placeholder icons**

🧑‍💻 **Parent action:** open `https://realfavicongenerator.net` (or any favicon site) and generate `icon-192.png` + `icon-512.png` from a simple dino emoji image. Drop both into `public/`. (Stub: solid color squares are OK for Phase 1.)

- [ ] **Step 2: `public/manifest.webmanifest`**

```json
{
  "name": "Dino Friend",
  "short_name": "Dino",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#cbe9ff",
  "theme_color": "#88c47a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Reference in `app/layout.tsx` metadata**

```tsx
export const metadata: Metadata = {
  title: 'Dino Friend',
  description: 'A 3D dino pet you take care of.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Dino', statusBarStyle: 'default' },
};
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(pwa): manifest + icons + iOS web-app capable"
```

---

### Task 33: Mobile viewport polish

**Files:**
- Modify: `app/globals.css`, `src/game/Game.tsx`

- [ ] **Step 1: Lock orientation hint + tap highlight + scroll**

Append to `app/globals.css`:

```css
html, body {
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
}
```

- [ ] **Step 2: Confirm safe-area insets** — modify the StatsBar wrapper in `src/game/HUD/StatsBar.tsx` to use `pt-[env(safe-area-inset-top)]` and similar at the bottom for ActionBar (`pb-[env(safe-area-inset-bottom)]`).

- [ ] **Step 3: Manually test on a real phone**

```bash
bun run show
```

Open the LAN URL on your kid's phone. Confirm: stats bar visible above notch, action bar above home-indicator, no scrolling, taps responsive.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "polish: safe-area insets + no overscroll + no tap highlight"
```

---

### Task 34: E2E smoke test

**Files:**
- Create: `tests/e2e/play.spec.ts`
- Delete: `tests/e2e/loads.spec.ts` (replaced)

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test.describe('core play loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('onboarding → hatch → stats render', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    // Stats bar exists
    await expect(page.getByLabel(/hunger \d+ percent/i)).toBeVisible();
  });

  test('feed raises hunger bar', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    // Drop hunger via dev hack: localStorage tweak
    await page.evaluate(() => {
      const raw = localStorage.getItem('tamagochi-3d:save:v1');
      if (!raw) return;
      const blob = JSON.parse(raw);
      blob.dino.stats.hunger = 30;
      localStorage.setItem('tamagochi-3d:save:v1', JSON.stringify(blob));
    });
    await page.reload();
    const before = await page.getByLabel(/hunger \d+ percent/i).getAttribute('aria-label');
    await page.getByRole('button', { name: /feed apple/i }).click();
    await expect.poll(async () =>
      await page.getByLabel(/hunger \d+ percent/i).getAttribute('aria-label')
    ).not.toBe(before);
  });

  test('travel to town via portal works', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Rex').fill('Spike');
    await page.getByRole('button', { name: /hatch/i }).click();
    await page.getByLabel('Map').click();
    await page.getByRole('button', { name: /town square/i }).click();
    await expect(page.getByText('Town Square')).toBeVisible();
  });
});
```

- [ ] **Step 2: Delete old smoke test**

```bash
rm tests/e2e/loads.spec.ts
```

- [ ] **Step 3: Run e2e locally**

```bash
bun run test:e2e
```

Expected: all tests pass on iPhone 13 + Pixel 7 viewports.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test(e2e): core play loop on mobile viewports"
```

🎯 **Stage H done. Phase 1 complete.**

---

## Final Checklist

After all 34 tasks land on `main`:

- [ ] Vercel production URL renders the game.
- [ ] On a real iPhone or Pixel, opening the URL is interactive within 4 seconds on 4G.
- [ ] Stats bar visible above notch; action bar visible above home indicator.
- [ ] Walking through portals swaps areas without flicker.
- [ ] Feed → hunger bar visibly fills.
- [ ] Closing the tab and returning ~5 minutes later shows a "Dino is hungry!" welcome.
- [ ] CI green on the latest `main` push.
- [ ] All three control modes work in both orientations.
- [ ] Sky Island portal/map button shows locked.
- [ ] localStorage save survives a full browser restart.

---

## Out of scope for this plan (deferred)

- Real GLB dino model (placeholder sphere ships in Phase 1).
- Sound and music.
- Mini-games beyond pet/feed/bath/sleep.
- Theme/skin system, multi-style art (Phase 1.5).
- Supabase cloud save (Phase 2).
- Day/night cycle.
- More species (architecture supports it).
- Sky Island unlock trigger.
