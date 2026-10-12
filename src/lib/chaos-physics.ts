// Physics for the homepage's floating "chaos" icons: drift, wall bounce, pointer repel

export const CHAOS_ICON_SIZE = 52;
export const CHAOS_BASE_SPEED = 0.6;
export const CHAOS_MAX_SPEED = 6;
export const CHAOS_REPEL_RADIUS = 110;
export const CHAOS_REPEL_FORCE = 0.9;
export const CHAOS_MAX_ROTATION = 20;

const SPEED_EASING = 0.03;
const GRID_COLUMNS = 4;

export interface ChaosIcon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
}

export interface ChaosBounds {
  width: number;
  height: number;
}

export interface ChaosPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function maxPosition(bounds: ChaosBounds): ChaosPoint {
  return {
    x: Math.max(bounds.width - CHAOS_ICON_SIZE, 0),
    y: Math.max(bounds.height - CHAOS_ICON_SIZE, 0),
  };
}

// Spreads icons over a loose grid so they don't overlap at first
export function createIcons(
  count: number,
  bounds: ChaosBounds,
  random: () => number = Math.random,
): ChaosIcon[] {
  const rows = Math.ceil(count / GRID_COLUMNS);
  const cellWidth = bounds.width / GRID_COLUMNS;
  const cellHeight = bounds.height / rows;

  return Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    return {
      x: (i % GRID_COLUMNS) * cellWidth + random() * Math.max(cellWidth - CHAOS_ICON_SIZE, 0),
      y: Math.floor(i / GRID_COLUMNS) * cellHeight + random() * Math.max(cellHeight - CHAOS_ICON_SIZE, 0),
      vx: Math.cos(angle) * CHAOS_BASE_SPEED,
      vy: Math.sin(angle) * CHAOS_BASE_SPEED,
      rotation: random() * 30 - 15,
      spin: (random() - 0.5) * 0.4,
      phase: random() * Math.PI * 2,
    };
  });
}

// Advances one icon by a frame. `pointer` is relative to the area, or null when outside it
export function stepIcon(
  icon: ChaosIcon,
  bounds: ChaosBounds,
  pointer: ChaosPoint | null,
): ChaosIcon {
  let { vx, vy, spin } = icon;

  if (pointer) {
    const dx = icon.x + CHAOS_ICON_SIZE / 2 - pointer.x;
    const dy = icon.y + CHAOS_ICON_SIZE / 2 - pointer.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance < CHAOS_REPEL_RADIUS) {
      const push = ((CHAOS_REPEL_RADIUS - distance) / CHAOS_REPEL_RADIUS) * CHAOS_REPEL_FORCE;
      vx += (dx / distance) * push;
      vy += (dy / distance) * push;
    }
  }

  // Ease back toward a gentle drift after being pushed
  const speed = Math.hypot(vx, vy) || 1;
  const target = Math.min(
    speed * (1 - SPEED_EASING) + CHAOS_BASE_SPEED * SPEED_EASING,
    CHAOS_MAX_SPEED,
  );
  vx = (vx / speed) * target;
  vy = (vy / speed) * target;

  let x = icon.x + vx;
  let y = icon.y + vy;
  const max = maxPosition(bounds);

  // Point velocity away from the wall so a pushed icon can't stick to it
  if (x <= 0 || x >= max.x) {
    vx = x <= 0 ? Math.abs(vx) : -Math.abs(vx);
    x = clamp(x, 0, max.x);
    spin = -spin;
  }
  if (y <= 0 || y >= max.y) {
    vy = y <= 0 ? Math.abs(vy) : -Math.abs(vy);
    y = clamp(y, 0, max.y);
  }

  // Keep rotation subtle
  const rotation = icon.rotation + spin;
  if (Math.abs(rotation) > CHAOS_MAX_ROTATION) spin = -spin;

  return { ...icon, x, y, vx, vy, rotation, spin };
}

// Keeps an icon inside the area after it shrinks
export function clampIcon(icon: ChaosIcon, bounds: ChaosBounds): ChaosIcon {
  const max = maxPosition(bounds);
  return { ...icon, x: clamp(icon.x, 0, max.x), y: clamp(icon.y, 0, max.y) };
}

export function iconTransform(icon: ChaosIcon, time: number): string {
  const scale = 1 + Math.sin(time / 900 + icon.phase) * 0.06;
  return `translate3d(${icon.x}px, ${icon.y}px, 0) rotate(${icon.rotation}deg) scale(${scale})`;
}
