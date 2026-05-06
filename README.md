# 尋找小東西 🔍

一款為手機直式螢幕打造的互動式網頁小遊戲。在滿版背景中找出藏起來的「小東西」，點中後追著它跑，限時內命中 5 次就能贏得壽司大餐！

## 技術堆疊

- **React 18** (Hooks)
- **Vite** 開發與打包
- **Tailwind CSS** 樣式
- **Framer Motion** 平滑逃竄與縮放動畫
- **Lucide-react** 圖示

## 開發指令

```bash
npm install   # 安裝依賴
npm run dev   # 啟動本地開發伺服器 (預設 http://localhost:5173)
npm run build # 正式打包
npm run preview # 預覽打包結果
```

## 目錄結構

```
src/
├── App.jsx                 # 根容器（手機框）
├── main.jsx                # React 入口
├── index.css               # 全域樣式 + Tailwind 指令
├── constants.js            # 全域常量（階段、資產、共用邊距）
├── levels.js               # 每關獨立難度設定
├── utils/
│   └── random.js           # 隨機座標工具
└── components/
    ├── GameContainer.jsx   # 遊戲主邏輯（階段、倒數、命中、冷卻）
    ├── LittleThing.jsx     # 小東西（可點擊、會逃竄）
    ├── ProgressBar.jsx     # 通用進度條（冷卻 / 血量）
    ├── CooldownOverlay.jsx # 點錯冷卻遮罩
    ├── Confetti.jsx        # 勝利彩帶特效
    └── ResultModal.jsx     # 勝利 / 失敗結局 Modal
```

## 客製化

### 替換圖片

在 `src/constants.js` 的 `ASSETS` 中替換：

- `BACKGROUND`：滿版背景圖（建議直式 1080×1920）
- `LITTLE_THING`：個人照片（建議正方形，圓形裁切效果最好）

### 微調難度

#### 每關獨立的難度旋鈕（`src/levels.js`）

每關 (`L1` / `L2` / `L3`) 各自一組欄位，調整單一關卡只需改對應 key，不會影響其它關。

| 欄位 | 說明 |
| --- | --- |
| `duration` | 該關倒數秒數 |
| `requiredHits` | 該關需命中真目標的次數 |
| `wrongClickCooldown` | 點錯背景的冷卻時間（ms） |
| `chaseClickCooldown` | 追逐每次點擊後的短冷卻（ms） |
| `chaseAutoMoveInterval` | 追逐期自動逃竄頻率（ms） |
| `sizeSearch` / `sizeChase` | 搜尋期 / 追逐期小東西尺寸（px） |
| `decoyCount` | 假目標（decoy）數量；L1 為 0、L2/L3 才會出現 |
| `decoyAutoMove` | 假目標是否會自動位移 |
| `decoyPenaltyMs` | 點到假目標時觸發的懲罰冷卻（ms） |

> ℹ️ `src/levels.js` 是把每關旋鈕從 `src/constants.js` 拆出來的新檔案；若你 pull 下來的版本仍把 `LEVELS` 放在 `constants.js`，請以該檔案的實際 export 為準。

#### 全域常量（`src/constants.js`）

下列設定跨關共用，住在 `src/constants.js`：

- `SAFE_MARGIN`：所有關卡共用的安全邊距比例（避免小東西貼邊）。
- `GAME_PHASE`：階段列舉（`idle` / `level_transition` / `playing` / `win` / `lose`），跨關共用。
- `ASSETS`：背景與小東西圖檔，整個遊戲共用（見上方「替換圖片」）。
- `CHASE_MOVE_DURATION`：移動動畫長度，所有關卡共用視覺手感。

## 遊戲流程

1. **L1 初次相遇**：背景清晰，小東西半透明且尺寸較小。點中背景觸發 1.5 秒紅色冷卻條；命中目標即進入下一關。
2. **L2 它變狡猾了**：背景開始模糊，小東西放大並隨機逃竄；同時出現會干擾視線的「假目標」（decoy），點到假目標一樣會觸發冷卻。
3. **L3 最後一搏**：難度上限──移動更快、假目標更多，命中需求最高，限時內擊中真正的小東西即勝利。

- **關卡切換**：每兩關之間會插入 `LEVEL_TRANSITION` 中場卡，提示玩家接下來的難度與規則變化。
- **失敗判定**：任何一關時間歸零或血量耗盡都會回到 L1 重新開始（不接續關卡）。
