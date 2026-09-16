import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function pluralRu(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
}
