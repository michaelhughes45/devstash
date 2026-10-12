import { describe, expect, it } from "vitest";

import {
  CHAOS_BASE_SPEED,
  CHAOS_ICON_SIZE,
  CHAOS_MAX_SPEED,
  CHAOS_REPEL_RADIUS,
  clampIcon,
  createIcons,
  stepIcon,
  type ChaosIcon,
} from "./chaos-physics";

const BOUNDS = { width: 400, height: 300 };
const MAX_X = BOUNDS.width - CHAOS_ICON_SIZE;
const MAX_Y = BOUNDS.height - CHAOS_ICON_SIZE;
const WIDE = { width: 10_000, height: 10_000 };

function icon(overrides: Partial<ChaosIcon> = {}): ChaosIcon {
  return { x: 100, y: 100, vx: 0, vy: 0, rotation: 0, spin: 0.1, phase: 0, ...overrides };
}

function speedOf(state: ChaosIcon): number {
  return Math.hypot(state.vx, state.vy);
}

describe("stepIcon", () => {
  it("bounces off the left wall and clamps the position", () => {
    const next = stepIcon(icon({ x: 0.2, vx: -0.6 }), BOUNDS, null);
    expect(next.x).toBe(0);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.spin).toBe(-0.1);
  });

  it("bounces off the right wall and clamps the position", () => {
    const next = stepIcon(icon({ x: MAX_X - 0.2, vx: 0.6 }), BOUNDS, null);
    expect(next.x).toBe(MAX_X);
    expect(next.vx).toBeLessThan(0);
  });

  it("bounces off the top wall and clamps the position", () => {
    const next = stepIcon(icon({ y: 0.2, vy: -0.6 }), BOUNDS, null);
    expect(next.y).toBe(0);
    expect(next.vy).toBeGreaterThan(0);
  });

  it("bounces off the bottom wall and clamps the position", () => {
    const next = stepIcon(icon({ y: MAX_Y - 0.2, vy: 0.6 }), BOUNDS, null);
    expect(next.y).toBe(MAX_Y);
    expect(next.vy).toBeLessThan(0);
  });

  it("points velocity away from a wall the icon is already past", () => {
    // Pushed past the wall while already moving away: must keep moving away, not flip back
    const next = stepIcon(icon({ x: -5, vx: 2 }), BOUNDS, null);
    expect(next.x).toBe(0);
    expect(next.vx).toBeGreaterThan(0);
  });

  it("pushes an icon away from a nearby pointer", () => {
    const start = icon({ x: 1000, y: 1000, vx: 0, vy: CHAOS_BASE_SPEED });
    const center = start.x + CHAOS_ICON_SIZE / 2;
    // Pointer just left of the icon's center
    const next = stepIcon(start, WIDE, { x: center - 20, y: start.y + CHAOS_ICON_SIZE / 2 });
    expect(next.vx).toBeGreaterThan(0);
    expect(next.x).toBeGreaterThan(start.x);
  });

  it("ignores a pointer outside the repel radius", () => {
    const start = icon({ x: 1000, y: 1000, vx: 0.3, vy: 0.4 });
    const far = { x: start.x - CHAOS_REPEL_RADIUS * 2, y: start.y };
    expect(stepIcon(start, WIDE, far)).toEqual(stepIcon(start, WIDE, null));
  });

  it("eases a fast icon back toward the base speed", () => {
    const start = icon({ x: 1000, y: 1000, vx: 3, vy: 0 });
    const next = stepIcon(start, WIDE, null);
    expect(speedOf(next)).toBeLessThan(3);
    expect(speedOf(next)).toBeGreaterThan(CHAOS_BASE_SPEED);
  });

  it("eases a slow icon up toward the base speed", () => {
    const start = icon({ x: 1000, y: 1000, vx: 0.2, vy: 0 });
    const next = stepIcon(start, WIDE, null);
    expect(speedOf(next)).toBeGreaterThan(0.2);
    expect(speedOf(next)).toBeLessThan(CHAOS_BASE_SPEED);
  });

  it("never exceeds the max speed", () => {
    let state = icon({ x: 5000, y: 5000, vx: 50, vy: 50 });
    expect(speedOf(stepIcon(state, WIDE, null))).toBeLessThanOrEqual(CHAOS_MAX_SPEED);

    // Repeated pushes from a pointer on the icon's center
    for (let i = 0; i < 50; i++) {
      state = stepIcon(state, WIDE, { x: state.x + CHAOS_ICON_SIZE / 2 + 1, y: state.y + CHAOS_ICON_SIZE / 2 });
      expect(speedOf(state)).toBeLessThanOrEqual(CHAOS_MAX_SPEED + 1e-9);
    }
  });

  it("reverses the spin once rotation passes the limit", () => {
    const next = stepIcon(icon({ rotation: 19.95, spin: 0.1 }), WIDE, null);
    expect(next.rotation).toBeCloseTo(20.05);
    expect(next.spin).toBe(-0.1);
  });
});

describe("createIcons", () => {
  it("places every icon inside the area", () => {
    const icons = createIcons(8, BOUNDS, () => 0.999);
    expect(icons).toHaveLength(8);
    for (const state of icons) {
      expect(state.x).toBeGreaterThanOrEqual(0);
      expect(state.x).toBeLessThanOrEqual(MAX_X);
      expect(state.y).toBeGreaterThanOrEqual(0);
      expect(state.y).toBeLessThanOrEqual(MAX_Y);
      expect(speedOf(state)).toBeCloseTo(CHAOS_BASE_SPEED);
    }
  });
});

describe("clampIcon", () => {
  it("pulls an icon back inside a smaller area", () => {
    const next = clampIcon(icon({ x: 900, y: 700 }), BOUNDS);
    expect(next.x).toBe(MAX_X);
    expect(next.y).toBe(MAX_Y);
  });
});
