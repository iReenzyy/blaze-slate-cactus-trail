import { colorsForKind, presetByKind } from "./constants";
import { binaryOrbitalVelocities, circularVelocity } from "./physics";
import type { ScenarioId } from "./types";
import type { GravityWorld } from "./world";

export function loadScenario(world: GravityWorld, id: ScenarioId): void {
  world.clear();
  if (id === "empty") return;
  if (id === "binary") {
    loadBinary(world);
    return;
  }
  if (id === "slingshot") {
    loadSlingshot(world);
    return;
  }
  loadSystem(world);
}

function loadSystem(world: GravityWorld): void {
  const starPreset = presetByKind("star");
  const star = world.addRaw({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 18000,
    kind: "star",
    color: starPreset.color,
    glow: starPreset.glow,
    name: "Солнце",
  });

  const innerPreset = presetByKind("planet");
  const innerPos = { x: 196, y: 0 };
  const innerV = circularVelocity(star, innerPos.x, innerPos.y, true);
  world.addRaw({
    x: innerPos.x,
    y: innerPos.y,
    vx: innerV.vx,
    vy: innerV.vy,
    mass: 180,
    kind: "planet",
    color: "#8b6a5a",
    glow: "#d4b09e",
    name: "Вулкан",
  });

  const outerPreset = innerPreset;
  const outerPos = { x: 372, y: 0 };
  const outerV = circularVelocity(star, outerPos.x, outerPos.y, true);
  const planet = world.addRaw({
    x: outerPos.x,
    y: outerPos.y,
    vx: outerV.vx,
    vy: outerV.vy,
    mass: 520,
    kind: "planet",
    color: outerPreset.color,
    glow: outerPreset.glow,
    name: "Океан",
  });

  const moonPreset = presetByKind("moon");
  const moonPos = { x: planet.x + 48, y: planet.y };
  const moonV = circularVelocity(planet, moonPos.x, moonPos.y, true);
  world.addRaw({
    x: moonPos.x,
    y: moonPos.y,
    vx: moonV.vx,
    vy: moonV.vy,
    mass: 28,
    kind: "moon",
    color: moonPreset.color,
    glow: moonPreset.glow,
    name: "Спутник",
  });
}

function loadBinary(world: GravityWorld): void {
  const star = presetByKind("star");
  const a = {
    x: -128,
    y: 0,
    mass: 9000,
    kind: "star" as const,
    color: star.color,
    glow: star.glow,
  };
  const b = {
    x: 128,
    y: 0,
    mass: 9000,
    kind: "star" as const,
    color: "#e8d4b8",
    glow: "#ffe9c8",
  };
  const v = binaryOrbitalVelocities(a, b);
  world.addRaw({ ...a, vx: v.va.vx, vy: v.va.vy, name: "Альфа" });
  world.addRaw({ ...b, vx: v.vb.vx, vy: v.vb.vy, name: "Бета" });

  const planetPreset = presetByKind("planet");
  const host = { x: 0, y: 0, vx: 0, vy: 0, mass: 18000 };
  const p = { x: 0, y: 430 };
  const pv = circularVelocity(host, p.x, p.y, true);
  world.addRaw({
    x: p.x,
    y: p.y,
    vx: pv.vx,
    vy: pv.vy,
    mass: 360,
    kind: "planet",
    color: planetPreset.color,
    glow: planetPreset.glow,
    name: "Спутник пары",
  });
}

function loadSlingshot(world: GravityWorld): void {
  const starPreset = presetByKind("star");
  const star = world.addRaw({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 16000,
    kind: "star",
    color: starPreset.color,
    glow: starPreset.glow,
    name: "Солнце",
  });

  const planetPreset = presetByKind("planet");
  const ppos = { x: 0, y: -310 };
  const pv = circularVelocity(star, ppos.x, ppos.y, true);
  world.addRaw({
    x: ppos.x,
    y: ppos.y,
    vx: pv.vx,
    vy: pv.vy,
    mass: 640,
    kind: "planet",
    color: planetPreset.color,
    glow: planetPreset.glow,
    name: "Газ",
  });

  const comet = colorsForKind("asteroid");
  world.addRaw({
    x: -780,
    y: 210,
    vx: 118,
    vy: -18,
    mass: 14,
    kind: "asteroid",
    color: comet.color,
    glow: comet.glow,
    name: "Комета",
  });
}
