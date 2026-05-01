# Tamagochi-3D — Design Spec

**Date:** 2026-05-01
**Author:** Kristoffer (with Claude)
**Status:** Approved (brainstorm phase). Ready for implementation plan.

---

## 1. Overview

A 3D web-based Tamagotchi where a single character (a dino, hatched from an egg) lives in a small open neighborhood of 7 explorable areas. Mobile-first, performant, deployed on Vercel. Built to be extended collaboratively — primarily by a 9-year-old paired with a parent, using Claude Code subagents (dev, QA, reviewer).

**Primary goals:**
- Ship a playable Phase 1 quickly.
- Make it easy and safe for a kid to add features (new areas, foods, skins, characters).
- Performant on a mid-range phone.
- Auto-deploy on every merge to `main`.

**Non-goals (Phase 1):**
- Multiplayer / social features.
- Cloud accounts and cross-device sync (deferred to Phase 2).
- Mini-games beyond the simplest "play with dino" interactions.
- Multiple species (architecture supports it; only dino ships).

---

## 2. Game Design

### 2.1 Character

- Single species this phase: **dino**, hatched from an egg.
- Stages: `egg → baby → teen → adult`, gated on `age` (seconds alive) thresholds.
- Architecture supports more species later (`species` field on character record).
- Skin system (color/texture variants) is a Phase 1.5 feature; Phase 1 ships with a default skin.

### 2.2 Needs (5 stats, 0–100; 4 actionable + 1 derived)

| Stat       | Filled by     | Effect when low                           |
|------------|---------------|-------------------------------------------|
| Hunger     | Feeding       | Sad face, bubble cue, slow movement       |
| Happiness  | Play / pet    | Frowns, refuses interactions              |
| Energy     | Sleep         | Yawns, slower animations                  |
| Cleanliness| Bathing       | Stinky particles, attracts flies          |
| Health     | Derived/penalty when others are critical | Sneezes, low-energy idle |

- Health is computed from the others (no direct medicine action in Phase 1).
- **No death.** Stats clamp at 0; the character looks sad but recovers when needs are met.

### 2.3 Time model

- **Foreground:** real-time decay. Tick at 1Hz.
- **Background / app closed:** slow drain (10× slower). Computed on next app open from `lastSeenAt`.
- **Welcome-back message** when reopening: e.g., "Dino is hungry!" if any stat dropped below threshold.

### 2.4 World / Map

Seven areas, swappable via portals. Future areas trivially added.

| Area        | Connections           | Notes                              |
|-------------|----------------------|------------------------------------|
| Home 🏠     | Town                 | Bedroom, kitchen, bath. Need actions live here. |
| Town 🏘️     | Home, Park, Beach, Forest | Hub. Future shops/NPCs.       |
| Park 🌳     | Town                 | Grass, fetch, run                  |
| Beach 🏖️    | Town, Cave           | Sand, splash                       |
| Forest 🌲   | Town, Cave           | Trees, berries                     |
| Cave ⛰️     | Beach, Forest        | Spooky, future treasure            |
| Sky Island ☁️ | Town (locked)      | Phase 1: scaffold only, shown as locked on the mini-map. Unlock trigger deferred (see §10). |

A 2D mini-map (HUD button) supports fast-travel between unlocked areas.

### 2.5 Controls (mobile-first)

Three modes, switchable in settings. Default = **Tap-to-walk + camera drag**.

- **Tap-to-walk + camera drag** (default): tap ground → dino walks; drag screen → orbit camera.
- **Joystick**: virtual stick, lower-left.
- **Auto-roam**: dino wanders by itself; tap dino to interact, tap area icon to teleport.

### 2.6 Interactions per area

- **Home:** feed (pick food from inventory), bath, bed, pet.
- **All other areas:** pet dino, throw ball, photograph (future).
- Universal: thought-bubble cues showing what dino currently wants.

---

## 3. Architecture

### 3.1 Stack

| Layer            | Choice                                        |
|------------------|-----------------------------------------------|
| Framework        | Next.js 15 (App Router)                       |
| Language         | TypeScript                                    |
| 3D               | react-three-fiber + drei + three.js           |
| State            | Zustand                                       |
| UI / HUD         | Tailwind CSS + shadcn/ui                      |
| 2D animation     | framer-motion (HUD only)                      |
| Models           | GLB (Kenney.nl, Quaternius — CC0 low-poly)    |
| Persistence (P1) | localStorage                                  |
| Persistence (P2) | Supabase (deferred)                           |
| Lint/Format      | Biome                                         |
| Tests            | Vitest (unit), Playwright (e2e mobile smoke)  |
| Package manager  | Bun                                           |
| Deploy           | Vercel (auto-deploy on push)                  |

### 3.2 High-level diagram

```
┌──────────────── Browser (mobile-first PWA) ────────────────┐
│  React UI (HUD, menus, settings)                            │
│  R3F Canvas (camera, lights, area, dino, controls)          │
│  Game State (Zustand: dino, area, controlMode, lastSeenAt)  │
│  Persistence (localStorage now → Supabase later)            │
└─────────────────────────────────────────────────────────────┘
                  │ deployed via Vercel ◄─ GitHub main
```

### 3.3 Project layout

```
tamagochi-3d/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # mounts <Game />
│   ├── layout.tsx
│   └── globals.css
├── src/
│   ├── game/
│   │   ├── Game.tsx              # root: HUD + Canvas
│   │   ├── HUD/                  # 2D overlay (stats bar, menus, area name)
│   │   ├── world/
│   │   │   ├── World.tsx         # routes to current area
│   │   │   ├── areas/            # one component per area + registry.ts
│   │   │   ├── props/            # shared building blocks (Tree, Bench, Sky)
│   │   │   └── Dino.tsx
│   │   ├── controls/             # tap, joystick, auto modes
│   │   ├── systems/              # tick loop, decay, save scheduler
│   │   ├── config/               # decay rates, stage thresholds
│   │   └── store.ts              # Zustand store
│   ├── lib/
│   │   ├── persistence.ts        # localStorage adapter w/ versioning
│   │   └── time.ts               # offline drain math
│   └── assets/                   # textures, audio
├── public/models/                # GLBs (lazy-loaded)
├── tests/
│   ├── unit/                     # Vitest
│   └── e2e/                      # Playwright (mobile viewport)
├── .github/workflows/ci.yml
├── .claude/
│   ├── settings.json             # permissions, hooks
│   ├── agents/                   # dino-dev, dino-qa, dino-reviewer
│   └── commands/                 # kid-friendly slash commands
├── docs/superpowers/specs/
└── CLAUDE.md
```

### 3.4 State model

Single Zustand store, JSON-serializable end-to-end so the whole save is one blob.

```ts
type Stat = number; // 0–100

type Dino = {
  id: string;
  name: string;
  species: 'dino';        // future: 'blob' | 'robot' | ...
  skinId: string;
  stage: 'egg' | 'baby' | 'teen' | 'adult';
  age: number;            // seconds alive
  stats: { hunger: Stat; happy: Stat; energy: Stat; clean: Stat; health: Stat };
  position: [number, number, number];
};

type Game = {
  dino: Dino;
  currentArea: AreaId;
  controlMode: 'tap' | 'joystick' | 'auto';
  lastSeenAt: number;     // ms epoch
  settings: { soundOn: boolean; theme: ThemeId };
};
```

### 3.5 Tick loop

Foreground (1Hz):
1. `decayStats(dt = 1s, multiplier = 1)`
2. `health = recompute(otherStats)`
3. Trigger reaction cues if any stat crosses a threshold.
4. Debounced save (2s).

Offline drain (on app open):
```
elapsedMs = now() - lastSeenAt
hunger -= DECAY.hunger * (elapsedMs / 60000) * 0.1
... clamp 0..100
```

Decay rates live in `src/game/config/decay.ts` so they can be tuned in one place.

### 3.6 Areas system

Each area is a self-contained React component returning the 3D contents of that scene. A central `registry.ts` maps `AreaId → { Component, spawn, exits }`. `<World>` renders the current area inside a `<Suspense>` boundary so GLBs lazy-load. Travel happens by tapping a `<Portal to="..." />` placed in the scene.

Adding a new area:
1. Create `src/game/world/areas/<Name>.tsx`.
2. Add an entry to `registry.ts`.
3. Place `<Portal>`s in/out.
That's it — no other code changes.

### 3.7 Persistence (Phase 1)

- One key: `tamagochi-3d:save:v1`.
- Save on stat change (debounced 2s), `visibilitychange` (hidden), and `beforeunload`.
- Version-tagged blob; `migrate()` handles schema bumps.
- Corrupt save backed up under `:save:corrupt:<timestamp>` and a fresh save started.
- Phase 2 swap-out: replace the body of `save()`/`load()` with Supabase calls; the public interface stays identical.

---

## 4. Subagent Workflow

| Agent          | Model       | Tools (rough)                   |
|----------------|-------------|---------------------------------|
| Orchestrator   | Main session | All                            |
| `dino-dev`     | Sonnet 4.6  | Bash, Read, Write, Edit, Grep, Glob |
| `dino-qa`      | Sonnet 4.6  | Bash, Read, Playwright          |
| `dino-reviewer`| Opus 4.7    | Read, Grep, Bash (read-only)    |

Per-feature flow:
1. Orchestrator brainstorms with user → writes plan.
2. Spawn `dino-dev` in an isolated git worktree on a `feat/<slug>` branch. Implements the plan, runs unit tests, commits in logical chunks.
3. Spawn `dino-qa` in a worktree off the dev branch. Runs dev server + Playwright (mobile viewport). Returns pass/fail + bug list.
4. Spawn `dino-reviewer` (Opus, read-only) in parallel with QA. Returns severity-ranked review notes.
5. If bugs / review fixes needed → loop back to `dino-dev`.
6. On clean pass → push branch, open PR, merge to `main`.
7. Vercel auto-deploys to production.

All implementation agents use `isolation: "worktree"` (per project rule).

Agent definitions live in `.claude/agents/<name>.md` with frontmatter (`model`, `tools`, `description`) + a focused system prompt that bakes in mobile/perf constraints and "ask, don't guess" discipline.

---

## 5. CI/CD

### 5.1 GitHub Actions (`.github/workflows/ci.yml`)

Runs on PR and on push to `main`:
- `bun install --frozen-lockfile`
- `bun run typecheck` (`tsc --noEmit`)
- `bun run lint` (`biome check`)
- `bun run test` (Vitest)
- `bun run test:e2e` (Playwright, mobile viewport, Chromium)

### 5.2 Vercel

- Repo connected to Vercel once (manual, ~10 min by parent).
- Push to `main` → production deploy.
- Push to any other branch / PR → preview deploy with shareable URL (used for kid testing on phone before merge).
- No env vars needed for Phase 1.

### 5.3 Branch protection

- `main` requires PR + green checks.
- Auto-delete branches after merge.
- Direct commits/pushes to `main` blocked at the Claude permission layer too (see Section 6).

---

## 6. Claude Code Configuration

### 6.1 `.claude/settings.json`

`defaultMode: "acceptEdits"` plus an explicit allowlist for safe Bash, and a denylist for destructive ops.

- **Allow:** `bun:*`, `bunx:*`, `npm:*`, `npx:*`, `git status|diff|log|add|commit|push|checkout|branch|switch:*`, `gh pr:*`, `gh repo view:*`, `vercel:*`, read-only shell (`ls`, `cat`, `rg`, `find`), all editing tools, `WebFetch`, `WebSearch`.
- **Deny:** `rm -rf:*`, `git push --force:*`, `git reset --hard:*`, plus best-effort patterns to block direct `main` pushes/checkouts. The authoritative guard against landing on `main` without review is GitHub branch protection (§5.3); the Claude denylist is a redundant soft layer.
- **Hook (PostToolUse on Edit/Write):** silent `bun run typecheck` so the kid sees TS errors immediately.

### 6.2 CLAUDE.md (talking-to-user rules)

Top-of-repo CLAUDE.md establishes:
- Primary user may be a 9-year-old. Keep questions short, one sentence ideally, multiple-choice with emojis when feasible. Friendly, occasionally funny, never patronizing. No unsolicited code explanations.
- For technical/admin topics (deploy, billing, accounts), prefix the question with 🧑‍💻 to flag it for the parent.

### 6.3 Slash commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/build <feature>` | Full pipeline: plan → dev → qa → reviewer → PR |
| `/show` | Start dev server, print URL + QR for phone |
| `/new-area <name>` | Scaffold a new area component + registry entry |
| `/new-skin <name>` | Add a new dino skin variant |
| `/new-food <name>` | Add a feedable food item |
| `/explain <thing>` | Kid-friendly explanation of code or concept |
| `/big-fix` | Run tests, autofix lint, commit |
| `/preview` | Push branch, open Vercel preview URL |

---

## 7. Performance Targets

- Time-to-interactive on mid-range Android (Moto G-class) over 4G: < 4s.
- Steady-state FPS on iPhone 12 / Pixel 6: ≥ 50 FPS in any area.
- Bundle (initial JS): < 300KB gzipped (excluding 3D models).
- Per-area GLB total: < 1.5MB before compression. Lazy-load per area.
- Use instanced meshes for repeated props (trees, grass), texture atlases, low-poly counts (< 5k tris per area total Phase 1).

---

## 8. Testing Strategy

- **Unit (Vitest):** stat decay math, offline drain, save migration, area-registry lookups.
- **E2E (Playwright, mobile viewport):** load → onboarding → name dino → walk → eat → travel → reload → state restored.
- **Manual / kid testing:** Vercel preview URL on phone before merge.

---

## 9. Out of Scope (Phase 1)

- Cloud accounts, cross-device sync (Phase 2 — Supabase swap planned).
- Multiple species beyond dino (architecture supports it).
- Multi-style art (single chunky low-poly style; theme/skin system Phase 1.5).
- Mini-games, NPCs, shops, economy (hooks left for later).
- Sky Island unlock logic beyond the stage gate.
- Day/night cycle (visual ambition for later).
- Notifications / push reminders.

---

## 10. Open Questions / Future Decisions

- Sound design: which library? (`howler.js` likely, but defer until first audio asset lands.)
- Onboarding flow specifics (egg-hatch animation, name prompt copy).
- Exact age thresholds for stage transitions (egg→baby→teen→adult).
- Whether `/build <feature>` should auto-merge after green or always wait for explicit user approval (lean: always wait).

---

## 11. Phase Roadmap

- **Phase 1 (this spec):** Skeleton + 7 areas (1 prop-rich, 6 minimal), 1 dino, 5 stats with foreground/offline decay, 3 control modes, localStorage save, CI/CD, agent setup. Ships playable.
- **Phase 1.5:** Theme/skin system (color/texture variants on shared models), more props per area, sound, basic mini-games. Same stack — no new infra.
- **Phase 2:** Supabase auth + cloud save, cross-device sync.
- **Phase 3:** New species (blob, robot), stage growth animations, NPCs/shops, day/night.
