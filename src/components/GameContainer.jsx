import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Search, Timer, Play } from 'lucide-react';

import LittleThing from './LittleThing.jsx';
import ProgressBar from './ProgressBar.jsx';
import CooldownOverlay from './CooldownOverlay.jsx';
import Confetti from './Confetti.jsx';
import ResultModal from './ResultModal.jsx';

import {
  ASSETS,
  CHASE_AUTO_MOVE_INTERVAL,
  CHASE_CLICK_COOLDOWN,
  GAME_DURATION,
  GAME_PHASE,
  LITTLE_THING_SIZE_CHASE,
  LITTLE_THING_SIZE_SEARCH,
  REQUIRED_HITS,
  WRONG_CLICK_COOLDOWN,
} from '../constants.js';
import {
  getRandomPosition,
  getRandomPositionAwayFrom,
} from '../utils/random.js';

// ============================================================
// GameContainer：整個遊戲的大腦
// 負責遊戲階段切換、倒數、冷卻、命中判定與 UI 呈現。
// ============================================================
export default function GameContainer() {
  // ---------- 基礎狀態 ----------
  const [phase, setPhase] = useState(GAME_PHASE.IDLE);
  const [hits, setHits] = useState(0); // 追逐期已命中次數
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION); // 秒

  // 搜尋期「點錯」冷卻
  const [wrongCooldown, setWrongCooldown] = useState(false);
  const [wrongCooldownProgress, setWrongCooldownProgress] = useState(0); // 0~1

  // 追逐期「點擊後」冷卻（小東西變半透明不可點擊）
  const [chaseClickCooldown, setChaseClickCooldown] = useState(false);

  // 小東西位置（以容器像素計算）
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // ---------- Ref ----------
  const containerRef = useRef(null);
  const containerSizeRef = useRef({ w: 0, h: 0 });
  const wrongCooldownTimerRef = useRef(null);
  const wrongCooldownRafRef = useRef(null);
  const chaseCooldownTimerRef = useRef(null);
  const autoMoveTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // ---------- 工具：取得目前小東西尺寸 ----------
  const currentSize = useMemo(
    () =>
      phase === GAME_PHASE.CHASING
        ? LITTLE_THING_SIZE_CHASE
        : LITTLE_THING_SIZE_SEARCH,
    [phase]
  );

  // ---------- 工具：重新量測容器尺寸 ----------
  const measure = useCallback(() => {
    if (!containerRef.current) return { w: 0, h: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    containerSizeRef.current = { w: rect.width, h: rect.height };
    return containerSizeRef.current;
  }, []);

  // ---------- 工具：放置小東西到新位置 ----------
  const relocate = useCallback(
    (awayFromCurrent = false) => {
      const { w, h } = containerSizeRef.current;
      if (w === 0 || h === 0) return;
      const next = awayFromCurrent
        ? getRandomPositionAwayFrom(w, h, currentSize, position)
        : getRandomPosition(w, h, currentSize);
      setPosition(next);
    },
    [currentSize, position]
  );

  // ---------- 清除所有計時器 ----------
  const clearAllTimers = useCallback(() => {
    clearTimeout(wrongCooldownTimerRef.current);
    cancelAnimationFrame(wrongCooldownRafRef.current);
    clearTimeout(chaseCooldownTimerRef.current);
    clearInterval(autoMoveTimerRef.current);
    clearInterval(countdownTimerRef.current);
    wrongCooldownTimerRef.current = null;
    wrongCooldownRafRef.current = null;
    chaseCooldownTimerRef.current = null;
    autoMoveTimerRef.current = null;
    countdownTimerRef.current = null;
  }, []);

  // ---------- 開始遊戲 ----------
  const startGame = useCallback(() => {
    clearAllTimers();
    setHits(0);
    setTimeLeft(GAME_DURATION);
    setWrongCooldown(false);
    setWrongCooldownProgress(0);
    setChaseClickCooldown(false);
    setPhase(GAME_PHASE.SEARCHING);

    // 首次隨機定位
    requestAnimationFrame(() => {
      const { w, h } = measure();
      if (w && h) {
        setPosition(getRandomPosition(w, h, LITTLE_THING_SIZE_SEARCH));
      }
    });
  }, [clearAllTimers, measure]);

  // ---------- 全域倒數 ----------
  useEffect(() => {
    const isPlaying =
      phase === GAME_PHASE.SEARCHING || phase === GAME_PHASE.CHASING;
    if (!isPlaying) return undefined;

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimerRef.current);
  }, [phase]);

  // 倒數歸零 → 失敗
  useEffect(() => {
    if (
      timeLeft === 0 &&
      (phase === GAME_PHASE.SEARCHING || phase === GAME_PHASE.CHASING)
    ) {
      clearAllTimers();
      setPhase(GAME_PHASE.LOSE);
    }
  }, [timeLeft, phase, clearAllTimers]);

  // ---------- 追逐期：每隔一段時間自動逃竄 ----------
  useEffect(() => {
    if (phase !== GAME_PHASE.CHASING) return undefined;
    autoMoveTimerRef.current = setInterval(() => {
      const { w, h } = containerSizeRef.current;
      if (!w || !h) return;
      setPosition((prev) =>
        getRandomPositionAwayFrom(w, h, LITTLE_THING_SIZE_CHASE, prev)
      );
    }, CHASE_AUTO_MOVE_INTERVAL);

    return () => clearInterval(autoMoveTimerRef.current);
  }, [phase]);

  // ---------- 視窗 resize 重新量測 ----------
  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [measure]);

  // ---------- 卸載時清除 ----------
  useEffect(() => clearAllTimers, [clearAllTimers]);

  // ---------- 背景（點錯）點擊處理 ----------
  const handleBackgroundClick = useCallback(() => {
    if (phase !== GAME_PHASE.SEARCHING) return;
    if (wrongCooldown) return;

    setWrongCooldown(true);
    setWrongCooldownProgress(0);

    // 用 requestAnimationFrame 平滑更新進度條
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const ratio = Math.min(elapsed / WRONG_CLICK_COOLDOWN, 1);
      setWrongCooldownProgress(ratio);
      if (ratio < 1) {
        wrongCooldownRafRef.current = requestAnimationFrame(tick);
      }
    };
    wrongCooldownRafRef.current = requestAnimationFrame(tick);

    wrongCooldownTimerRef.current = setTimeout(() => {
      setWrongCooldown(false);
      setWrongCooldownProgress(0);
    }, WRONG_CLICK_COOLDOWN);
  }, [phase, wrongCooldown]);

  // ---------- 觸發追逐期「點擊後」冷卻 ----------
  const triggerChaseCooldown = useCallback(() => {
    setChaseClickCooldown(true);
    clearTimeout(chaseCooldownTimerRef.current);
    chaseCooldownTimerRef.current = setTimeout(() => {
      setChaseClickCooldown(false);
    }, CHASE_CLICK_COOLDOWN);
  }, []);

  // ---------- 點中小東西處理 ----------
  const handleHit = useCallback(() => {
    if (phase === GAME_PHASE.SEARCHING) {
      // 搜尋期 → 進入追逐期
      clearTimeout(wrongCooldownTimerRef.current);
      cancelAnimationFrame(wrongCooldownRafRef.current);
      setWrongCooldown(false);
      setWrongCooldownProgress(0);

      setPhase(GAME_PHASE.CHASING);
      setHits(0); // 追逐期從 0/REQUIRED_HITS 開始

      // 換一個更大尺寸的新位置
      requestAnimationFrame(() => {
        const { w, h } = containerSizeRef.current;
        if (w && h) {
          setPosition(
            getRandomPositionAwayFrom(w, h, LITTLE_THING_SIZE_CHASE, position)
          );
        }
      });

      // 命中後短冷卻（給使用者反應時間）
      triggerChaseCooldown();
      return;
    }

    if (phase === GAME_PHASE.CHASING) {
      if (chaseClickCooldown) return;

      setHits((prev) => {
        const next = prev + 1;
        if (next >= REQUIRED_HITS) {
          clearAllTimers();
          setPhase(GAME_PHASE.WIN);
        }
        return next;
      });

      // 立刻逃竄到新位置
      const { w, h } = containerSizeRef.current;
      if (w && h) {
        setPosition((prev) =>
          getRandomPositionAwayFrom(w, h, LITTLE_THING_SIZE_CHASE, prev, 0.3)
        );
      }

      triggerChaseCooldown();
    }
    // 其他階段（IDLE/WIN/LOSE）忽略
  }, [phase, position, chaseClickCooldown, clearAllTimers, triggerChaseCooldown]);

  // ---------- 衍生狀態 ----------
  const isPlaying =
    phase === GAME_PHASE.SEARCHING || phase === GAME_PHASE.CHASING;
  const isChasing = phase === GAME_PHASE.CHASING;
  const showResult = phase === GAME_PHASE.WIN || phase === GAME_PHASE.LOSE;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="relative h-[100dvh] w-full overflow-hidden select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* 背景圖：👉 替換 ASSETS.BACKGROUND 為你的背景圖 */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-[filter] duration-500 ${
          isChasing ? 'blur-sm brightness-90' : ''
        }`}
        style={{ backgroundImage: `url(${ASSETS.BACKGROUND})` }}
      />
      {/* 半透明壓暗，讓 UI 與小東西更清楚 */}
      <div className="absolute inset-0 bg-black/10" />

      {/* ---------- 頂部 HUD ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold backdrop-blur">
            {isChasing ? (
              <Heart className="h-4 w-4 text-rose-400" />
            ) : (
              <Search className="h-4 w-4 text-sky-300" />
            )}
            <span>{isChasing ? '追逐期' : '搜尋期'}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Timer className="h-4 w-4 text-amber-300" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* 進度條：搜尋期顯示冷卻、追逐期顯示血量（剩餘命中） */}
        {isPlaying && (
          <div className="mt-1">
            {!isChasing ? (
              <ProgressBar
                label={wrongCooldown ? '冷卻中…' : '準備尋找'}
                value={wrongCooldown ? wrongCooldownProgress : 0}
                max={1}
                color="bg-gradient-to-r from-red-500 to-rose-400"
              />
            ) : (
              <ProgressBar
                label="小東西血量"
                value={REQUIRED_HITS - hits}
                max={REQUIRED_HITS}
                color="bg-gradient-to-r from-emerald-400 to-lime-300"
              />
            )}
          </div>
        )}
      </div>

      {/* ---------- 小東西 ---------- */}
      {isPlaying && (
        <LittleThing
          phase={isChasing ? 'chasing' : 'searching'}
          position={position}
          clickable={!chaseClickCooldown && !wrongCooldown}
          onHit={handleHit}
        />
      )}

      {/* ---------- 點錯冷卻遮罩 ---------- */}
      <CooldownOverlay active={wrongCooldown} />

      {/* ---------- 勝利彩帶 ---------- */}
      {phase === GAME_PHASE.WIN && <Confetti count={90} />}

      {/* ---------- 開始畫面 ---------- */}
      <AnimatePresence>
        {phase === GAME_PHASE.IDLE && (
          <motion.div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 px-6 text-center text-white backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1
              className="mb-3 text-4xl font-black tracking-wider drop-shadow-lg"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
            >
              尋找小東西
            </motion.h1>
            <motion.p
              className="mb-8 max-w-xs text-sm leading-relaxed text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              在畫面中找出藏起來的小東西，點中後要在 {GAME_DURATION} 秒內
              <br />
              再追著點中 {REQUIRED_HITS} 下才算贏！
            </motion.p>

            <motion.button
              type="button"
              onClick={startGame}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-8 py-4 text-lg font-bold text-white shadow-xl ring-2 ring-white/30 transition active:scale-95"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring' }}
            >
              <Play className="h-5 w-5 fill-white" strokeWidth={2.5} />
              開始遊戲
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- 結局 Modal ---------- */}
      <ResultModal
        open={showResult}
        result={phase === GAME_PHASE.WIN ? 'win' : 'lose'}
        onRestart={startGame}
      />
    </div>
  );
}
