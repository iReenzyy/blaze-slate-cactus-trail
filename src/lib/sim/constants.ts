import type { MassKind, MassPreset, ScenarioId } from "./types";

export const G = 240;
export const PHYSICS_DT = 1 / 120;
export const MAX_STEPS_PER_FRAME = 24;
export const MAX_BODIES = 48;
export const ESCAPE_RADIUS = 22000;
export const LAUNCH_GAIN = 1.05;
export const DRAG_CLICK_PX = 10;
export const ZOOM_MIN = 0.12;
export const ZOOM_MAX = 5.2;
export const TRAIL_SAMPLE_EVERY = 3;

export const MASS_PRESETS: MassPreset[] = [
  {
    kind: "dust",
    label: "Пыль",
    mass: 4,
    color: "#9aa3ad",
    glow: "#c5ccd4",
  },
  {
    kind: "asteroid",
    label: "Астероид",
    mass: 16,
    color: "#8a7a6b",
    glow: "#c4b4a2",
  },
  {
    kind: "moon",
    label: "Луна",
    mass: 48,
    color: "#c5c8ce",
    glow: "#eceff3",
  },
  {
    kind: "planet",
    label: "Планета",
    mass: 420,
    color: "#6a9bb8",
    glow: "#9fd0e6",
  },
  {
    kind: "giant",
    label: "Гигант",
    mass: 1600,
    color: "#b07058",
    glow: "#e0a790",
  },
  {
    kind: "star",
    label: "Звезда",
    mass: 16000,
    color: "#efe6d2",
    glow: "#fff6e0",
  },
];

export const KIND_LABEL: Record<MassKind, string> = {
  dust: "Пыль",
  asteroid: "Астероид",
  moon: "Луна",
  planet: "Планета",
  giant: "Гигант",
  star: "Звезда",
};

export const SCENARIOS: { id: ScenarioId; label: string; hint: string }[] = [
  { id: "system", label: "Система", hint: "Звезда, две планеты и луна" },
  { id: "binary", label: "Двойная", hint: "Две звезды вокруг общего центра" },
  { id: "slingshot", label: "Слингшот", hint: "Комета у планеты на орбите" },
  { id: "empty", label: "Пустота", hint: "Чистое пространство" },
];

export function radiusFromMass(mass: number): number {
  const r = 2.15 * Math.cbrt(mass);
  if (mass >= 6000) return r + 10;
  if (mass >= 900) return r + 3;
  return Math.max(3.2, r + 0.6);
}

export function kindFromMass(mass: number): MassKind {
  if (mass >= 6000) return "star";
  if (mass >= 900) return "giant";
  if (mass >= 180) return "planet";
  if (mass >= 40) return "moon";
  if (mass >= 8) return "asteroid";
  return "dust";
}

export function presetByKind(kind: MassKind): MassPreset {
  return MASS_PRESETS.find((p) => p.kind === kind) ?? MASS_PRESETS[3]!;
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return rgbToHex(r, g, bl);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function colorsForKind(kind: MassKind, fallback?: string): { color: string; glow: string } {
  const preset = MASS_PRESETS.find((p) => p.kind === kind);
  if (preset) return { color: preset.color, glow: preset.glow };
  return { color: fallback ?? "#9aa3ad", glow: "#c5ccd4" };
}
