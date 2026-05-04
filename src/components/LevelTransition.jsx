import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 關卡過場：在兩關之間短暫顯示，由父層負責計時 (~1.2s) 後翻轉 visible。
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {1|2|3} props.levelNumber
 * @param {string} props.levelName  // e.g. LEVELS[idx].name
 * @param {() => void} props.onComplete  // fires once when visible flips true; pass a memoized callback to avoid re-fires on parent re-render
 */
export default function LevelTransition({ visible, levelNumber, levelName, onComplete }) {
  useEffect(() => {
    if (visible && typeof onComplete === 'function') {
      onComplete();
    }
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-center text-white shadow-2xl ring-1 ring-white/20"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <h2 className="mb-3 text-4xl font-extrabold tracking-wide drop-shadow-lg">
              Level {levelNumber}
            </h2>
            <p className="text-xl font-semibold leading-relaxed">{levelName}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
