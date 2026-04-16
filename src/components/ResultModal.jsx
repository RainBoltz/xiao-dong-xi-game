import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, RotateCcw, Heart, Frown } from 'lucide-react';

/**
 * 結局 Modal：勝利 / 失敗兩種模式
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {'win'|'lose'} props.result
 * @param {() => void} props.onRestart
 */
export default function ResultModal({ open, result, onRestart }) {
  const isWin = result === 'win';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* 卡片 */}
          <motion.div
            className={`relative w-full max-w-sm overflow-hidden rounded-3xl p-6 text-center shadow-2xl ring-1 ring-white/20 ${
              isWin
                ? 'bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 text-white'
                : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-100'
            }`}
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="mb-3 flex justify-center">
              {isWin ? (
                <div className="relative">
                  <PartyPopper className="h-14 w-14 drop-shadow-lg" strokeWidth={2} />
                  <Heart
                    className="absolute -right-2 -top-1 h-5 w-5 fill-white text-white"
                    strokeWidth={2}
                  />
                </div>
              ) : (
                <Frown className="h-14 w-14 text-slate-300" strokeWidth={2} />
              )}
            </div>

            <h2 className="mb-2 text-2xl font-extrabold tracking-wide">
              {isWin ? '抓到我啦！' : '小東西跑掉了…'}
            </h2>
            <p className="mb-6 text-base leading-relaxed">
              {isWin
                ? '週末請妳吃壽司大餐！🍣'
                : '這次讓它溜走了，再挑戰一次吧！'}
            </p>

            <button
              type="button"
              onClick={onRestart}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-bold shadow-lg transition active:scale-95 ${
                isWin
                  ? 'bg-white text-rose-500 hover:bg-rose-50'
                  : 'bg-rose-500 text-white hover:bg-rose-400'
              }`}
            >
              <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
              {isWin ? '再玩一次' : '重新挑戰'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
