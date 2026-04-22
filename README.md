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
├── constants.js            # 遊戲難度常量（方便微調）
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

同樣在 `src/constants.js`：

| 常量 | 說明 |
| --- | --- |
| `WRONG_CLICK_COOLDOWN` | 點錯背景的冷卻時間（ms） |
| `CHASE_CLICK_COOLDOWN` | 追逐期每次點擊後的短冷卻（ms） |
| `REQUIRED_HITS` | 追逐期需命中幾次才過關 |
| `GAME_DURATION` | 整場倒數秒數 |
| `CHASE_AUTO_MOVE_INTERVAL` | 追逐期自動逃竄頻率（ms） |
| `LITTLE_THING_SIZE_SEARCH` / `LITTLE_THING_SIZE_CHASE` | 兩階段尺寸 |

## 遊戲流程

1. **搜尋期**：背景清晰，小東西隱藏（半透明 + 較小）。點中背景會觸發 1.5 秒紅色冷卻條。
2. **追逐期**：背景模糊，小東西放大顯眼並隨機逃竄。頂部顯示血量條，每次點擊後有 0.5 秒冷卻（半透明不可點）。
3. **結局**：命中 5 次 → 彩帶 + 「抓到我啦！週末請妳吃壽司大餐！」；倒數歸零 → 失敗 Modal 可重玩。
