import React from 'react';
import { motion } from 'framer-motion';

/**
 * 進度條元件（用於冷卻條、血量條、倒數條）
 *
 * @param {object} props
 * @param {number} props.value        目前值 (0 ~ max)
 * @param {number} props.max          最大值
 * @param {string} props.color        Tailwind 顏色 class，例如 'bg-red-500'
 * @param {string} [props.label]      進度條左側文字
 * @param {string} [props.trackClass] 背景軌道 class
 * @param {boolean}[props.reverse]    是否反向（從滿到空）
 */
export default function ProgressBar({
  value,
  max,
  color = 'bg-red-500',
  label,
  trackClass = 'bg-white/20',
  reverse = false,
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const ratio = max === 0 ? 0 : clamped / max;
  const percent = (reverse ? 1 - ratio : ratio) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white drop-shadow">
          <span>{label}</span>
          <span>
            {Math.ceil(clamped)}/{max}
          </span>
        </div>
      )}
      <div
        className={`h-3 w-full overflow-hidden rounded-full ${trackClass} ring-1 ring-white/40 backdrop-blur-sm`}
      >
        <motion.div
          className={`h-full rounded-full ${color} shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
        />
      </div>
    </div>
  );
}
