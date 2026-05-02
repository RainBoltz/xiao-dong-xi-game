Plan written to `/Users/rainboltz/.claude/plans/plan-task-add-levels-groovy-phoenix.md`. Summary:

- **Single file edit** — append `TOTAL_LEVELS = 3` and a 3-entry `LEVELS` array (verbatim from PRD §Design.1) to the end of `src/constants.js`. Legacy single-knob exports (lines 6–25) untouched.
- **Verified L1↔legacy alignment** field-by-field: `WRONG_CLICK_COOLDOWN=1500`, `CHASE_CLICK_COOLDOWN=500`, `REQUIRED_HITS=3`, `GAME_DURATION=15`, `CHASE_AUTO_MOVE_INTERVAL=900`, `SIZE_SEARCH=44`, `SIZE_CHASE=72` all match `LEVELS[0]`.
- **Monotonicity scan** L1→L2→L3: duration 15→13→11 ✓, requiredHits 3→4→5 ✓, intervals 900→700→550 ✓, cooldowns 500/1500 → 600/1800 → 700/2200 ✓, sizes 44/72 → 40/64 → 36/56 ✓, decoys 0→1→2 ✓.
- **No tests** — `package.json` has no runner, PRD §Non-Goal explicitly forbids vitest.
- **Acceptance**: `npm run build` green; no other files touched.

Awaiting approval to implement.