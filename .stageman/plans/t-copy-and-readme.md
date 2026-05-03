# Task t-l5-copy-updates: Update LevelCleared / ResultModal copy + README for 5 levels

## Files touched

- `src/components/LevelCleared.jsx` — add 1 conditional subline based on `levelIndex` (warns about the next level's new mechanic).
- `src/components/ResultModal.jsx` — replace the `win` body string `週末請妳吃壽司大餐！🍣` with the 5-level victory copy.
- `src/components/GameContainer.jsx` — change start-screen subtitle from `3 關連續挑戰` to `5 關連續挑戰，後兩關有新機制`.
- `README.md` — rewrite `## 客製化 → 微調難度` to describe 5 levels and the new `cloak` / `swap` schema fields; touch up the `## 遊戲流程` `命中 3 次` line so it doesn't lie about the new ladder.

No new tests (repo has no runner — confirmed by `t-levels-config.md` plan and PRD §Non-Goals).

## Implementation sketch

### 1. `src/components/LevelCleared.jsx`

This component is created by the upstream `t-level-cleared-component` task. Its props per that plan: at minimum `levelIndex` (the just-cleared level's 0-based index, so `levelIndex === 2` = "L3 just cleared, about to enter L4"). The component already auto-dismisses at 1.5 s via the parent's `<AnimatePresence>` — leave that alone.

Inside the centered `motion.div`, after the existing "下一關" / 過關 headline, render a tiny secondary line (Tailwind: small + amber/yellow tone to match a warning), conditional on `levelIndex`:

```jsx
const upcomingHint =
  levelIndex === 2
    ? '⚠️ 真目標會隱身'
    : levelIndex === 3
      ? '⚠️ 真假會互換樣式'
      : null;

// …inside the card body, below the existing text
{upcomingHint && (
  <p className="mt-1 text-sm font-semibold text-amber-200 drop-shadow">
    {upcomingHint}
  </p>
)}
```

- `levelIndex === 0` (cleared L1, → L2) and `levelIndex === 1` (→ L3) render no hint — the L2 / L3 mechanics already shipped and the operator wants the "memory hook" only on the genuinely new mechanics.
- Don't add a `useEffect` / new timer — fade in via the existing parent `AnimatePresence` `initial / animate / exit` so the hint inherits the same 1.5 s lifetime.
- Don't promote this to a constant table — 2 entries don't earn an abstraction; inline ternary is fine.

### 2. `src/components/ResultModal.jsx`

Edit one string literal at line 59:

```diff
-                ? '週末請妳吃壽司大餐！🍣'
+                ? '5 關全破！週末請妳吃壽司大餐 + 飯後甜點 🍣🍮'
```

- Headline (line 55) `抓到我啦！` was already changed to `全破！` by the prior `t-result-modal-and-readme` task. Re-confirm during implementation; if it still says `抓到我啦！` (i.e. the prior task hasn't merged), update to `全破！` in the same diff and call out the sequencing in the PR description. (PRD locks the body line; the headline was a judgment-call carry-over.)
- Do **not** add a new prop — `result === 'win'` only fires after L5 because `t-game-container-fsm` only flips phase to `WIN` on the last `advanceLevel()`. Adding a `levelIndex` prop here would be dead weight.
- Lose branch, gradient, motion, prop signature untouched.

### 3. `src/components/GameContainer.jsx` start-screen subtitle

Lines 363–372 (the IDLE-phase `motion.p`):

```diff
-              在畫面中找出藏起來的小東西，點中後要在 {GAME_DURATION} 秒內
-              <br />
-              再追著點中 {REQUIRED_HITS} 下才算贏！
+              5 關連續挑戰，後兩關有新機制
+              <br />
+              第 1 關 {LEVELS[0].duration} 秒內命中 {LEVELS[0].requiredHits} 下開場
```

- `GAME_DURATION` / `REQUIRED_HITS` legacy constants still exist (the `t-levels-config` plan kept them as L1 mirrors), but on the IDLE screen we don't yet have a `levelIndex` — read from `LEVELS[0]` directly. Import `LEVELS` from `../constants.js` if not already imported.
- If the upstream `t-game-container-fsm` task has already rewritten this block to read from `LEVELS`, just edit the literal subtitle string and leave the field references alone.
- Keep the `<br />` break for mobile readability; the new copy fits comfortably under the existing `max-w-xs`.

### 4. `README.md`

Section `## 客製化 → 微調難度` (lines 50–61, originally a single-knob table):

The prior `t-result-modal-and-readme` plan rewrote this to a 3-level prose summary. This task's job is to extend that to 5 levels and document the two new schema fields. Replace the section content (post-implementation, the prior version may or may not have landed; treat that as the input):

```markdown
### 微調難度

`src/constants.js` 匯出 `TOTAL_LEVELS = 5` 與 `LEVELS[]`（5 筆，index 0 = 關卡 1）。每筆設定：

| 欄位 | 說明 |
| --- | --- |
| `duration` | 該關倒數秒數 |
| `requiredHits` | 追逐期需命中幾次過關 |
| `chaseAutoMoveInterval` | 追逐期真目標自動逃竄頻率（ms） |
| `chaseClickCooldown` | 追逐期每次點擊後的短冷卻（ms） |
| `wrongClickCooldown` | 點錯背景的紅色冷卻（ms） |
| `sizeSearch` / `sizeChase` | 搜尋期 / 追逐期小東西尺寸（px） |
| `decoyCount` | 追逐期額外出現的誘餌數量 |
| `decoyAutoMove` | 誘餌是否會自動逃竄（true/false） |
| `decoyPenaltyMs` | 點到誘餌觸發的懲罰冷卻（ms），同時真目標瞬間遠跳 |
| `cloak.intervalMs` / `cloak.durationMs` | 真目標週期性隱身（透明度降至 ~0.15）— 0/0 = 不啟用，L4 / L5 開啟 |
| `swap.intervalMs` / `swap.durationMs` | 真目標與一個誘餌週期性 ring 樣式互換 — 0/0 = 不啟用，僅 L5 開啟 |

關卡軸向：

1. **關卡 1 · 暖身** — 與舊版單局玩法等價（15 秒、3 hits、無誘餌）。
2. **關卡 2 · 真假難辨** — 1 個靜止誘餌、尺寸縮小、冷卻拉長。
3. **關卡 3 · 群魔亂舞** — 2 個會自動逃竄誘餌。
4. **關卡 4 · 隱身術** — 在 L3 之上，真目標每 ~2.2s 短暫隱身 ~0.45s。
5. **關卡 5 · 偽裝交換** — 在 L4 之上，誘餌增至 3 個，且真目標 + 1 個誘餌週期性交換 ring 樣式。

舊單常量 (`WRONG_CLICK_COOLDOWN` / `CHASE_CLICK_COOLDOWN` / `REQUIRED_HITS` / `GAME_DURATION` / `CHASE_AUTO_MOVE_INTERVAL` / `LITTLE_THING_SIZE_*`) 仍以 `LEVELS[0]` 的值匯出做向下相容，但新邏輯都讀 `LEVELS[idx]`。
```

Also touch the `## 遊戲流程` step 3 to remove the stale `命中 3 次 → 抓到我啦！` line (the prior task flagged this as out-of-scope; this task's wording covers it):

```diff
-3. **結局**：命中 3 次 → 彩帶 + 「抓到我啦！週末請妳吃壽司大餐！」；倒數歸零 → 失敗 Modal 可重玩。
+3. **結局**：通關 5 關 → 彩帶 + ResultModal「全破」文案；任一關倒數歸零 → 失敗 Modal 可重玩。
```

Per PRD §Open Question #6 (`不鎖`), do **not** add a difficulty-curve screenshot.

## Tests

No automated tests (PRD §Non-Goals; `package.json` has no runner).

Manual smoke (extends the 7-point list in PRD §Test Plan):

1. **L1 idle screen** — load app, confirm subtitle reads `5 關連續挑戰，後兩關有新機制` with the L1 duration / hits hint underneath.
2. **L2 / L3 LevelCleared** — pass L1 / L2 (during dev, temporarily lower `requiredHits` if needed); confirm the LevelCleared card shows **no** warning subline. Restore the constant before commit.
3. **L4 LevelCleared** — pass L3 → confirm the card shows `⚠️ 真目標會隱身`, fades out at 1.5 s with the rest of the card.
4. **L5 LevelCleared** — pass L4 → confirm `⚠️ 真假會互換樣式`.
5. **WIN modal** — pass L5 → confirm `5 關全破！週末請妳吃壽司大餐 + 飯後甜點 🍣🍮` body, headline reads `全破！`, restart button returns to L1.
6. **README render** — open in a Markdown previewer (`gh`'s preview, or VS Code) and confirm the 5-level table + ladder section render cleanly; no broken Tailwind class names leaked into prose.

Build verification: `npm run build` green; bundle delta well under the 3 KB gzip budget (text-only changes — expect <0.5 KB).

## Risks

- **Sequencing dependency**: this task assumes 4 upstream tasks have landed (`t-levels-config` for `LEVELS[]` + `cloak` / `swap` schema, `t-level-cleared-component` for the `LevelCleared.jsx` file + `levelIndex` prop, `t-game-container-fsm` for `levelIndex` state + start-screen rewrite, and `t-result-modal-and-readme` for the L3 headline / README baseline). If any of those haven't merged, this task will reference symbols / files that don't exist. Mitigation: read each target file at implementation time; if `LevelCleared.jsx` is absent, **stop and flag** rather than create it (that's the upstream task's contract).
- **levelIndex semantics drift**: the PRD says `levelIndex === 2` means "about to enter L4". This is the post-clear value, i.e. the index of the *just-cleared* level (L3 = index 2). If `t-level-cleared-component` instead chose to expose `nextLevelIndex` (= 3), the ternary needs to flip to `=== 3 / === 4`. Verify against the actual prop signature before editing — don't trust the PRD wording alone.
- **README `## 遊戲流程` step 3 edit**: the prior `t-result-modal-and-readme` plan explicitly punted this line. Touching it here is correct (it's now genuinely wrong), but coordinate with that PR if both are open simultaneously to avoid a silly merge conflict.
- **No new prop on ResultModal**: documented choice — the PRD locks "same `result === 'win'` branch". If a future task adds a partial-completion / "best level reached" display, that's the time to introduce a `levelIndex` prop, not now.
- **GameContainer subtitle constants**: importing `LEVELS` adds a small import-graph edge. If the upstream `t-game-container-fsm` task has already wired `LEVELS` into this file (very likely — it adds `enterLevel(idx)`), the import already exists; double-check before adding a duplicate.

## Reuse check

- `LevelCleared.jsx` reuses the `motion.div` + `initial / animate / exit` pattern from `ResultModal.jsx:29-39` (per `t-level-cleared-component` plan). The new conditional subline reuses this — no new wrappers, no new component split.
- Tailwind warning palette (`text-amber-200`) already used elsewhere (see `GameContainer.jsx:303` `text-amber-300` for the timer pill). Stay in the same family for visual consistency.
- The `<br />` + `max-w-xs` mobile-readability pattern in `GameContainer.jsx:363-372` is the only place a long Chinese subtitle wraps cleanly; reuse the structure.
- `LEVELS[0]` already serves as the L1 source-of-truth post-`t-levels-config`; reading from it for the IDLE screen avoids re-deriving "what are the L1 numbers" and stays consistent with the table in README.
- Searched for prior `levelIndex`-conditional copy: none in the repo (`grep -r "levelIndex ===" src/` returns only what `t-level-cleared-component` and `t-game-container-fsm` will introduce). No existing helper to factor against.
- No string-internationalization layer exists (all copy is inline Traditional Chinese); the inline ternary in `LevelCleared.jsx` matches the project's prevailing style — don't introduce an i18n abstraction for 2 strings.