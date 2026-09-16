import { G } from "./constants";
import type { Body } from "./types";

const ax: number[] = [];
const ay: number[] = [];

function softening(a: Body, b: Body): number {
  return Math.max(10, 0.38 * (a.radius + b.radius));
}

export function computeAccelerations(bodies: Body[]): void {
  const n = bodies.length;
  while (ax.length < n) ax.push(0);
  while (ay.length < n) ay.push(0);

  for (let i = 0; i < n; i++) {
    ax[i] = 0;
    ay[i] = 0;
  }

  for (let i = 0; i < n; i++) {
    const a = bodies[i]!;
    for (let j = i + 1; j < n; j++) {
      const b = bodies[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const r2 = dx * dx + dy * dy;
      const eps = softening(a, b);
      const inv = 1 / (r2 + eps * eps);
      const inv3 = inv * Math.sqrt(inv);
      const s = G * inv3;
      const fx = dx * s;
      const fy = dy * s;
      ax[i]! += fx * b.mass;
      ay[i]! += fy * b.mass;
      ax[j]! -= fx * a.mass;
      ay[j]! -= fy * a.mass;
    }
  }
}

export function leapfrog(bodies: Body[], dt: number): void {
  const n = bodies.length;
  if (n === 0) return;
  computeAccelerations(bodies);
  const half = dt * 0.5;
  for (let i = 0; i < n; i++) {
    const b = bodies[i]!;
    b.vx += ax[i]! * half;
    b.vy += ay[i]! * half;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  computeAccelerations(bodies);
  for (let i = 0; i < n; i++) {
    const b = bodies[i]!;
    b.vx += ax[i]! * half;
    b.vy += ay[i]! * half;
  }
}

export function circularVelocity(
  host: { x: number; y: number; vx: number; vy: number; mass: number },
  x: number,
  y: number,
  clockwise = true,
): { vx: number; vy: number } {
  const dx = x - host.x;
  const dy = y - host.y;
  const r = Math.hypot(dx, dy) || 1;
  const speed = Math.sqrt((G * host.mass) / r);
  const nx = dx / r;
  const ny = dy / r;
  const tx = clockwise ? -ny : ny;
  const ty = clockwise ? nx : -nx;
  return { vx: host.vx + tx * speed, vy: host.vy + ty * speed };
}

export function binaryOrbitalVelocities(
  a: { x: number; y: number; mass: number },
  b: { x: number; y: number; mass: number },
): { va: { vx: number; vy: number }; vb: { vx: number; vy: number } } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d;
  const ny = dy / d;
  const tx = -ny;
  const ty = nx;
  const total = a.mass + b.mass;
  const ra = (d * b.mass) / total;
  const rb = (d * a.mass) / total;
  const omega = Math.sqrt((G * total) / (d * d * d));
  return {
    va: { vx: -tx * omega * ra, vy: -ty * omega * ra },
    vb: { vx: tx * omega * rb, vy: ty * omega * rb },
  };
}
