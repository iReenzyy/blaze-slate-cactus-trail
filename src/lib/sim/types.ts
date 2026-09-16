export type MassKind = "dust" | "asteroid" | "moon" | "planet" | "giant" | "star";

export type Vec2 = { x: number; y: number };

export type Body = {
  id: number;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  glow: string;
  kind: MassKind;
  name: string;
  trail: Float64Array;
  trailCount: number;
  trailHead: number;
  trailClock: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

export type MergeEvent = {
  x: number;
  y: number;
  mass: number;
  color: string;
  survivorId: number;
  absorbedId: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type MassPreset = {
  kind: MassKind;
  label: string;
  mass: number;
  color: string;
  glow: string;
};

export type ScenarioId = "system" | "binary" | "slingshot" | "empty";

export type AimState = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  glow: string;
  kind: MassKind;
};

export const TRAIL_CAP = 220;
