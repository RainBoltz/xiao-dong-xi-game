# Task t-extend-levels: Extend `LEVELS` table from 3 → 5 entries

## Files touched
- `src/constants.js` — set `TOTAL_LEVELS = 5`; append L4 and L5 entries to the `LEVELS` array; backfill `cloak:{0,0}, swap:{0,0}` on L1/L2/L3 so consumers can dereference `LEVELS[i].cloak.intervalMs` / `.swap.intervalMs` without nil-checks.

No other files. The existing `TOTAL_LEVELS` HUD bind in `GameContainer.jsx` already renders `Level n/{TOTAL_LEVELS}`, so the badge will read `4/5` and `5/5` automatically once the container wires the new mechanics in subsequent tasks.

## Prerequisite
The 2026-05-02 PRD's `t-levels-config` task must land first — it introduces the `TOTAL_LEVELS` export and the 3-entry `LEVELS` array (currently `src/constants.js` only exposes the legacy single-knob constants on lines 6–25). This task **stacks on that PR**; the description's reference to "existing L1/L2/L3 entries" assumes that file shape.

## Implementation sketch

1. Open `src/constants.js`. Confirm the upstream `TOTAL_LEVELS` / `LEVELS` exports are present (added by `t-levels-config`).
2. Change `export const TOTAL_LEVELS = 3;` → `export const TOTAL_LEVELS = 5;`.
3. On L1/L2/L3 (the existing 3 entries from the upstream PR — verbatim values from `2026-05-02-initiative.md` §Design.1), insert two new fields at the end of each object literal:
   ```js
   cloak: { intervalMs: 0, durationMs: 0 },
   swap:  { intervalMs: 0, durationMs: 0 },
   ```
   (Field order: keep adjacent to other config fields; trailing-comma-friendly to keep the diff localized.)
4. Append L4 and L5 to the `LEVELS` array, exact values from `2026-05-03-initiative.md` §Design.1:
   ```js
   {
     id: 4, label: '關卡 4 · 隱身術',
     duration: 10, requiredHits: 5,
     chaseAutoMoveInterval: 500, chaseClickCooldown: 700,
     wrongClickCooldown: 2400,
     sizeSearch: 36, sizeChase: 56,
     decoyCount: 2, decoyAutoMove: true,
     decoyPenaltyMs: 1700,
     cloak: { intervalMs: 2200, durationMs: 450 },
     swap:  { intervalMs: 0,    durationMs: 0   },
   },
   {
     id: 5, label: '關卡 5 · 偽裝交換',
     duration: 9, requiredHits: 6,
     chaseAutoMoveInterval: 450, chaseClickCooldown: 750,
     wrongClickCooldown: 2800,
     sizeSearch: 36, sizeChase: 56,
     decoyCount: 3, decoyAutoMove: true,
     decoyPenaltyMs: 2000,
     cloak: { intervalMs: 2400, durationMs: 400 },
     swap:  { intervalMs: 1800, durationMs: 350 },
   },
   ```
5. Save. Run `npm run build` to confirm Vite parses the file (catches stray commas / typos cheaply since there's no test runner).

## Tests

`package.json` has no test runner — PRD §Non-Goals explicitly forbids introducing vitest. Verification is manual:

- `npm run build` exits 0.
- Quick `node -e "import('./src/constants.js').then(m => console.log(m.TOTAL_LEVELS, m.LEVELS.length, m.LEVELS.map(l => [l.id, l.cloak.intervalMs, l.swap.intervalMs])))"` (or paste into the Vite dev console once it's running) prints `5 5 [[1,0,0],[2,0,0],[3,0,0],[4,2200,0],[5,2400,1800]]`.
- **Monotonicity check (PRD §Design.1, L3 → L4 → L5)** — read off the diff:
  - duration 11 → 10 → 9 ✓
  - chaseAutoMoveInterval 550 → 500 → 450 ✓
  - wrongClickCooldown 2200 → 2400 → 2800 ✓
  - decoyCount 2 → 2 → 3 ✓
  - requiredHits 5 → 5 → 6 ✓ (L4 holds hits flat because cloak already eats time)
  - cloak/swap flags 0/0 → on/0 → on/on ✓
- HUD smoke: with the upstream `Level {n}/{TOTAL_LEVELS}` bind in `GameContainer.jsx`, `npm run dev` and click "開始" — the badge reads `1/5` (full integration with L4/L5 mechanics is out of scope; downstream tasks add cloak/swap behaviour).

## Risks

- **Prerequisite drift.** This task is unmergeable until `t-levels-config` lands; if upstream values for L1–L3 change before this PR rebases, the field-by-field diff lines may conflict. Mitigation: rebase onto upstream and re-verify L1–L3 verbatim against PRD §Design.1 of `2026-05-02-initiative.md` before pushing.
- **Object-literal field-order churn.** Inserting `cloak` / `swap` mid-object on L1–L3 risks unrelated reformatting if an editor / Prettier reflows the literals. Mitigation: append the two new fields at the **end** of each object (just before the closing `},`) to keep the diff to two added lines per entry.
- **Consumer assumption that `cloak`/`swap` are always present.** Downstream tasks (`GameContainer.jsx` cloak/swap timers) will read `LEVELS[idx].cloak.intervalMs > 0`. If any L1–L3 entry is missed in the backfill, the container will throw `TypeError: Cannot read properties of undefined`. Mitigation: write all 5 entries with both fields; eyeball that every entry has `cloak:` and `swap:` lines after the edit (grep `cloak:` / `swap:` should each return 5 hits).
- **Build only catches syntax, not semantics.** Wrong numeric values will silently flow through. Mitigation: after editing, eyeball the diff against PRD §Design.1 of both initiatives — that's the single source of truth.

## Reuse check

- `LEVELS` array shape is **already defined** in upstream `t-levels-config` per `2026-05-02-initiative.md` §Design.1 — reuse it verbatim, do **not** re-introduce a parallel difficulty-knob struct or a `levelDifficulty(id)` helper. The PRD explicitly calls out `LEVELS.push(L4, L5)` as the entire design.
- `TOTAL_LEVELS` is already exported and consumed by the HUD (`Level {n}/{TOTAL_LEVELS}` bind) — bumping the const is the only HUD change required.
- The legacy single-knob exports on `src/constants.js:6–25` (`WRONG_CLICK_COOLDOWN`, `CHASE_CLICK_COOLDOWN`, `REQUIRED_HITS`, `GAME_DURATION`, `CHASE_AUTO_MOVE_INTERVAL`, `LITTLE_THING_SIZE_*`) are kept for back-compat per the upstream task's plan summary — do **not** delete them; that's a separate cleanup if/when consumers migrate.
- Don't introduce `cloakDefault` / `swapDefault` factory helpers for the L1–L3 backfill — three inline `{ intervalMs: 0, durationMs: 0 }` literals are clearer than one helper used three times, and the PRD body uses the same inline form.
- No utility files (`src/utils/random.js`) or component files need touching for this task.