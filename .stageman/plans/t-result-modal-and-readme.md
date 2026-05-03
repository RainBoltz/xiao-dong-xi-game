Plan written to `/Users/rainboltz/.claude/plans/plan-task-update-resultmodal-lexical-aho.md`. Highlights:

- **Two-line edit** in `ResultModal.jsx`: change line 55 headline `抓到我啦！` → `全破！`. Body line 59 already matches PRD (`週末請妳吃壽司大餐！🍣`). Lose branch, motion, gradient, prop signature untouched.
- **README 「微調難度」 rewrite** (lines 51–61): replace single-constant table with prose summary of the 3 levels by name + per-field tuning instructions (`LEVELS[i].duration` / `requiredHits` / `chaseAutoMoveInterval` / `chaseClickCooldown` / `wrongClickCooldown` / `sizeSearch` / `sizeChase` / `decoyCount` / `decoyAutoMove` / `decoyPenaltyMs`). Adds back-compat note that legacy single constants still exist matching `LEVELS[0]`. 「替換圖片」 untouched.
- **Headline/body split judgment call**: task spec is ambiguous. Mirrored the lose branch's split (short emotional cue in h2, flavor in p) → "全破！" / "週末請妳吃壽司大餐！🍣". Easy to revert if operator wanted them concatenated.
- **Risks flagged**:
  - Sequencing — assumes `t-levels-config` lands first; otherwise README references a non-existent `LEVELS` symbol.
  - 「遊戲流程」 line 67 will go stale (says 「命中 3 次 → 抓到我啦！」). Out of scope per task wording, but recommended as a follow-up alongside the GameContainer state-machine task — explicitly **not** touched here.
- **No tests** (PRD §Non-Goals forbids vitest); manual smoke via `npm run dev` short-circuiting to win, plus `npm run build` green.

Awaiting approval to implement.