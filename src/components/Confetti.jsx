import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * 全螢幕 Confetti 慶祝特效：用隨機色塊 + Framer Motion 掉落動畫。
 *
 * @param {object} props
 * @param {number} [props.count=80] 粒子數量
 */
export default function Confetti({ count = 80 }) {
  const pieces = useMemo(() => {
    const colors = [
      'bg-pink-400',
      'bg-yellow-300',
      'bg-emerald-400',
      'bg-sky-400',
      'bg-purple-400',
      'bg-orange-400',
      'bg-red-400',
    ];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.8,
      rotate: Math.random() * 720 - 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.floor(Math.random() * 8),
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute block rounded-sm ${p.color}`}
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.45,
          }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 1, 1, 0.9],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}
