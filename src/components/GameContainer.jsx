import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Search, Timer, Play } from 'lucide-react';

import LittleThing from './LittleThing.jsx';
import ProgressBar from './ProgressBar.jsx';
import CooldownOverlay from './CooldownOverlay.jsx';
import Confetti from './Confetti.jsx';
import ResultModal from './ResultModal.jsx';
import LevelTransition from './LevelTransition.jsx';

import { ASSETS, GAME_PHASE } from '../constants.js';
import { LEVELS } from '../levels.js';
import {
  getRandomPosition,
  getRandomPositionAwayFrom,
} from '../utils/random.js';

// ============================================================
// GameContainer：整個遊戲的大腦
// 三關連續挑戰；負責 FSM、倒數、冷卻、命中判定、假目標與 UI 呈現。
// ============================================================
export default function GameContainer() {
  // ---------- 基礎狀態 ----------
  const [phase, setPhase] = useState(GAME_PHASE.IDLE);
  const [hits, setHits] = useState(0); // 追逐期已命中次數
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const [timeLeft, setTimeLeft] = useState(level.duration); // 秒

  // 搜尋期「點錯」冷卻
  const [wrongCooldown, setWrongCooldown] = useState(false);
  const [wrongCooldownProgress, setWrongCooldownProgress] = useState(0); // 0~1

  // 追逐期「點擊後」冷卻（小東西變半透明不可點擊）
  const [chaseClickCooldown, setChaseClickCooldown] = useState(false);

  // 小東西位置（以容器像素計算）
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 假目標：position 列表 + L3 真目標暫時偽裝為 decoy
  const [decoyPositions, setDecoyPositions] = useState([]); // [{id, x, y}]
  const [isFakingDecoy, setIsFakingDecoy] = useState(false);

  // ---------- Ref ----------
  const containerRef = useRef(null);
  const containerSizeRef = useRef({ w: 0, h: 0 });
  const wrongCooldownTimerRef = useRef(null);
  const wrongCooldownRafRef = useRef(null);
  const chaseCooldownTimerRef = useRef(null);
  const autoMoveTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const levelTransitionTimerRef = useRef(null);
  const fakeDecoyTimerRef = useRef(null);
  const fakeDecoyInnerRef = useRef(null);
  const tickCounterRef = useRef(0);

  // ---------- 工具：重新量測容器尺寸 ----------
  const measure = useCallback(() => {
    if (!containerRef.current) return { w: 0, h: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    containerSizeRef.current = { w: rect.width, h: rect.height };
    return containerSizeRef.current;
  }, []);

  // ---------- 清除所有計時器 ----------
  const clearAllTimers = useCallback(() => {
    clearTimeout(wrongCooldownTimerRef.current);
    cancelAnimationFrame(wrongCooldownRafRef.current);
    clearTimeout(chaseCooldownTimerRef.current);
    clearInterval(autoMoveTimerRef.current);
    clearInterval(countdownTimerRef.current);
    clearTimeout(levelTransitionTimerRef.current);
    clearInterval(fakeDecoyTimerRef.current);
    clearTimeout(fakeDecoyInnerRef.current);
    wrongCooldownTimerRef.current = null;
    wrongCooldownRafRef.current = null;
    chaseCooldownTimerRef.current = null;
    autoMoveTimerRef.current = null;
    countdownTimerRef.current = null;
    levelTransitionTimerRef.current = null;
    fakeDecoyTimerRef.current = null;
    fakeDecoyInnerRef.current = null;
    tickCounterRef.current = 0;
  }, []);

  // ---------- 進入指定關卡 ----------
  const enterLevel = useCallback(
    (idx) => {
      clearAllTimers();
      const lvl = LEVELS[idx];
      setHits(0);
      setTimeLeft(lvl.duration);
      setWrongCooldown(false);
      setWrongCooldownProgress(0);
      setChaseClickCooldown(false);
      setIsFakingDecoy(false);
      setDecoyPositions([]);
      setLevelIndex(idx);
      setPhase(GAME_PHASE.SEARCHING);

      requestAnimationFrame(() => {
        const { w, h } = measure();
        if (w && h) {
          setPosition(getRandomPosition(w, h, lvl.littleThingSizeSearch));
        }
      });
    },
    [clearAllTimers, measure]
  );

  // ---------- 開始遊戲（從 L1） ----------
  const startGame = useCallback(() => enterLevel(0), [enterLevel]);

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

  // ---------- 追逐期：統一 tick 自動逃竄（真目標 + 假目標 1.4 倍週期） ----------
  useEffect(() => {
    if (phase !== GAME_PHASE.CHASING) return undefined;
    tickCounterRef.current = 0;
    autoMoveTimerRef.current = setInterval(() => {
      const { w, h } = containerSizeRef.current;
      if (!w || !h) return;
      tickCounterRef.current += 1;

      setPosition((prev) =>
        getRandomPositionAwayFrom(w, h, level.littleThingSizeChase, prev)
      );

      // 假目標移動：每 7 tick 動 5 次（平均週期 1.4×）。
      if ((tickCounterRef.current * 5) % 7 < 5) {
        setDecoyPositions((prev) =>
          prev.map((d) => {
            const next = getRandomPositionAwayFrom(
              w,
              h,
              level.littleThingSizeChase,
              d,
              0.2
            );
            return { ...d, ...next };
          })
        );
      }
    }, level.chaseAutoMoveMs);

    return () => clearInterval(autoMoveTimerRef.current);
  }, [phase, level.chaseAutoMoveMs, level.littleThingSizeChase]);

  // ---------- L3：真目標短暫卸下光環，混入假目標群 ----------
  useEffect(() => {
    if (phase !== GAME_PHASE.CHASING) return undefined;
    if (levelIndex !== 2) return undefined;
    fakeDecoyTimerRef.current = setInterval(() => {
      setIsFakingDecoy(true);
      fakeDecoyInnerRef.current = setTimeout(() => setIsFakingDecoy(false), 400);
    }, 2500);
    return () => {
      clearInterval(fakeDecoyTimerRef.current);
      clearTimeout(fakeDecoyInnerRef.current);
    };
  }, [phase, levelIndex]);

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

    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const ratio = Math.min(elapsed / level.wrongClickCooldownMs, 1);
      setWrongCooldownProgress(ratio);
      if (ratio < 1) {
        wrongCooldownRafRef.current = requestAnimationFrame(tick);
      }
    };
    wrongCooldownRafRef.current = requestAnimationFrame(tick);

    wrongCooldownTimerRef.current = setTimeout(() => {
      setWrongCooldown(false);
      setWrongCooldownProgress(0);
    }, level.wrongClickCooldownMs);
  }, [phase, wrongCooldown, level.wrongClickCooldownMs]);

  // ---------- 觸發追逐期「點擊後」冷卻 ----------
  const triggerChaseCooldown = useCallback(() => {
    setChaseClickCooldown(true);
    clearTimeout(chaseCooldownTimerRef.current);
    chaseCooldownTimerRef.current = setTimeout(() => {
      setChaseClickCooldown(false);
    }, level.chaseClickCooldownMs);
  }, [level.chaseClickCooldownMs]);

  // ---------- 假目標多錨點配置 ----------
  const placeDecoys = useCallback((targetPos, count, w, h, size) => {
    const out = [];
    const minDist = w * 0.25;
    for (let i = 0; i < count; i += 1) {
      let candidate = getRandomPosition(w, h, size);
      let attempts = 0;
      while (attempts < 12) {
        const farFromTarget =
          Math.hypot(candidate.x - targetPos.x, candidate.y - targetPos.y) >= minDist;
        const farFromOthers = out.every(
          (d) => Math.hypot(candidate.x - d.x, candidate.y - d.y) >= minDist
        );
        if (farFromTarget && farFromOthers) break;
        candidate = getRandomPosition(w, h, size);
        attempts += 1;
      }
      out.push({ id: i, ...candidate });
    }
    return out;
  }, []);

  // ---------- 點中真目標處理 ----------
  const handleHit = useCallback(() => {
    if (phase === GAME_PHASE.SEARCHING) {
      // 搜尋期 → 進入追逐期
      clearTimeout(wrongCooldownTimerRef.current);
      cancelAnimationFrame(wrongCooldownRafRef.current);
      setWrongCooldown(false);
      setWrongCooldownProgress(0);

      setPhase(GAME_PHASE.CHASING);
      setHits(0);

      requestAnimationFrame(() => {
        const { w, h } = containerSizeRef.current;
        if (w && h) {
          const target = getRandomPositionAwayFrom(
            w,
            h,
            level.littleThingSizeChase,
            position
          );
          setPosition(target);
          setDecoyPositions(
            placeDecoys(target, level.decoys, w, h, level.littleThingSizeChase)
          );
        }
      });

      triggerChaseCooldown();
      return;
    }

    if (phase === GAME_PHASE.CHASING) {
      if (chaseClickCooldown) return;

      setHits((prev) => {
        const next = prev + 1;
        if (next >= level.requiredHits) {
          clearAllTimers();
          if (levelIndex === LEVELS.length - 1) {
            setPhase(GAME_PHASE.WIN);
          } else {
            setPhase(GAME_PHASE.LEVEL_TRANSITION);
            levelTransitionTimerRef.current = setTimeout(() => {
              enterLevel(levelIndex + 1);
            }, 1200);
          }
        }
        return next;
      });

      const { w, h } = containerSizeRef.current;
      if (w && h) {
        setPosition((prev) =>
          getRandomPositionAwayFrom(w, h, level.littleThingSizeChase, prev, 0.3)
        );
      }

      triggerChaseCooldown();
    }
    // 其他階段（IDLE/LEVEL_TRANSITION/WIN/LOSE）忽略
  }, [
    phase,
    position,
    chaseClickCooldown,
    clearAllTimers,
    triggerChaseCooldown,
    level.littleThingSizeChase,
    level.requiredHits,
    level.decoys,
    levelIndex,
    enterLevel,
    placeDecoys,
  ]);

  // ---------- 點到假目標處理 ----------
  const handleDecoyHit = useCallback(() => {
    if (chaseClickCooldown || wrongCooldown) return;
    // 罰時 -1.5s（不會低於 0；timeLeft===0 由現有 effect 觸發 LOSE）
    setTimeLeft((t) => Math.max(0, t - 1.5));

    // 重用點錯紅條視覺
    setWrongCooldown(true);
    setWrongCooldownProgress(0);
    const start = performance.now();
    const tick = (now) => {
      const ratio = Math.min((now - start) / level.wrongClickCooldownMs, 1);
      setWrongCooldownProgress(ratio);
      if (ratio < 1) wrongCooldownRafRef.current = requestAnimationFrame(tick);
    };
    wrongCooldownRafRef.current = requestAnimationFrame(tick);
    wrongCooldownTimerRef.current = setTimeout(() => {
      setWrongCooldown(false);
      setWrongCooldownProgress(0);
    }, level.wrongClickCooldownMs);
    // 注意：不增加 hits
  }, [chaseClickCooldown, wrongCooldown, level.wrongClickCooldownMs]);

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
      {/* 背景圖：每關套用不同 filter / blur */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-[filter] duration-500 ${
          isChasing ? level.chaseBlur : level.backgroundFilter
        }`}
        style={{ backgroundImage: `url(${ASSETS.BACKGROUND})` }}
      />
      <div className="absolute inset-0 bg-black/10" />

      {/* ---------- 頂部 HUD ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold backdrop-blur">
              <span>
                Level {levelIndex + 1}/{LEVELS.length}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold backdrop-blur">
              {isChasing ? (
                <Heart className="h-4 w-4 text-rose-400" />
              ) : (
                <Search className="h-4 w-4 text-sky-300" />
              )}
              <span>{isChasing ? '追逐期' : '搜尋期'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold backdrop-blur">
            <Timer className="h-4 w-4 text-amber-300" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* 進度條 */}
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
                value={level.requiredHits - hits}
                max={level.requiredHits}
                color="bg-gradient-to-r from-emerald-400 to-lime-300"
              />
            )}
          </div>
        )}
      </div>

      {/* ---------- 真目標 ---------- */}
      {isPlaying && (
        <LittleThing
          phase={isChasing ? 'chasing' : 'searching'}
          position={position}
          clickable={!chaseClickCooldown && !wrongCooldown}
          isDecoy={isFakingDecoy}
          onHit={handleHit}
        />
      )}

      {/* ---------- 假目標 ---------- */}
      {isPlaying &&
        isChasing &&
        decoyPositions.map((d) => (
          <LittleThing
            key={`decoy-${d.id}`}
            phase="chasing"
            position={{ x: d.x, y: d.y }}
            clickable={!chaseClickCooldown && !wrongCooldown}
            isDecoy
            onHit={handleDecoyHit}
          />
        ))}

      {/* ---------- 點錯冷卻遮罩 ---------- */}
      <CooldownOverlay active={wrongCooldown} />

      {/* ---------- 勝利彩帶 ---------- */}
      {phase === GAME_PHASE.WIN && <Confetti count={90} />}

      {/* ---------- 關卡切換動畫 ---------- */}
      <AnimatePresence>
        {phase === GAME_PHASE.LEVEL_TRANSITION &&
          levelIndex + 1 < LEVELS.length && (
            <LevelTransition
              levelNumber={levelIndex + 2}
              levelName={LEVELS[levelIndex + 1].name}
            />
          )}
      </AnimatePresence>

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
              3 關連續挑戰，難度逐關上升 — 中途失敗整場重來。
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
        clearedFinalLevel={phase === GAME_PHASE.WIN}
        onRestart={startGame}
      />
    </div>
  );
}
