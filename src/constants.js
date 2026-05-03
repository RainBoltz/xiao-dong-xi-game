// ============================================================
// 遊戲常量設定：集中管理難度與時間，方便日後微調
// ============================================================

// 階段一（搜尋期）點錯背景的冷卻時間（毫秒）
export const WRONG_CLICK_COOLDOWN = 1500;

// 階段二（追逐期）每次點擊小東西後的短冷卻（毫秒）
export const CHASE_CLICK_COOLDOWN = 500;

// 追逐期需要命中幾次才能過關
export const REQUIRED_HITS = 5;

// 整場遊戲的總倒數秒數（失敗判定）
export const GAME_DURATION = 15;

// 小東西在追逐期移動一次的動畫時間（秒）
export const CHASE_MOVE_DURATION = 0.55;

// 小東西在追逐期每次自動逃竄的間隔（毫秒）
export const CHASE_AUTO_MOVE_INTERVAL = 900;

// 小東西尺寸（px）：搜尋期較小、追逐期較大便於點擊
export const LITTLE_THING_SIZE_SEARCH = 44;
export const LITTLE_THING_SIZE_CHASE = 72;

// 小東西初始隨機位置的邊距比例（避免貼邊）
export const SAFE_MARGIN = 0.08;

// 遊戲階段列舉
export const GAME_PHASE = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  CHASING: 'chasing',
  WIN: 'win',
  LOSE: 'lose',
};

// 圖片資源：請替換為你自己的路徑
export const ASSETS = {
  // 👉 替換為你喜歡的背景圖（建議直式、1080x1920 以上）
  BACKGROUND: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
  // 👉 替換為你的個人照片（建議正方形、透明背景或圓形裁切）
  LITTLE_THING: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=xiaodongxi&backgroundColor=ffdfbf',
};

// 新增：關卡總數
export const TOTAL_LEVELS = 3;

// 新增：每關難度設定（index 0 = Level 1）
// Level 1 的值刻意與檔案上方的單值常量（WRONG_CLICK_COOLDOWN 等）保持一致 —
// 舊呼叫端先沿用單值常量，新流程改讀 LEVELS[levelIndex]。
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
