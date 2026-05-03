# PRD：新增關卡 4、關卡 5（隱身 + 偽裝交換）

## Context

`xiao-dong-xi-game` 已有一份 2026-05-02 的 PRD（[`.stageman/prds/2026-05-02-initiative.md`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/.stageman/prds/2026-05-02-initiative.md)）把單局玩法擴成 1 → 2 → 3 連續闖關，並引入「誘餌（Decoy）」機制。對應 6 個 task plan 已在 `.stageman/plans/` 落地（`t-levels-config.md` / `t-decoy-component.md` / `t-level-cleared-component.md` / `t-game-container-fsm.md` / `t-result-modal-and-readme.md` / `t-raise-required-hits.md`）。本次需求「更多關卡，難度上升 — 請幫我多設計兩個關卡」即在 L1–L3 ladder 之上**疊加 Level 4、Level 5**，把總關卡數從 3 拉到 5，並各自帶入 1 個新機制（不只調參數），維持「每一關有一個記憶點」。

## Background & Motivation

- 2026-05-02 PRD 已把難度旋鈕從 [`src/constants.js:6-25`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/constants.js) 的 7 個常量改成 `LEVELS[]` 查表 + `TOTAL_LEVELS`，新增 L4 / L5 只需在陣列尾巴 push 兩筆。
- 狀態機已擴成 `IDLE / SEARCHING / CHASING / LEVEL_CLEARED / WIN / LOSE`、有 `levelIndex` + `enterLevel(idx)` + `advanceLevel()`，[`src/components/GameContainer.jsx:31-46`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 不用再動骨架。
- 誘餌組件 [`src/components/Decoy.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/Decoy.jsx)（仿 [`LittleThing.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx)）已存在；新機制能直接 reuse。
- `LEVELS[2]`（L3 = 群魔亂舞）已是「2 個會逃竄誘餌 + 縮小尺寸 + 縮短 duration」的天花板，**單純再縮數值會撞到操作極限**（手機觸控誤判、玩家挫敗），所以 L4 / L5 必須各引入 1 個新機制讓難度突破。
- 隨機定位工具 [`src/utils/random.js::getRandomPositionAwayFrom`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/utils/random.js) 與懲罰冷卻 [`src/components/CooldownOverlay.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/CooldownOverlay.jsx) 在 L2 / L3 已驗證可重用。

## Goals

- 把 [`src/constants.js`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/constants.js) 的 `LEVELS[]` 從 3 筆延長到 5 筆，`TOTAL_LEVELS = 5`。
- **Level 4 · 隱身術（Cloak）**：在 L3 的 2 個自動逃竄誘餌之上，**真目標**會週期性「隱形」（透明度短暫降至 ~0.15）— 玩家被迫靠記憶 / 軌跡而不是視覺鎖定。
- **Level 5 · 偽裝交換（Mirror Swap）**：在 L4 的隱身機制之上，把誘餌數量再加 1（共 3 個自動逃竄），且真目標 + 某一個誘餌會**週期性 ring 樣式互換**（黃光環 ↔ 半透明黃環）一小段時間，玩家必須在 ring 互換的瞬間記得「真的剛剛在哪」。
- 每關只新增 1 個機制 — 不疊加新動畫庫、新 phase、新 state；所有新行為以 `LEVELS[idx]` 的旗標開關驅動。
- HUD `Level X / 5` 自動因 `TOTAL_LEVELS = 5` 更新，無需改 [`GameContainer.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 的徽章繪製。
- 通關 L5 才出 `WIN` Modal；中間關卡沿用既有 `LEVEL_CLEARED` 中介卡。

## Non-Goals

- ❌ 新狀態機 phase（不加 `CLOAKED` / `SWAPPING` 等 — 全部用 boolean state + timer 驅動，phase 仍只有 5 個）。
- ❌ 進度持久化（localStorage / 帳號）— L4 / L5 失敗一樣回 L1。
- ❌ 關卡選單 / 跳關 / 練習模式。
- ❌ 新動畫 / 音效 / 圖示集；沿用 framer-motion + lucide-react，不新增依賴。
- ❌ 新 Decoy 組件 — 兩個新機制都掛在現有 `Decoy.jsx` + `LittleThing.jsx`（透過 prop 開關 cloak / swap）。
- ❌ 自動化測試框架（[`package.json`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/package.json) 無 test runner，沿用人工 smoke）。

## Design

### 1. 資料模型：擴充 LEVELS 表

[`src/constants.js`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/constants.js) 改 `TOTAL_LEVELS = 5`，並在 `LEVELS` 陣列尾巴 append 兩筆新關卡。沿用 2026-05-02 PRD 的 schema 並**新增兩個欄位**（其它關卡預設 `0` / `false`，向下相容）：

```js
// 新增欄位（其它關卡預設關閉）
// cloak: { intervalMs, durationMs }  → 0 / 0 = 不啟用
// swap:  { intervalMs, durationMs }  → 0 / 0 = 不啟用

// L1 / L2 / L3 都補上 cloak: {0,0}, swap: {0,0}

LEVELS.push(
  {
    id: 4, label: '關卡 4 · 隱身術',
    duration: 10, requiredHits: 5,
    chaseAutoMoveInterval: 500, chaseClickCooldown: 700,
    wrongClickCooldown: 2400,
    sizeSearch: 36, sizeChase: 56,           // 與 L3 同尺寸（避免再縮 → 觸控誤判）
    decoyCount: 2, decoyAutoMove: true,
    decoyPenaltyMs: 1700,
    cloak: { intervalMs: 2200, durationMs: 450 },
    swap:  { intervalMs: 0,    durationMs: 0   },
  },
  {
    id: 5, label: '關卡 5 · 偽裝交換',
    duration: 9,  requiredHits: 6,
    chaseAutoMoveInterval: 450, chaseClickCooldown: 750,
    wrongClickCooldown: 2800,
    sizeSearch: 36, sizeChase: 56,
    decoyCount: 3, decoyAutoMove: true,
    decoyPenaltyMs: 2000,
    cloak: { intervalMs: 2400, durationMs: 400 },
    swap:  { intervalMs: 1800, durationMs: 350 },
  },
);
```

> 數值是合理起點，playtest 後可微調。PRD 鎖機制與軸向，不鎖具體秒數。

**單調性檢查**（接 L3 → L4 → L5）：duration 11 → 10 → 9 ✓、requiredHits 5 → 5 → 6（L4 持平 hits 因為 cloak 已實質吃時間）、interval 550 → 500 → 450 ✓、wrongClickCooldown 2200 → 2400 → 2800 ✓、decoyCount 2 → 2 → 3 ✓、cloak / swap 旗標 0 → on → on+swap ✓。

### 2. 新機制 A：Cloak（L4、L5 共用）

加在 [`GameContainer.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx)，於進入 `CHASING` 時若 `LEVELS[levelIndex].cloak.intervalMs > 0` 起一個 `setInterval`：

- 每 `intervalMs` 觸發一次：`setCloaked(true)` → `durationMs` 後 `setCloaked(false)`（內層 `setTimeout`）。
- `cloaked` state 只影響**真目標**的 `LittleThing` — 透過新 prop `cloaked={cloaked}` 把 `opacity` 從 1 降到 0.15、`pointer-events` 維持 `auto`（玩家還是能盲點）。
- 誘餌不受影響（保持高亮 → 增加迷惑度，cloak 期間玩家會更容易誤點誘餌）。
- timer ref `cloakIntervalRef` / `cloakHideTimerRef` 加進 `clearAllTimers()` [`GameContainer.jsx:87-98`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx)。
- `enterLevel(idx)` 重設：先 `setCloaked(false)`，再起新 interval — 避免關卡切換瞬間殘留隱身。

`LittleThing.jsx` [`src/components/LittleThing.jsx:19-93`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx) 新增 prop `cloaked = false`：在現有 `animate.opacity` 的計算上**乘**一個 cloak factor（`cloaked ? 0.15 : 1`），並把 `transition.opacity.duration` 縮到 0.12 讓隱身瞬間到位、現出時自然漸入。**不**改 `clickable` 邏輯 — 玩家盲點要算分，這是這關的核心張力。

### 3. 新機制 B：Mirror Swap（僅 L5）

於進入 `CHASING` 時若 `LEVELS[levelIndex].swap.intervalMs > 0` 起一個 `setInterval`：

- 每 `intervalMs`：在當前 `decoys` 陣列裡**隨機挑 1 個誘餌**，把它的 `swappedRing` flag 設為 `true`，同時把真目標的 `swappedRing` 設為 `true`，持續 `durationMs` 後雙雙還原。
- `swappedRing` 切換的是 ring 樣式：
  - 真目標：原本黃光環 + 強發光（[`LittleThing.jsx:73-77`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx)）→ 暫時換成誘餌的「黃環半透明、無發光」樣式。
  - 被選中的誘餌：原本「黃環半透明」→ 暫時換成真目標的「強發光」樣式。
- **不**改變兩者的點擊判定（真目標仍是 `onHit` 加分 / 誘餌仍是 `onDecoyHit` 觸發懲罰）— 互換的只是視覺欺敵；玩家要靠**最後的位置軌跡**判斷哪個是真的。
- 一次只會有 1 個誘餌被 swap，每次選誰都重新隨機 — 避免穩定追同一個。

State 增加 `swapPair: { realSwapped: boolean, decoyId: number | null }`；timer ref `swapIntervalRef` / `swapResetTimerRef` 加入 `clearAllTimers()`。

`LittleThing.jsx` 與 `Decoy.jsx` 都新增 prop `swappedRing = false`，內部根據它在原本兩種 ring 樣式之間切換 — **不**抽公因式 ring 組件（會擴大改動面積），只在兩個檔案各加一個三元運算。

### 4. UI / 文案調整

- **[`GameContainer.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 開始畫面**：副標把「3 關連續挑戰」改為「**5 關連續挑戰，後兩關有新機制**」。
- **HUD Level 徽章**：因為 `Level {n}/{TOTAL_LEVELS}` 已直接 bind 到 `TOTAL_LEVELS`（2026-05-02 PRD 的設計），自然顯示 `4/5` / `5/5`，**不需要改**。
- **LevelCleared 中介卡**[`src/components/LevelCleared.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/LevelCleared.jsx)：當 `levelIndex === 2`（即將進 L4）時副文案多一行「⚠️ 真目標會隱身」；`levelIndex === 3`（即將進 L5）多一行「⚠️ 真假會互換樣式」。沿用既有 1.5s 自動消失。
- **ResultModal `win`**[`src/components/ResultModal.jsx`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/ResultModal.jsx)：通關 L5 時的文案再升級 — 「**5 關全破！週末請妳吃壽司大餐 + 飯後甜點 🍣🍮**」。仍用同一個 `result === 'win'` 分支，不另開 prop。

### 5. Timer / 清理擴充

`clearAllTimers()` [`GameContainer.jsx:87-98`](/Users/rainboltz/Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 新增 4 個 ref：`cloakIntervalRef`、`cloakHideTimerRef`、`swapIntervalRef`、`swapResetTimerRef`。

`enterLevel(idx)` 順序維持 2026-05-02 PRD 規範 — 先 clearAllTimers → 重設旗標（`setCloaked(false)`、`setSwapPair({ realSwapped: false, decoyId: null })`、hits / cooldown 等）→ setLevelIndex → 進 SEARCHING → rAF 量測 + 隨機定位。**新加的 cloak / swap interval 必須在 phase 變成 `CHASING` 時才起**（沿用既有「進 chasing → 起 autoMove + decoyAutoMove」的同一個 useEffect 內塞入），避免在 SEARCHING 階段就開始隱身。

## Test Plan

沿用 2026-05-02 PRD 的人工 smoke 模式（無 vitest）。在原 7 點清單後追加 5 點：

1. **L3 → L4 過渡**：L3 通關 → LevelCleared 卡顯示「⚠️ 真目標會隱身」→ 進 L4，HUD `4/5`，倒數 10s。
2. **L4 隱身行為**：每 ~2.2s 真目標 opacity 短暫降至 ~0.15 持續 ~0.45s，期間誘餌維持高亮 — 玩家盲點仍可命中（不關 `clickable`）。連續完成 5 hits 過關。
3. **L4 隱身 + 誘餌懲罰共存**：在隱身瞬間誤點誘餌 → 觸發 `decoyPenaltyMs = 1700` 紅色冷卻；隱身 timer 不被冷卻打斷（恢復後仍週期觸發）。
4. **L4 → L5 過渡**：LevelCleared 卡顯示「⚠️ 真假會互換樣式」→ 進 L5，HUD `5/5`，3 個誘餌全部自動逃竄，且每 ~1.8s 看到 1 個誘餌「亮起來、發光」+ 真目標「黯掉、半透明」持續 ~0.35s。
5. **L5 通關 → WIN**：6 hits 達標 → ResultModal「5 關全破！週末請妳吃壽司大餐 + 飯後甜點 🍣🍮」。重玩按鈕回 L1（不是 L5）。
6. **跨關 timer 殘留檢查**：在 L4 隱身 / L5 swap 進行中故意拖到失敗（timeLeft 歸零）→ ResultModal「小東西跑掉了」→ 重玩 → L1 第一秒**不應**看到任何隱身 / swap 動作（驗證 `clearAllTimers` 已清乾淨新加的 4 個 ref）。
7. **build 驗證**：`npm run build` 過、bundle 增量 < 3 KB gzip（兩個機制都是純 state + timer，不新增模組）。

## Rollout

- **單一 PR**，疊在 2026-05-02 PRD 的實作 PR 之後（依賴它的 `LEVELS[]` / `Decoy.jsx` / `LevelCleared.jsx` / `enterLevel`）。如果 2026-05-02 仍未 merge，這個 PR 在它後面 stack。
- 改動：`constants.js`（append 2 levels + 2 個欄位）、`GameContainer.jsx`（cloak / swap state + timer + clearAllTimers + 進 CHASING 啟動）、`LittleThing.jsx`（`cloaked` / `swappedRing` props）、`Decoy.jsx`（`swappedRing` prop）、`LevelCleared.jsx`（依 `levelIndex` 顯示警告小字）、`ResultModal.jsx`（L5 文案）、`README.md`（5 關說明）。
- 無 feature flag、無後端、無外部依賴 — `npm run build` + 部署即可。
- 預估 diff：~150 行新增、~40 行修改，1 名 reviewer 30 分鐘可審完。

## Critical Files

| 檔案 | 變動類型 |
|---|---|
| `src/constants.js` | 修改：`TOTAL_LEVELS = 5`；`LEVELS.push(L4, L5)`；L1–L3 補 `cloak: {0,0}` / `swap: {0,0}` 預設欄位 |
| `src/components/GameContainer.jsx` | 修改：`cloaked` / `swapPair` state、4 個新 timer ref、進 `CHASING` 的 effect 啟動 cloak + swap、`clearAllTimers` / `enterLevel` 擴充、把新 prop 傳給 `LittleThing` / `Decoy` |
| `src/components/LittleThing.jsx` | 修改：`cloaked`、`swappedRing` 兩個新 prop；`opacity` 計算乘 cloak factor；ring className 三元切換 |
| `src/components/Decoy.jsx` | 修改：`swappedRing` prop；ring className 三元切換 |
| `src/components/LevelCleared.jsx` | 修改：依 `levelIndex` 顯示「即將進 Lx · 機制提示」副文案 |
| `src/components/ResultModal.jsx` | 修改：`win` 文案升級為 5 關全破版 |
| `README.md` | 修改：「微調難度」段補 5 關 + cloak / swap 欄位說明 |

可重用、不需新寫：`src/utils/random.js`、`src/components/CooldownOverlay.jsx`、`src/components/ProgressBar.jsx`。

## Open Questions


1. **Cloak 期間是否關閉真目標的 `clickable`**：目前設計**不關**（玩家可盲點，記憶力換分）。要改成「隱身期完全不可點」會更殘忍但更公平 — 預設保留盲點機制。

   **Answer:**
> 保留盲點機制

2. **Swap 是否同時影響「位置」**：目前只換 ring 樣式不換位。若也短暫交換 (x, y) 會更難 — 但容易讓玩家覺得「bug」，預設不做。

   **Answer:**
> 不做

3. **L4 / L5 通關時是否各自彩帶**：目前只有 L5 全破才 `Confetti`，L4 過關沿用 LevelCleared 中介卡。要不要 L4 過關也來一波小彩帶？預設不加（節奏感）。

   **Answer:**
> 不加

4. **Cloak / Swap 之間的相位關係**（L5）：兩個 interval 各自跑、可能同時觸發（隱身 + ring 互換重疊）— 預設容許重疊，這是最高難度的核心張力。要不要強制錯開？預設不強制。

   **Answer:**
> 不強制

5. **L4 / L5 失敗時是否標示「在第 N 關失敗」**：沿用 2026-05-02 PRD 的決策——不顯示。

   **Answer:**
> 不顯示

6. **是否在 README 加一張 5 關難度曲線截圖**：playtest 後再做，本次 PRD 不鎖。

   **Answer:**
> 不鎖
