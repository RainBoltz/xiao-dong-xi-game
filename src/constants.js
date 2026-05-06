// ============================================================
// 遊戲常量設定：集中管理難度與時間，方便日後微調
// ============================================================

// 小東西在追逐期移動一次的動畫時間（秒）
export const CHASE_MOVE_DURATION = 0.55;

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
