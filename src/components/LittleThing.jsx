import React from 'react';
import { motion } from 'framer-motion';
import {
  ASSETS,
  CHASE_MOVE_DURATION,
  LITTLE_THING_SIZE_CHASE,
  LITTLE_THING_SIZE_SEARCH,
} from '../constants.js';

/**
 * 「小東西」組件：搜尋期靜止隱藏；追逐期會隨機逃竄。
 *
 * @param {object} props
 * @param {'searching'|'chasing'} props.phase
 * @param {{ x: number, y: number }} props.position 當前像素座標
 * @param {boolean} props.clickable  是否可點擊（追逐期冷卻中會變 false）
 * @param {() => void} props.onHit   點中時的回呼
 */
export default function LittleThing({ phase, position, clickable, onHit }) {
  const isChasing = phase === 'chasing';
  const size = isChasing ? LITTLE_THING_SIZE_CHASE : LITTLE_THING_SIZE_SEARCH;

  const handleClick = (e) => {
    // 阻止事件冒泡到底層背景（避免觸發點錯冷卻）
    e.stopPropagation();
    if (!clickable) return;
    onHit?.();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onTouchStart={handleClick}
      className="absolute z-20 flex items-center justify-center rounded-full p-0"
      style={{
        width: size,
        height: size,
        // 透過 Framer Motion 的 animate 控制位移，這裡先設為 0
        left: 0,
        top: 0,
        pointerEvents: clickable ? 'auto' : 'none',
      }}
      animate={{
        x: position.x,
        y: position.y,
        opacity: clickable ? 1 : 0.35,
        scale: isChasing ? [1, 1.08, 1] : 1,
      }}
      transition={{
        x: {
          type: 'spring',
          stiffness: isChasing ? 180 : 260,
          damping: isChasing ? 18 : 30,
          duration: CHASE_MOVE_DURATION,
        },
        y: {
          type: 'spring',
          stiffness: isChasing ? 180 : 260,
          damping: isChasing ? 18 : 30,
          duration: CHASE_MOVE_DURATION,
        },
        opacity: { duration: 0.2 },
        scale: {
          duration: 0.8,
          repeat: isChasing ? Infinity : 0,
          ease: 'easeInOut',
        },
      }}
      whileTap={clickable ? { scale: 0.85 } : undefined}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-full ring-2 ${
          isChasing
            ? 'ring-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]'
            : 'ring-white/40'
        }`}
        style={{
          // 搜尋期降低不透明度讓人需要「找」，追逐期完全顯現
          opacity: isChasing ? 1 : 0.78,
        }}
      >
        {/* 👉 替換這個 src 為你的個人照片（建議正方形或去背） */}
        <img
          src={ASSETS.LITTLE_THING}
          alt="小東西"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    </motion.button>
  );
}
