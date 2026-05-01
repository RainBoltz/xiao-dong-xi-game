Plan is ready at `/Users/rainboltz/.claude/plans/plan-task-raise-required-hits-vectorized-goose.md`. Summary:

- **Single-line edit**: `src/constants.js:12` → `REQUIRED_HITS = 5`
- **Verified all 7 call sites** read the constant (no hardcoded `3` anywhere) — including one site the PRD didn't list (intro tooltip at `GameContainer.jsx:371`)
- **No tests added** — `package.json` has no test runner, bootstrapping one is a PRD Non-Goal
- **Manual acceptance** per PRD: `npm run build` green; `npm run dev` shows `5/5` HP bar, WIN fires on 5th hit (not 3rd), LOSE/timer/phase-transition behaviour unchanged

Awaiting your approval to implement.