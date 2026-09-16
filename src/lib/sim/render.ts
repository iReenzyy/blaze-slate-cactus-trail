import { TRAIL_CAP, type AimState, type Body, type Camera, type Particle } from "./types";
import { hexToRgb } from "./constants";

type Star = { x: number; y: number; r: number; a: number; layer: number };

let stars: Star[] = [];
let starsW = 0;
let starsH = 0;

function ensureStars(w: number, h: number): void {
  if (stars.length && starsW === w && starsH === h) return;
  starsW = w;
  starsH = h;
  const count = Math.floor((w * h) / 14000);
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.12 ? 1.2 + Math.random() * 1.1 : 0.4 + Math.random() * 0.7,
      a: 0.22 + Math.random() * 0.7,
      layer: Math.random() < 0.35 ? 0 : Math.random() < 0.6 ? 1 : 2,
    });
  }
}

function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function worldToScreen(
  x: number,
  y: number,
  cam: Camera,
  w: number,
  h: number,
): { x: number; y: number } {
  return {
    x: (x - cam.x) * cam.zoom + w * 0.5,
    y: (y - cam.y) * cam.zoom + h * 0.5,
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  cam: Camera,
  w: number,
  h: number,
): { x: number; y: number } {
  return {
    x: cam.x + (sx - w * 0.5) / cam.zoom,
    y: cam.y + (sy - h * 0.5) / cam.zoom,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number): void {
  const step = niceGrid(120 / cam.zoom);
  const left = cam.x - w / (2 * cam.zoom);
  const right = cam.x + w / (2 * cam.zoom);
  const top = cam.y - h / (2 * cam.zoom);
  const bottom = cam.y + h / (2 * cam.zoom);
  const x0 = Math.floor(left / step) * step;
  const y0 = Math.floor(top / step) * step;
  ctx.beginPath();
  ctx.strokeStyle = "rgba(236,236,232,0.045)";
  ctx.lineWidth = 1;
  for (let x = x0; x <= right; x += step) {
    const s = worldToScreen(x, 0, cam, w, h);
    ctx.moveTo(s.x, 0);
    ctx.lineTo(s.x, h);
  }
  for (let y = y0; y <= bottom; y += step) {
    const s = worldToScreen(0, y, cam, w, h);
    ctx.moveTo(0, s.y);
    ctx.lineTo(w, s.y);
  }
  ctx.stroke();

  const origin = worldToScreen(0, 0, cam, w, h);
  ctx.beginPath();
  ctx.strokeStyle = "rgba(236,236,232,0.08)";
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, h);
  ctx.moveTo(0, origin.y);
  ctx.lineTo(w, origin.y);
  ctx.stroke();
}

function niceGrid(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  if (n < 1.5) return pow;
  if (n < 3.5) return 2 * pow;
  if (n < 7.5) return 5 * pow;
  return 10 * pow;
}

function drawTrails(
  ctx: CanvasRenderingContext2D,
  bodies: Body[],
  cam: Camera,
  w: number,
  h: number,
  alpha: number,
): void {
  for (const b of bodies) {
    if (b.trailCount < 2) continue;
    ctx.beginPath();
    let started = false;
    const n = b.trailCount;
    for (let k = 0; k < n; k++) {
      const idx = (b.trailHead - n + k + TRAIL_CAP * 4) % TRAIL_CAP;
      let x = b.trail[idx * 2]!;
      let y = b.trail[idx * 2 + 1]!;
      if (k === n - 1) {
        x = b.px + (b.x - b.px) * alpha;
        y = b.py + (b.y - b.py) * alpha;
      }
      const s = worldToScreen(x, y, cam, w, h);
      if (!started) {
        ctx.moveTo(s.x, s.y);
        started = true;
      } else {
        ctx.lineTo(s.x, s.y);
      }
    }
    ctx.strokeStyle = rgba(b.glow, 0.22);
    ctx.lineWidth = Math.max(1, Math.min(3.2, b.radius * cam.zoom * 0.12));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    started = false;
    const tail = Math.min(48, n);
    for (let k = n - tail; k < n; k++) {
      const idx = (b.trailHead - n + k + TRAIL_CAP * 4) % TRAIL_CAP;
      let x = b.trail[idx * 2]!;
      let y = b.trail[idx * 2 + 1]!;
      if (k === n - 1) {
        x = b.px + (b.x - b.px) * alpha;
        y = b.py + (b.y - b.py) * alpha;
      }
      const s = worldToScreen(x, y, cam, w, h);
      if (!started) {
        ctx.moveTo(s.x, s.y);
        started = true;
      } else {
        ctx.lineTo(s.x, s.y);
      }
    }
    ctx.strokeStyle = rgba(b.glow, 0.55);
    ctx.lineWidth = Math.max(1.2, Math.min(4, b.radius * cam.zoom * 0.16));
    ctx.stroke();
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  b: Body,
  cam: Camera,
  w: number,
  h: number,
  alpha: number,
  time: number,
  reduced: boolean,
  selected: boolean,
): void {
  const x = b.px + (b.x - b.px) * alpha;
  const y = b.py + (b.y - b.py) * alpha;
  const s = worldToScreen(x, y, cam, w, h);
  const r = b.radius * cam.zoom;
  if (s.x < -r * 4 || s.y < -r * 4 || s.x > w + r * 4 || s.y > h + r * 4) return;

  const glowR = r * (b.kind === "star" ? 3.4 : 2.2);
  const glow = ctx.createRadialGradient(s.x, s.y, r * 0.2, s.x, s.y, glowR);
  glow.addColorStop(0, rgba(b.glow, b.kind === "star" ? 0.55 : 0.28));
  glow.addColorStop(0.45, rgba(b.glow, 0.08));
  glow.addColorStop(1, rgba(b.glow, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  if (b.kind === "star") {
    const pulse = reduced ? 1 : 1 + Math.sin(time * 2.1 + b.id) * 0.04;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = rgba(b.glow, 0.5);
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(-r * 3.2 * pulse, 0);
    ctx.lineTo(r * 3.2 * pulse, 0);
    ctx.moveTo(0, -r * 2.4 * pulse);
    ctx.lineTo(0, r * 2.4 * pulse);
    ctx.stroke();
    ctx.restore();
  }

  const hx = s.x - r * 0.32;
  const hy = s.y - r * 0.38;
  const disc = ctx.createRadialGradient(hx, hy, r * 0.08, s.x, s.y, r);
  if (b.kind === "star") {
    disc.addColorStop(0, "#fffaf0");
    disc.addColorStop(0.35, b.color);
    disc.addColorStop(1, "#c4a070");
  } else {
    disc.addColorStop(0, rgba("#ffffff", 0.72));
    disc.addColorStop(0.22, b.color);
    disc.addColorStop(0.78, b.color);
    disc.addColorStop(1, rgba("#05060a", 0.55));
  }
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(s.x, s.y, Math.max(1.2, r), 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(s.x, s.y, Math.max(1.2, r), 0, Math.PI * 2);
  ctx.strokeStyle = rgba(b.glow, 0.35);
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();

  if (selected) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(200,204,212,0.7)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cam: Camera,
  w: number,
  h: number,
): void {
  for (const p of particles) {
    const s = worldToScreen(p.x, p.y, cam, w, h);
    const t = p.life / p.maxLife;
    ctx.fillStyle = rgba(p.color, t * 0.85);
    ctx.beginPath();
    ctx.arc(s.x, s.y, Math.max(0.6, p.size * cam.zoom * t), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPrediction(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  collided: boolean,
  cam: Camera,
  w: number,
  h: number,
): void {
  if (points.length < 2) return;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const s = worldToScreen(points[i]!.x, points[i]!.y, cam, w, h);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  }
  ctx.strokeStyle = collided ? "rgba(232,176,164,0.7)" : "rgba(200,204,212,0.7)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  const last = points[points.length - 1]!;
  const ls = worldToScreen(last.x, last.y, cam, w, h);
  ctx.beginPath();
  ctx.arc(ls.x, ls.y, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = collided ? "rgba(232,176,164,0.9)" : "rgba(236,236,232,0.85)";
  ctx.fill();
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  aim: AimState,
  cam: Camera,
  w: number,
  h: number,
): void {
  const s = worldToScreen(aim.x, aim.y, cam, w, h);
  const tip = worldToScreen(aim.x + aim.vx * 0.55, aim.y + aim.vy * 0.55, cam, w, h);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.strokeStyle = "rgba(236,236,232,0.85)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  const ang = Math.atan2(tip.y - s.y, tip.x - s.x);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - 9 * Math.cos(ang - 0.45), tip.y - 9 * Math.sin(ang - 0.45));
  ctx.lineTo(tip.x - 9 * Math.cos(ang + 0.45), tip.y - 9 * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fillStyle = "rgba(236,236,232,0.9)";
  ctx.fill();

  const r = Math.max(3, aim.radius * cam.zoom);
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(aim.color, 0.55);
  ctx.fill();
  ctx.strokeStyle = rgba(aim.glow, 0.9);
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

export type DrawFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  cam: Camera;
  bodies: Body[];
  particles: Particle[];
  alpha: number;
  time: number;
  trails: boolean;
  grid: boolean;
  reduced: boolean;
  followId: number | null;
  aim: AimState | null;
  prediction: { points: { x: number; y: number }[]; collided: boolean } | null;
  shakeX: number;
  shakeY: number;
};

export function drawFrame(frame: DrawFrame): void {
  const { ctx, width: w, height: h, cam, dpr } = frame;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, w, h);

  ensureStars(w, h);
  ctx.save();
  ctx.translate(frame.shakeX, frame.shakeY);

  for (const star of stars) {
    const par = 0.12 + star.layer * 0.18;
    const sx = (star.x - cam.x * par * 0.15) % w;
    const sy = (star.y - cam.y * par * 0.15) % h;
    const x = sx < 0 ? sx + w : sx;
    const y = sy < 0 ? sy + h : sy;
    ctx.fillStyle = `rgba(236,236,232,${star.a})`;
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const nebula = ctx.createRadialGradient(w * 0.3, h * 0.28, 20, w * 0.3, h * 0.28, Math.max(w, h) * 0.55);
  nebula.addColorStop(0, "rgba(28,34,48,0.22)");
  nebula.addColorStop(1, "rgba(7,8,12,0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, w, h);

  if (frame.grid) drawGrid(ctx, cam, w, h);
  if (frame.trails) drawTrails(ctx, frame.bodies, cam, w, h, frame.alpha);
  if (frame.prediction) {
    drawPrediction(ctx, frame.prediction.points, frame.prediction.collided, cam, w, h);
  }
  for (const b of frame.bodies) {
    drawBody(ctx, b, cam, w, h, frame.alpha, frame.time, frame.reduced, b.id === frame.followId);
  }
  drawParticles(ctx, frame.particles, cam, w, h);
  if (frame.aim?.active) drawAim(ctx, frame.aim, cam, w, h);

  ctx.restore();
}

export function emitBurst(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  mass: number,
): void {
  const n = Math.min(42, 10 + Math.floor(Math.log10(mass + 1) * 8));
  const speed = 18 + Math.min(90, Math.sqrt(mass));
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const sp = speed * (0.35 + Math.random());
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 1,
      maxLife: 0.45 + Math.random() * 0.5,
      size: 1.2 + Math.random() * 2.4,
      color,
    });
  }
}

export function stepParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
