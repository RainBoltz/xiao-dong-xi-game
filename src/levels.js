// Per-level tunables. Cross-level constants stay in constants.js.

export const LEVELS = [
  {
    id: 1,
    name: '初次相遇',
    duration: 15,
    requiredHits: 3,
    chaseAutoMoveMs: 900,
    chaseClickCooldownMs: 500,
    wrongClickCooldownMs: 1500,
    littleThingSizeSearch: 44,
    littleThingSizeChase: 72,
    backgroundFilter: '',
    chaseBlur: 'blur-sm',
    decoys: 0,
  },
  {
    id: 2,
    name: '它變狡猾了',
    duration: 14,
    requiredHits: 4,
    chaseAutoMoveMs: 650,
    chaseClickCooldownMs: 550,
    wrongClickCooldownMs: 1700,
    littleThingSizeSearch: 38,
    littleThingSizeChase: 60,
    backgroundFilter: 'brightness-95',
    chaseBlur: 'blur-md',
    decoys: 1,
  },
  {
    id: 3,
    name: '最後一搏',
    duration: 13,
    requiredHits: 5,
    chaseAutoMoveMs: 480,
    chaseClickCooldownMs: 600,
    wrongClickCooldownMs: 2000,
    littleThingSizeSearch: 32,
    littleThingSizeChase: 52,
    backgroundFilter: 'hue-rotate-15 brightness-90',
    chaseBlur: 'blur-lg',
    decoys: 2,
  },
];

export function getLevel(idx) {
  const max = LEVELS.length - 1;
  const clamped = Math.min(Math.max(idx | 0, 0), max);
  return LEVELS[clamped];
}

// Dev sanity: prevent future edits from accidentally emptying the table.
console.assert(LEVELS.length === 3, 'LEVELS must contain exactly 3 entries');
