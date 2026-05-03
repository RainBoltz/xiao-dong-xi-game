# Task t-cloak-swap-props: Add `cloaked` + `swappedRing` props to `LittleThing` and `Decoy`

## Files touched
- `src/components/LittleThing.jsx` — add `cloaked` + `swappedRing` props; multiply `animate.opacity` by cloak factor; tighten opacity transition; ring `className` ternary.
- `src/components/Decoy.jsx` — add `swappedRing` prop; ring `className` ternary (inverse of LittleThing's).

## Implementation sketch

### `src/components/LittleThing.jsx`

1. **Signature** (line 19): extend the destructure to:
   ```jsx
   export default function LittleThing({ phase, position, clickable, onHit, cloaked = false, swappedRing = false }) {
   ```
   New props default to `false` so existing call sites (and L1–L3) render bit-identical.

2. **Cloak opacity** (current line 47): multiply the existing `clickable` ternary by the cloak factor:
   ```jsx
   opacity: (clickable ? 1 : 0.35) * (cloaked ? 0.15 : 1),
   ```
   This preserves the existing wrong-click cooldown dim (`0.35`) and stacks cloak on top — under cooldown + cloak, opacity goes to `~0.0525`, which is fine (state is already not clickable).

3. **Opacity transition** (current line 63): change duration from `0.2` to `0.12`:
   ```jsx
   opacity: { duration: 0.12 },
   ```
   Snaps the cloak in fast; fade-out is just the same 0.12 in reverse — natural enough per PRD §2.

4. **Ring className** (current lines 73–77): replace the `isChasing` ternary's "true" arm with a nested `swappedRing` ternary. Keep the "false" arm (`ring-white/40` for SEARCHING) untouched — cloak/swap are CHASING-only, so SEARCHING render stays bit-identical.
   ```jsx
   className={`relative h-full w-full overflow-hidden rounded-full ring-2 ${
     isChasing
       ? (swappedRing
           ? 'ring-yellow-300/40'                               // decoy-style: translucent, no glow
           : 'ring-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]')  // existing real-target style
       : 'ring-white/40'
   }`}
   ```

5. **Do NOT touch**: `pointerEvents: clickable ? 'auto' : 'none'` (line 42), the `handleClick` body, or the `whileTap` guard. PRD §2 + Open Question #1 explicitly preserve the 盲點 / blind-tap channel during cloak — the player can still hit a near-invisible real target.

6. **JSDoc**: append two `@param` lines for `cloaked` and `swappedRing` to the existing block (lines 10–18), matching the style of the existing entries.

### `src/components/Decoy.jsx`

> Decoy.jsx is created by the sibling task `t-decoy-component` (plan: `.stageman/plans/t-decoy-component.md`). This task **strictly depends** on that file landing first. See Risks.

1. **Signature**: extend destructure with `swappedRing = false`.

2. **Ring className**: the decoy's existing chasing ring is the translucent-yellow / no-glow style (`ring-yellow-300/40` per the t-decoy-component plan). Wrap it in the inverse ternary so `swappedRing=true` swaps in the real-target's strong-glow style:
   ```jsx
   className={`… ring-2 ${
     swappedRing
       ? 'ring-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]'   // real-target style
       : 'ring-yellow-300/40'                                       // decoy default
   }`}
   ```
   The exact surrounding template will be a one-character edit once Decoy.jsx exists; do not pre-write Decoy structure here.

3. **Do NOT touch** Decoy's `clickable` / `onHit` / `pointerEvents` — same blind-tap contract as LittleThing.

4. **JSDoc**: append a `@param` line for `swappedRing`.

## Tests

- **No automated tests.** PRD §Non-Goals lists "test runner" — the repo has no `jest` / `vitest` / `playwright` setup, so no harness to extend in this task.
- **Verification gates** (run before opening PR):
  1. `npm run build` succeeds (Vite production build catches JSX/syntax breakage).
  2. `npm run dev` boots; with `GameContainer` not yet wiring the new props (props default to `false`), L1–L3 visuals must be **bit-identical** to `main` — eyeball the dim search-phase silhouette + the chasing yellow-glow ring.
- **Manual smoke is deferred** to the GameContainer wiring task (`t-game-container-fsm` per the PRD). At that point: L4 verifies cloak (real opacity dips ~0.15 every ~2.2 s, blind-tap still scores); L5 additionally verifies ring-swap (real ↔ a random decoy briefly trade ring styles).

## Risks

- **Decoy.jsx doesn't exist yet on `main`**. This task must merge **after** `t-decoy-component`. Order in the stack (or block on the sibling task's PR before opening this one). If Decoy.jsx lands with a different ring base than `ring-yellow-300/40`, the inverse-ternary "swapped" arm here must be updated to mirror it — flag in PR review.
- **Cross-task coordination with `t-game-container-fsm`**. That task owns `cloaked` / `swapPair` state in `GameContainer.jsx` and the prop wiring. The contract this task locks in:
  - `cloaked: boolean` — passed only to the **real** target's `<LittleThing>`. Decoys never receive `cloaked`.
  - `swappedRing: boolean` — passed to the real target **and** to whichever single decoy is currently swapped (per PRD §3, max one decoy at a time).
  Document this in the PR description so the GameContainer task references the correct shape.
- **Opacity stacking under cooldown** (`clickable=false, cloaked=true` → opacity `0.0525`). Acceptable: during wrong-click cooldown the target is already non-clickable; cloak overlapping cooldown is a rare visual edge case, not a gameplay regression.
- **No shared `Ring` component** — duplicates two short className strings across the two files. PRD §3 forbids extraction explicitly to keep the diff small. Do **not** refactor, even if a reviewer suggests DRY.
- **Tailwind JIT class purge**: both class strings (`ring-yellow-300/40` and the `shadow-[0_0_20px_rgba(...)]` arbitrary value) already appear in `LittleThing.jsx` on `main`, so JIT will keep generating them. No `tailwind.config.js` `safelist` change needed.
- **JSDoc-only props**: this codebase uses JSDoc, not TypeScript / PropTypes. No type-system follow-up required; defaults via destructure are the only "validation."

## Reuse check

- **No existing helper covers the cloak factor or the ring-swap ternary** — both are bespoke per PRD §2 / §3.
- The opacity-multiply pattern is a one-liner; no helper warranted (and adding one would violate PRD §3's "don't extract a Ring component" spirit).
- `ASSETS.LITTLE_THING` (already imported in `LittleThing.jsx:4`) is reused by the sibling Decoy plan — confirms both components share the same image asset, so no new constant is needed in either file.
- The existing `isChasing` derivation (line 20) already gates the strong-glow ring; this task piggybacks on it rather than introducing a parallel `isCloakActive` derivation in the component (cloak/swap are pure visual props driven from outside).