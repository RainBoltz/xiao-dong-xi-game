Plan written to `/Users/rainboltz/.claude/plans/plan-task-add-decoy-jsx-purring-steele.md`. Awaiting your approval.

Highlights:
- Single new file `src/components/Decoy.jsx` (~50 lines), modeled on `LittleThing.jsx:23-91`.
- Visual diff: `ring-yellow-300/40` + drop the glow `shadow-[…]`; reuse `ASSETS.LITTLE_THING`.
- Click handler is the verbatim `e.stopPropagation()` → `if (!clickable) return` → `onHit?.()` ordering — load-bearing per PRD §Design.3 to prevent double-cooldown via `handleBackgroundClick`.
- Position is **normalized 0..1** (per your spec) → applied as CSS `%` + `translate(-50%, -50%)`. Differs from LittleThing's pixel `animate.x/y` — flagged as cross-task coordination risk for `t-game-container-fsm`, which must convert `getRandomPositionAwayFrom`'s pixel output to normalized.
- Animation: `motion.button` with the same `whileTap`, opacity ramp, and spring-on-scale conventions LittleThing uses, minus the chase-mode pulse loop.
- No new deps; no `constants.js` / `GameContainer.jsx` edits in this task.
- No automated tests (repo has no test runner — PRD Non-Goal); acceptance is `npm run build` + a temporary `App.jsx` mount for manual smoke.