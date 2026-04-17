import React from 'react';
import GameContainer from './components/GameContainer.jsx';

/**
 * 遊戲根容器：鎖定手機直式比例、全螢幕置中。
 * 在桌機預覽時會居中顯示一個 9:16 的手機框，在手機則完整滿版。
 */
export default function App() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
      {/* 手機模擬外框：桌面預覽時限制寬度，手機端會自動撐滿 */}
      <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-slate-900 shadow-2xl md:my-6 md:h-[min(92dvh,900px)] md:rounded-3xl md:ring-4 md:ring-slate-700">
        <GameContainer />
      </div>
    </div>
  );
}
