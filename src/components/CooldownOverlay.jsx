import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban } from 'lucide-react';

/**
 * 點錯背景時的冷卻遮罩：畫面淡紅 + 禁止符號 + 文字提示
 *
 * @param {object} props
 * @param {boolean} props.active 是否顯示冷卻
 */
export default function CooldownOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="cooldown"
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-red-500/25" />
          <motion.div
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-black/55 px-6 py-4 text-white shadow-2xl ring-1 ring-white/20"
          >
            <Ban className="h-10 w-10 text-red-300" strokeWidth={2.5} />
            <p className="text-sm font-bold tracking-wide">找錯地方了！</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
