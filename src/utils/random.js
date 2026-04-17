// ============================================================
// 隨機座標工具：取得在容器內、避免貼邊的安全隨機位置
// ============================================================

import { SAFE_MARGIN } from '../constants.js';

/**
 * 產生在容器內的隨機 (x, y) 像素座標。
 * @param {number} containerWidth  容器寬度 (px)
 * @param {number} containerHeight 容器高度 (px)
 * @param {number} itemSize        物件尺寸 (px)，用於扣除避免溢出
 * @returns {{ x: number, y: number }}
 */
export function getRandomPosition(containerWidth, containerHeight, itemSize) {
  const marginX = containerWidth * SAFE_MARGIN;
  const marginY = containerHeight * SAFE_MARGIN;

  const minX = marginX;
  const maxX = containerWidth - itemSize - marginX;
  const minY = marginY;
  const maxY = containerHeight - itemSize - marginY;

  const x = Math.random() * (maxX - minX) + minX;
  const y = Math.random() * (maxY - minY) + minY;

  return { x, y };
}

/**
 * 產生「遠離目前位置」的新隨機座標，避免逃竄看起來太近。
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @param {number} itemSize
 * @param {{ x: number, y: number }} currentPos
 * @param {number} minDistanceRatio 距離容器寬度的最小比例 (0~1)
 */
export function getRandomPositionAwayFrom(
  containerWidth,
  containerHeight,
  itemSize,
  currentPos,
  minDistanceRatio = 0.25
) {
  const minDistance = containerWidth * minDistanceRatio;
  let next = getRandomPosition(containerWidth, containerHeight, itemSize);
  let attempts = 0;
  while (
    Math.hypot(next.x - currentPos.x, next.y - currentPos.y) < minDistance &&
    attempts < 8
  ) {
    next = getRandomPosition(containerWidth, containerHeight, itemSize);
    attempts += 1;
  }
  return next;
}
