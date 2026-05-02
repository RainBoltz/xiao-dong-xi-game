# PRD：新增關卡 2、關卡 3（連續闖關 + 誘餌機制）

## Context

`xiao-dong-xi-game`（尋找小東西）目前只有單一 15 秒玩法 — 搜尋期找到小東西 → 追逐期 3 次命中即勝利，難度由 [`src/constants.js`](../../Documents/GIthub/xiao-dong-xi-game/src/constants.js) 集中常量管理，[`GameContainer.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 用 `GAME_PHASE` 列舉做狀態機，目前完全沒有「關卡」概念。

使用者希望加入**兩個難度遞增的新關卡**，讓 1 場遊戲變成 1 → 2 → 3 連續闖關。已與 operator 對齊本次採取最務實的方案：**A + a + b**（連續闖關 + 純參數調 + 引入 1 個新機制 = 誘餌 / 假目標）。沒有進度持久化，任一關失敗整局重來，通關 Level 3 才贏。

## Background & Motivation

- 現行 [`GameContainer.jsx:31-46`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 的狀態：`phase / hits / timeLeft` 三個 state 構成單局生命週期，沒有 `levelIndex`。
- 難度旋鈕已乾淨抽出於 [`constants.js:6-25`](../../Documents/GIthub/xiao-dong-xi-game/src/constants.js)（`WRONG_CLICK_COOLDOWN`、`CHASE_CLICK_COOLDOWN`、`REQUIRED_HITS`、`GAME_DURATION`、`CHASE_AUTO_MOVE_INTERVAL`、`LITTLE_THING_SIZE_*`）— 把這幾個值改成「按關卡查表」就是最低成本擴充。
- 結局沿用 [`ResultModal.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/ResultModal.jsx)，但需加上「過關進入下一關」的中介流程（不關閉整場、保留倒數重置）。
- 新機制「誘餌」可直接 reuse [`LittleThing.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx) — 掛多個 instance、各自獨立 position，藉由 `clickable` + `onHit` 區分真假。

## Goals

- 在現有 3 階段狀態機（IDLE / SEARCHING / CHASING / WIN / LOSE）外，**新增「關卡 (level)」維度**，連續闖關 1 → 2 → 3。
- 提供 3 關難度遞增、可調的數據表：時間↓、命中數↑、自動逃竄↑、追逐期尺寸↓、冷卻↑。
- **新機制：誘餌（Decoy）** — 追逐期額外出現 N 個假的小東西，外觀近似真目標；點到誘餌會觸發懲罰（追加冷卻 + 真目標瞬間遠跳）。
- 關卡 2 = 1 個誘餌；關卡 3 = 2 個誘餌且誘餌也會自動逃竄。
- HUD 增加「Level X / 3」徽章，結局 Modal 區分「過關（下一關）」「全破」「失敗」三種顯示。
- 整體保持手機直式畫面、零後端、無新依賴。

## Non-Goals

- ❌ 進度持久化（localStorage / 帳號）— 失敗即整局從 Level 1 重來。
- ❌ 關卡選單 — 玩家**不能**跳關。
- ❌ 新動畫庫、新音效、新圖示集（沿用 framer-motion + lucide-react）。
- ❌ 自動化測試框架（package.json 目前只有 dev/build/preview，本次不引入 vitest）。
- ❌ 多人 / 排行榜 / 計分。

## Design

### 1. 資料模型：關卡表

擴充 [`src/constants.js`](../../Documents/GIthub/xiao-dong-xi-game/src/constants.js)，把現有 7 個常量改成「關卡查表」。**保留**原常量名作為 Level 1 的值（可向下相容、最小 diff）：

```js
// 新增：關卡總數
export const TOTAL_LEVELS = 3;

// 新增：每關難度設定（index 0 = Level 1）
export const LEVELS = [
  {
    id: 1, label: '關卡 1 · 暖身',
    duration: 15, requiredHits: 3,
    chaseAutoMoveInterval: 900, chaseClickCooldown: 500,
    wrongClickCooldown: 1500,
    sizeSearch: 44, sizeChase: 72,
    decoyCount: 0, decoyAutoMove: false,
    decoyPenaltyMs: 0,
  },
  {
    id: 2, label: '關卡 2 · 真假難辨',
    duration: 13, requiredHits: 4,
    chaseAutoMoveInterval: 700, chaseClickCooldown: 600,
    wrongClickCooldown: 1800,
    sizeSearch: 40, sizeChase: 64,
    decoyCount: 1, decoyAutoMove: false,
    decoyPenaltyMs: 1200,
  },
  {
    id: 3, label: '關卡 3 · 群魔亂舞',
    duration: 11, requiredHits: 5,
    chaseAutoMoveInterval: 550, chaseClickCooldown: 700,
    wrongClickCooldown: 2200,
    sizeSearch: 36, sizeChase: 56,
    decoyCount: 2, decoyAutoMove: true,
    decoyPenaltyMs: 1500,
  },
];
```

> 數值依 playtest 微調，PRD 鎖機制 / 軸向，不鎖具體秒數。

### 2. 狀態機擴充

[`GameContainer.jsx:31-37`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 的 state 新增：

| 新 state | 用途 |
|---|---|
| `levelIndex` (0..2) | 目前關卡 index；`startGame()` 重設為 0，`advanceLevel()` 加 1 |
| `decoys: [{id, x, y}]` | 追逐期額外的假目標座標陣列；長度 = `LEVELS[levelIndex].decoyCount` |

`GAME_PHASE` 新增一個過渡值 `LEVEL_CLEARED`：當前關 hits 達標時不直接進 `WIN`，而是先進 `LEVEL_CLEARED` 顯示「Level X 過關，準備下一關」中介卡 1.5s，然後：
- 若 `levelIndex < TOTAL_LEVELS - 1` → 自動 `advanceLevel()` + 進 `SEARCHING`，倒數依新關卡 `duration` 重置；
- 否則 → `WIN`（全破）。

`LOSE` 條件不變（任一關 timeLeft 歸零即整局失敗）。

### 3. 誘餌（Decoy）機制

新增 [`src/components/Decoy.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/Decoy.jsx)：以 [`LittleThing.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx) 為模板，視覺**幾乎相同**（同樣的圓形 + ring，但 ring 改為 `ring-yellow-300/40`，少一點發光感 — 玩家專注時才看得出差異）。

行為：
- 進入追逐期時，於 [`GameContainer.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 用 [`getRandomPositionAwayFrom`](../../Documents/GIthub/xiao-dong-xi-game/src/utils/random.js#L37) 為每個誘餌產生初始座標（彼此 + 真目標距離 ≥ 0.25 寬）。
- 若關卡 `decoyAutoMove === true`（Level 3），起一個與真目標相同節奏的 `setInterval` 讓誘餌也逃竄。
- 點擊誘餌 → `handleDecoyHit()`：
  1. 觸發追加冷卻（`decoyPenaltyMs`），冷卻期間真目標、誘餌全 `clickable: false`，視覺套用既有 [`CooldownOverlay`](../../Documents/GIthub/xiao-dong-xi-game/src/components/CooldownOverlay.jsx) 的紅色遮罩；
  2. 真目標立即用 `getRandomPositionAwayFrom(..., 0.4)` 跳到遠處（懲罰逃離）；
  3. **不**扣 hits（避免太挫敗），但寶貴的時間被吃掉。

事件冒泡處理：誘餌與真目標的 `onClick` 都要 `stopPropagation`，否則會落到 [`GameContainer.jsx:179`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 的 `handleBackgroundClick` 觸發**雙重**冷卻。沿用 [`LittleThing.jsx:23-28`](../../Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx) 的同樣處理。

### 4. UI 變動

- **頂部 HUD** [`GameContainer.jsx:291-328`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx)：左側 chip 由「搜尋期 / 追逐期」改為兩段式 — 加一個 `Level {n}/3` 徽章。
- **開始畫面** [`GameContainer.jsx:347-387`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx)：副標改成「3 關連續挑戰，難度逐關上升 — 中途失敗整場重來。」
- **過關中介卡**：新元件 [`src/components/LevelCleared.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/LevelCleared.jsx)，1.5s 自動消失。文案：「關卡 {n} 完成！下一關開始…」。可借用 [`ResultModal.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/ResultModal.jsx) 的 motion / 漸層樣式。
- **結局 Modal** [`ResultModal.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/ResultModal.jsx)：`result` prop 維持 `'win' | 'lose'`，但 `win` 文案升級為「全破！週末請妳吃壽司大餐！🍣」（Level 3 通關時觸發；中介關卡用 LevelCleared，不走這裡）。

### 5. 計時器與清理

`clearAllTimers` [`GameContainer.jsx:87-98`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx) 需擴充，把新增的 `decoyAutoMoveTimerRef`、`levelClearedTimerRef`、`decoyPenaltyTimerRef` 一併清掉，避免關卡切換 / 失敗時有殘留 timer 改 state。

`advanceLevel()` 的順序必須是：**先 clearAllTimers → 重設 hits/timeLeft/wrong/chaseClickCooldown → setLevelIndex → 進 SEARCHING → requestAnimationFrame 內重新 measure + 隨機定位**。和目前 [`startGame`](../../Documents/GIthub/xiao-dong-xi-game/src/components/GameContainer.jsx#L101) 的邏輯抽公因式 → `enterLevel(idx)`，`startGame` = `enterLevel(0) + reset levelIndex`。

## Test Plan

專案目前**無自動化測試框架**（[`package.json`](../../Documents/GIthub/xiao-dong-xi-game/package.json) 只有 dev/build/preview）— 本次不引入 vitest，採人工 smoke test：

- **單元層（人工 console 驗證）**：在 `src/__sanity__/levels.js` 暫時 import `LEVELS` 並 console.log，確認 3 關常量值單調遞增 / 遞減；commit 前刪除。
- **互動 smoke 清單**（`npm run dev` 後手機 viewport / DevTools mobile 模擬）：
  1. **Level 1 通關 → Level 2 起手**：3 hit 後跳 LevelCleared 卡 1.5s → 自動進 Level 2，HUD 顯示 `2/3`，倒數重置為 13s。
  2. **Level 2 誘餌懲罰**：點到誘餌 → 全螢幕紅色冷卻遮罩 ~1.2s，期間真目標移到遠處且不可點；冷卻結束後可繼續 hit。
  3. **Level 2 → Level 3**：4 hit 達標 → 進 Level 3，HUD 顯示 `3/3`，2 個誘餌出現且**會自己逃竄**。
  4. **Level 3 全破**：5 hit 達標 → 跳 ResultModal「全破」，文案是壽司大餐版本。
  5. **任一關超時**：故意放著不點到 timeLeft = 0 → ResultModal「小東西跑掉了」，按「重新挑戰」回到 Level 1（不是當前關）。
  6. **背景點錯**：在 Level 2 / 3 仍能觸發 `WRONG_CLICK_COOLDOWN`，且**不**疊加在誘餌懲罰之上（`stopPropagation` 有效）。
  7. **跨關 timer 清理**：在追逐期還沒 hit 完，故意拖到失敗 → 確認新關卡的 `decoyAutoMove`、`decoyPenalty` timer 沒有殘留（rerun 一次 Level 1 觀察是否異常移動）。
- **build 驗證**：`npm run build` 過、bundle size 無顯著膨脹（誘餌組件 < 2 KB gzip）。

## Rollout

- **單一 PR**，所有改動集中：`constants.js`（資料表）、`GameContainer.jsx`（狀態機 + decoys）、新檔 `Decoy.jsx` + `LevelCleared.jsx`、`ResultModal.jsx`（文案）、`README.md`（更新「客製化」段落、補關卡表說明）。
- 無 feature flag — 純前端、無後端依賴、無上線風險。
- merge 後直接 `npm run build` 部署 / 重發 GitHub Pages（若有）。
- 預估 diff：~250 行新增、~30 行修改，1 名 reviewer 30 分鐘內可審完。

## Critical Files

| 檔案 | 變動類型 |
|---|---|
| `src/constants.js` | 修改（新增 `LEVELS` / `TOTAL_LEVELS`，保留舊常量為 Level 1 值） |
| `src/components/GameContainer.jsx` | 修改（新增 `levelIndex` / `decoys` state、`LEVEL_CLEARED` 階段、`enterLevel` / `advanceLevel` / `handleDecoyHit`、HUD Level 徽章、timer 清理擴充） |
| `src/components/Decoy.jsx` | **新檔**（仿 [`LittleThing.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/LittleThing.jsx)，視覺微差） |
| `src/components/LevelCleared.jsx` | **新檔**（中介卡，借用 [`ResultModal.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/ResultModal.jsx) 的 motion / 漸層） |
| `src/components/ResultModal.jsx` | 修改（`win` 文案升級） |
| `README.md` | 修改（更新「微調難度」段，改說 `LEVELS` 表） |

可重用、不需要新寫：
- [`src/utils/random.js`](../../Documents/GIthub/xiao-dong-xi-game/src/utils/random.js) — `getRandomPosition` / `getRandomPositionAwayFrom`，誘餌定位直接用。
- [`src/components/CooldownOverlay.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/CooldownOverlay.jsx) — 誘餌懲罰冷卻沿用同一遮罩。
- [`src/components/ProgressBar.jsx`](../../Documents/GIthub/xiao-dong-xi-game/src/components/ProgressBar.jsx) — 血量條依新 `requiredHits` 自動 scale，不用改。

## Verification

開發完成後依以下順序驗證：

1. `npm install && npm run dev`，瀏覽器開 `http://localhost:5173`、DevTools 切手機模擬（iPhone 14 Pro / 直式）。
2. 跑完上面 Test Plan 的 7 點 smoke 清單，每點截圖 / 錄影附 PR description。
3. `npm run build && npm run preview`，確認 production build 行為一致、無 console error。
4. 在實機（手機瀏覽器）打開 preview URL，驗證觸控響應 — 重點看誘餌 + 真目標的 hit zone 是否會誤判（因為 Level 3 尺寸縮到 56px）。

## Open Questions

1. **誘餌外觀近似度**：誘餌應該「**看起來跟真目標完全一樣**（最刁鑽）」還是「**有一點視覺差異**（例如不同 ring 顏色、不發光）讓玩家學習」？
預設方案採後者（公平 + 教學性）。
2. **誘餌懲罰強度**：目前設計只追加冷卻 + 真目標跳遠，**不**扣 hits。要不要在 Level 3 加碼「點誘餌扣 1 hit（最低 0）」？
好。
3. **Level 3 通關文案升級**：operator 沒指示，目前預設由「壽司大餐」升級為「全破！週末請妳吃壽司大餐！🍣」（加「全破」字樣）。要不要更誇張、加新獎勵（旅行、禮物等）？
好。
4. **過關中介卡時長**：目前抓 1.5s — 太短可能還沒看清楚就跳走、太長破壞節奏感。playtest 後可能需要調 1.0s ~ 2.0s。
好。
5. **Level 2 / Level 3 數值**：PRD 的 duration / requiredHits / interval 是合理起點，**playtest 後幾乎一定會微調**。要不要在 PR 階段就把 1 ~ 2 位非工程的人邀來試玩？
沒關係，直接實作。
6. **失敗時是否顯示「在第 N 關失敗」**：目前 ResultModal 沒這資訊，加上會增加挫敗感但也增加重玩動機。
預設不加。
