import {
  ESCAPE_RADIUS,
  G,
  KIND_LABEL,
  MAX_BODIES,
  PHYSICS_DT,
  TRAIL_SAMPLE_EVERY,
  colorsForKind,
  kindFromMass,
  mixHex,
  radiusFromMass,
} from "./constants";
import { leapfrog } from "./physics";
import { loadScenario } from "./scenarios";
import { TRAIL_CAP, type Body, type MassKind, type MergeEvent, type ScenarioId } from "./types";

let nextId = 1;

function allocTrail(): Float64Array {
  return new Float64Array(TRAIL_CAP * 2);
}

function makeBody(partial: {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  kind: MassKind;
  color: string;
  glow: string;
  name?: string;
}): Body {
  const radius = radiusFromMass(partial.mass);
  return {
    id: nextId++,
    x: partial.x,
    y: partial.y,
    px: partial.x,
    py: partial.y,
    vx: partial.vx,
    vy: partial.vy,
    mass: partial.mass,
    radius,
    color: partial.color,
    glow: partial.glow,
    kind: partial.kind,
    name: partial.name ?? KIND_LABEL[partial.kind],
    trail: allocTrail(),
    trailCount: 0,
    trailHead: 0,
    trailClock: 0,
  };
}

export class GravityWorld {
  bodies: Body[] = [];
  private nameCount: Record<MassKind, number> = {
    dust: 0,
    asteroid: 0,
    moon: 0,
    planet: 0,
    giant: 0,
    star: 0,
  };
  private mergeBuffer: MergeEvent[] = [];

  reset(scenario: ScenarioId): void {
    this.bodies = [];
    this.nameCount = { dust: 0, asteroid: 0, moon: 0, planet: 0, giant: 0, star: 0 };
    loadScenario(this, scenario);
  }

  spawn(input: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    kind: MassKind;
    color: string;
    glow: string;
  }): Body | null {
    if (this.bodies.length >= MAX_BODIES) return null;
    this.nameCount[input.kind] += 1;
    const body = makeBody({
      ...input,
      name: `${KIND_LABEL[input.kind]} ${this.nameCount[input.kind]}`,
    });
    this.pushTrail(body, body.x, body.y);
    this.bodies.push(body);
    return body;
  }

  addRaw(input: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    mass: number;
    kind: MassKind;
    color: string;
    glow: string;
    name: string;
  }): Body {
    const body = makeBody(input);
    this.pushTrail(body, body.x, body.y);
    this.bodies.push(body);
    return body;
  }

  clear(): void {
    this.bodies = [];
  }

  hitTest(x: number, y: number, extra = 8): Body | null {
    let best: Body | null = null;
    let bestD = Infinity;
    for (const b of this.bodies) {
      const d = Math.hypot(b.x - x, b.y - y);
      if (d <= b.radius + extra && d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  find(id: number | null): Body | null {
    if (id == null) return null;
    return this.bodies.find((b) => b.id === id) ?? null;
  }

  savePrev(): void {
    for (const b of this.bodies) {
      b.px = b.x;
      b.py = b.y;
    }
  }

  step(): MergeEvent[] {
    this.mergeBuffer.length = 0;
    leapfrog(this.bodies, PHYSICS_DT);
    this.resolveCollisions();
    this.cullEscaped();
    this.sampleTrails();
    return this.mergeBuffer;
  }

  private sampleTrails(): void {
    for (const b of this.bodies) {
      b.trailClock += 1;
      if (b.trailClock % TRAIL_SAMPLE_EVERY !== 0) continue;
      this.pushTrail(b, b.x, b.y);
    }
  }

  private pushTrail(b: Body, x: number, y: number): void {
    const i = b.trailHead % TRAIL_CAP;
    b.trail[i * 2] = x;
    b.trail[i * 2 + 1] = y;
    b.trailHead += 1;
    if (b.trailCount < TRAIL_CAP) b.trailCount += 1;
  }

  private resolveCollisions(): void {
    let guard = 0;
    while (guard++ < 12) {
      let merged = false;
      const n = this.bodies.length;
      for (let i = 0; i < n; i++) {
        const a = this.bodies[i];
        if (!a) continue;
        for (let j = i + 1; j < n; j++) {
          const b = this.bodies[j];
          if (!b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = (a.radius + b.radius) * 0.9;
          if (dx * dx + dy * dy > min * min) continue;
          this.merge(i, j);
          merged = true;
          break;
        }
        if (merged) break;
      }
      if (!merged) break;
    }
  }

  private merge(i: number, j: number): void {
    const a = this.bodies[i]!;
    const b = this.bodies[j]!;
    const heavy = a.mass >= b.mass ? a : b;
    const light = heavy === a ? b : a;
    const mass = a.mass + b.mass;
    const t = b.mass / mass;
    const x = (a.x * a.mass + b.x * b.mass) / mass;
    const y = (a.y * a.mass + b.y * b.mass) / mass;
    const vx = (a.vx * a.mass + b.vx * b.mass) / mass;
    const vy = (a.vy * a.mass + b.vy * b.mass) / mass;
    const kind = kindFromMass(mass);
    const palette = colorsForKind(kind);
    const color = mixHex(mixHex(a.color, b.color, t), palette.color, 0.35);
    const glow = mixHex(mixHex(a.glow, b.glow, t), palette.glow, 0.35);

    const survivor = makeBody({
      x,
      y,
      vx,
      vy,
      mass,
      kind,
      color,
      glow,
      name: heavy.name,
    });
    survivor.id = heavy.id;
    survivor.px = x;
    survivor.py = y;
    survivor.trail = heavy.trail;
    survivor.trailCount = heavy.trailCount;
    survivor.trailHead = heavy.trailHead;
    survivor.trailClock = 0;

    this.mergeBuffer.push({
      x,
      y,
      mass,
      color,
      survivorId: survivor.id,
      absorbedId: light.id,
    });

    const keep = this.bodies.filter((_, idx) => idx !== i && idx !== j);
    keep.push(survivor);
    this.bodies = keep;
  }

  private cullEscaped(): void {
    const lim2 = ESCAPE_RADIUS * ESCAPE_RADIUS;
    this.bodies = this.bodies.filter((b) => b.x * b.x + b.y * b.y < lim2);
  }
}

export function predictPath(
  world: GravityWorld,
  ghost: { x: number; y: number; vx: number; vy: number; mass: number; radius: number },
  steps = 280,
  dt = 1 / 36,
): { points: { x: number; y: number }[]; collided: boolean } {
  const bodies = world.bodies.map((b) => ({
    x: b.x,
    y: b.y,
    vx: b.vx,
    vy: b.vy,
    mass: b.mass,
    radius: b.radius,
    ghost: false,
  }));
  const g = {
    x: ghost.x,
    y: ghost.y,
    vx: ghost.vx,
    vy: ghost.vy,
    mass: ghost.mass,
    radius: ghost.radius,
    ghost: true,
  };
  bodies.push(g);

  const points: { x: number; y: number }[] = [{ x: g.x, y: g.y }];
  let collided = false;
  const n = bodies.length;
  const pax = new Float64Array(n);
  const pay = new Float64Array(n);

  const accel = () => {
    pax.fill(0);
    pay.fill(0);
    for (let i = 0; i < n; i++) {
      const a = bodies[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const eps = Math.max(10, 0.38 * (a.radius + b.radius));
        const inv = 1 / (dx * dx + dy * dy + eps * eps);
        const inv3 = inv * Math.sqrt(inv);
        const s = G * inv3;
        const fx = dx * s;
        const fy = dy * s;
        pax[i]! += fx * b.mass;
        pay[i]! += fy * b.mass;
        pax[j]! -= fx * a.mass;
        pay[j]! -= fy * a.mass;
      }
    }
  };

  for (let s = 0; s < steps; s++) {
    accel();
    const half = dt * 0.5;
    for (let i = 0; i < n; i++) {
      const b = bodies[i]!;
      b.vx += pax[i]! * half;
      b.vy += pay[i]! * half;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    accel();
    for (let i = 0; i < n; i++) {
      const b = bodies[i]!;
      b.vx += pax[i]! * half;
      b.vy += pay[i]! * half;
    }

    for (let i = 0; i < n - 1; i++) {
      const a = bodies[i]!;
      const dx = g.x - a.x;
      const dy = g.y - a.y;
      const min = (g.radius + a.radius) * 0.9;
      if (dx * dx + dy * dy <= min * min) {
        collided = true;
        points.push({ x: g.x, y: g.y });
        return { points, collided };
      }
    }

    if (s % 2 === 0) points.push({ x: g.x, y: g.y });
  }

  return { points, collided };
}
