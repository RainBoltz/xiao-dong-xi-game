# Task: Wire cloak + swap state machinery into GameContainer

## Context

This task layers the **L4 cloak** and **L5 mirror-swap** mechanics (PRD `2026-05-03-initiative.md` §2/§3/§5) onto `src/components/GameContainer.jsx`. Both mechanics are pure boolean-state + `setInterval`/`setTimeout` driven — no new FSM phases, no new dependencies. Operator answers to PRD Open Questions are already resolved: cloak does **not** disable `clickable` (盲點機制保留), swap does **not** move positions, cloak ⊕ swap timers may overlap, no per-level confetti.

**Hard prerequisites** — none of these exist in the current repo state (verified). This task must NOT start until they land:

1. `src/constants.js` extended with `LEVELS[]` (incl. new `cloak: {intervalMs, durationMs}` and `swap: {intervalMs, durationMs}` fields on every level — `{0, 0}` for L1–L3) and `TOTAL_LEVELS = 5`. PRD-canonical field names — see PRD §1 for L4/L5 values.
2. `GameContainer.jsx` already migrated to the level FSM per `.stageman/plans/t-game-container-fsm.md` — i.e. has `levelIndex` state, `decoys` array, `enterLevel(idx)`, `advanceLevel()`, the SEARCHING→CHASING decoy population, and the `<Decoy>` render loop.
3. `src/components/LittleThing.jsx` accepting `cloaked` + `swappedRing` props (sibling task per PRD §2/§3; not in this plan's scope).
4. `src/components/Decoy.jsx` accepting `swappedRing` prop (sibling task per PRD §3; not in this plan's scope).

If any prereq is unmerged when this task is dispatched, **abort and resequence** — do NOT inline-stub the levels or the prop additions.

## Files touched

| File | Change |
|---|---|
| `src/components/GameContainer.jsx` | + `cloaked`/`swapPair` state, +4 timer refs, extend `clearAllTimers`, extend the existing CHASING `useEffect` to start cloak/swap intervals, reset both flags inside `enterLevel`, pass new props to `<LittleThing>` + each `<Decoy>` |

No other files in this task. Constants additions live in the constants task; `LittleThing`/`Decoy` prop additions live in their respective sibling tasks.

## Implementation sketch

All edits in `src/components/GameContainer.jsx`. Apply in order; each step is independently testable.

### 1. State additions

Near the existing `levelIndex` / `decoys` state declarations:

```js
const [cloaked, setCloaked] = useState(false);
const [swapPair, setSwapPair] = useState({ realSwapped: false, decoyId: null });
```

### 2. Refs

Alongside `decoyAutoMoveTimerRef` etc., add four refs:

```js
const cloakIntervalRef = useRef(null);
const cloakHideTimerRef = useRef(null);
const swapIntervalRef = useRef(null);
const swapResetTimerRef = useRef(null);
```

### 3. Extend `clearAllTimers`

Add to the existing block (post-FSM-task expansion). For each: `clearInterval`/`clearTimeout` then null the ref.

```js
clearInterval(cloakIntervalRef.current);
clearTimeout(cloakHideTimerRef.current);
clearInterval(swapIntervalRef.current);
clearTimeout(swapResetTimerRef.current);
cloakIntervalRef.current = null;
cloakHideTimerRef.current = null;
swapIntervalRef.current = null;
swapResetTimerRef.current = null;
```

### 4. Reset cloak + swap in `enterLevel(idx)`

In the reset-flags block (between `clearAllTimers()` and `setLevelIndex(idx)`):

```js
setCloaked(false);
setSwapPair({ realSwapped: false, decoyId: null });
```

Order: `clearAllTimers()` → reset flags (incl. these two) → `setLevelIndex` → `setPhase(SEARCHING)` → rAF measure + random position. Critical for preventing residual cloak/swap state across level transitions (PRD §5).

### 5. Start cloak + swap intervals on entering CHASING

Extend the existing `useEffect` that fires when `phase === GAME_PHASE.CHASING` (the same one that starts `autoMoveTimerRef` and `decoyAutoMoveTimerRef` per the FSM task). Read `level.cloak` and `level.swap` from the closure's hoisted `level = LEVELS[levelIndex]`.

**Cloak:**

```js
if (level.cloak.intervalMs > 0) {
  cloakIntervalRef.current = setInterval(() => {
    setCloaked(true);
    clearTimeout(cloakHideTimerRef.current);
    cloakHideTimerRef.current = setTimeout(() => {
      setCloaked(false);
    }, level.cloak.durationMs);
  }, level.cloak.intervalMs);
}
```

**Swap:**

```js
if (level.swap.intervalMs > 0) {
  swapIntervalRef.current = setInterval(() => {
    // Re-randomise every tick — never lock onto the same decoy.
    // Read latest decoys via setDecoys(prev => ...) without mutating —
    // closure-`decoys` would be stale, and listing `decoys` in deps
    // would restart the timer on every decoy auto-move tick.
    setDecoys((current) => {
      if (current.length === 0) return current;
      const pick = current[Math.floor(Math.random() * current.length)];
      setSwapPair({ realSwapped: true, decoyId: pick.id });
      return current;
    });
    clearTimeout(swapResetTimerRef.current);
    swapResetTimerRef.current = setTimeout(() => {
      setSwapPair({ realSwapped: false, decoyId: null });
    }, level.swap.durationMs);
  }, level.swap.intervalMs);
}
```

The effect's cleanup return must clear both intervals **and** both timeouts (defense in depth — `clearAllTimers` already covers them, but the per-effect cleanup runs on every phase change).

Effect deps: `[phase, level.cloak.intervalMs, level.cloak.durationMs, level.swap.intervalMs, level.swap.durationMs, level.chaseAutoMoveInterval, level.sizeChase, level.decoyAutoMove]`. Do **not** add `decoys` — would restart cloak/swap timers every auto-move tick and thrash cadence.

> **Single-effect over split.** Folding cloak + swap into the existing CHASING effect keeps all CHASING-time intervals in one place and matches the FSM task's pattern. Two new effects would duplicate the `phase !== CHASING` guard and the dep list — same lifetime, more boilerplate.

### 6. Pass new props in render

- Real `<LittleThing>`: add `cloaked={cloaked}` and `swappedRing={swapPair.realSwapped}`.
- Each `<Decoy>` in `decoys.map`: add `swappedRing={swapPair.decoyId === d.id}`.

Hit-handling untouched — swap is purely visual; the real target still scores via `onHit`, decoy still penalises via `onDecoyHit` (PRD §3 explicit: 不改變點擊判定).

## Reuse check

- `clearAllTimers` (`GameContainer.jsx:87-98`, expanded by the FSM task) — extend, don't fork.
- The existing CHASING `useEffect` (currently autoMove only; expanded by the FSM task to also start `decoyAutoMoveTimerRef`) — extend, don't add a parallel effect.
- `setDecoys((current) => ...)` functional-setter pattern is already used in the FSM task's decoy-auto-move effect — same idiom for reading latest decoys without retriggering the effect.
- No new helper modules; no `random.js` additions; no animation-library additions (PRD Non-Goals).

## Risks

1. **Stale-`decoys` closure in the swap interval.** The swap callback needs the *current* decoy list. Listing `decoys` in the effect deps would restart cloak + swap timers on every decoy auto-move (~every 450 ms on L5) — visible jitter and incorrect cadence. Mitigation: the `setDecoys((current) => ...)` callback above, OR mirror into a `decoysRef` updated alongside every `setDecoys`. Either works; the inline `setDecoys` read keeps surface area smallest.
2. **Cloak ⊕ swap overlap on L5** (PRD Open Question #4 — operator: 不強制錯開). Visual collision (cloaked + swapped real target) can happen. Acceptable per PRD; flag in the PR description so the reviewer doesn't file it as a bug.
3. **`enterLevel` reset ordering.** If `setCloaked(false)` lands *after* `setPhase(SEARCHING)`, a same-tick cloak-timer fire could briefly re-cloak in SEARCHING. The contracted order (clear → reset flags → setLevelIndex → setPhase) is the guarantee. The CHASING effect's cleanup also clears the timer on phase-out as a safety net.
4. **L1–L3 regression.** With `cloak.intervalMs === 0` and `swap.intervalMs === 0`, both `if` branches no-op and no timer is scheduled. Verify by playing L1 with DevTools open: `cloakIntervalRef.current` stays `null` throughout CHASING.
5. **Sibling-task prop drift.** This plan assumes `<LittleThing>` accepts `cloaked` (boolean) + `swappedRing` (boolean), and `<Decoy>` accepts `swappedRing` (boolean). If sibling tasks ship different names (`isCloaked`, `swapped`), every prop site here breaks at render time (silent — visual no-op). Sync naming with siblings before merging.
6. **Cross-level timer leak.** All four new refs MUST be in `clearAllTimers`; missing any one leaks an interval across `LEVEL_CLEARED → next-level enterLevel`. PRD Test Plan item 6 is the regression check.

## Cross-task coordination

Hard depends on:

- **`constants.js` task** — `LEVELS[i].cloak.{intervalMs,durationMs}` + `LEVELS[i].swap.{intervalMs,durationMs}` shape, with `{0, 0}` for L1–L3.
- **`t-game-container-fsm.md`** — `levelIndex`, `decoys` array of `{id, x, y}`, `enterLevel(idx)`, the consolidated CHASING `useEffect`, the `<Decoy>` render loop.
- **`LittleThing.jsx` task** — `cloaked` + `swappedRing` props.
- **`Decoy.jsx` task** — `swappedRing` prop.

If sequencing slips, park this task. Do NOT inline-stub levels, decoys, or prop forwarding.

## Verification

Manual smoke (PRD Test Plan items 2, 3, 4, 6 are acceptance bar):

1. `cd /Users/rainboltz/Documents/GIthub/xiao-dong-xi-game && npm install && npm run dev`. Mobile-portrait viewport.
2. **L1–L3 unchanged** — play L1→L3, confirm no cloak or swap visible. Optional `console.log` to verify `cloakIntervalRef.current === null` throughout, then remove.
3. **PRD Test #2 (L4 cloak)** — enter L4. Every ~2.2 s the real target's opacity briefly drops to ~0.15 for ~0.45 s; decoys stay bright. Bling-tap during cloak still scores (clickable not disabled).
4. **PRD Test #3 (L4 cloak + decoy penalty共存)** — during cloak, click a decoy → red `decoyPenaltyMs = 1700` overlay. Cloak interval keeps firing through the penalty.
5. **PRD Test #4 (L5 swap)** — enter L5. 3 decoys all auto-move; every ~1.8 s exactly 1 decoy wears the bright/glowing ring while the real target wears the dim ring, ~0.35 s, then both revert. Confirm the chosen decoy varies tick-to-tick.
6. **PRD Test #6 (cross-level timer cleanup)** — in mid-L4 cloak, let `timeLeft` hit 0 → ResultModal lose → restart → first second of L1 shows zero cloak/swap activity. Regression gate for `clearAllTimers` extension.
7. `npm run build` — clean, bundle delta < 3 KB gzip (pure state + timers).

No automated tests (`xiao-dong-xi-game/package.json` has no test runner per PRD Non-Goals). Smoke video / GIF in the PR description is the deliverable.