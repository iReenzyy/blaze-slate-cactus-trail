import { useEffect, useRef } from "react";
import {
  DRAG_CLICK_PX,
  LAUNCH_GAIN,
  MASS_PRESETS,
  MAX_STEPS_PER_FRAME,
  PHYSICS_DT,
  ZOOM_MAX,
  ZOOM_MIN,
  presetByKind,
  radiusFromMass,
} from "@/lib/sim/constants";
import { playLaunch, playMerge, resumeAudioIfNeeded } from "@/lib/sim/audio";
import { drawFrame, emitBurst, screenToWorld, stepParticles } from "@/lib/sim/render";
import type { AimState, Camera, Particle } from "@/lib/sim/types";
import { GravityWorld, predictPath } from "@/lib/sim/world";
import { useSimUi } from "@/stores/sim-ui";
import { clamp } from "@/lib/utils";

type Pointer = { id: number; x: number; y: number };

type Launch = {
  pointerId: number;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
  worldX: number;
  worldY: number;
};

export function GravityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const world = new GravityWorld();
    world.reset(useSimUi.getState().scenario);

    const camera: Camera = { x: 0, y: 0, zoom: 1 };
    const particles: Particle[] = [];
    const pointers = new Map<number, Pointer>();
    let acc = 0;
    let last = performance.now();
    let trauma = 0;
    let time = 0;
    let raf = 0;
    let launch: Launch | null = null;
    let panLast: { x: number; y: number } | null = null;
    let pinch: { dist: number; zoom: number } | null = null;
    let panning = false;
    let dpr = 1;
    let cssW = 1;
    let cssH = 1;
    let pred: { points: { x: number; y: number }[]; collided: boolean } | null = null;
    let predClock = 0;
    let running = true;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resetCamera = () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = clamp(Math.min(cssW, cssH) / 920, 0.48, 1.05);
    };

    let didFitZoom = false;
    const fit = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!didFitZoom && cssW > 8) {
        resetCamera();
        didFitZoom = true;
      }
    };
    fit();

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const toWorld = (lx: number, ly: number) => screenToWorld(lx, ly, camera, cssW, cssH);

    const currentAim = (): AimState | null => {
      if (!launch) return null;
      const ui = useSimUi.getState();
      const preset = presetByKind(ui.kind);
      const dx = launch.currX - launch.startX;
      const dy = launch.currY - launch.startY;
      const vx = (dx / camera.zoom) * LAUNCH_GAIN;
      const vy = (dy / camera.zoom) * LAUNCH_GAIN;
      const moved = Math.hypot(dx, dy) >= DRAG_CLICK_PX;
      return {
        active: moved,
        x: launch.worldX,
        y: launch.worldY,
        vx,
        vy,
        mass: preset.mass,
        radius: radiusFromMass(preset.mass),
        color: preset.color,
        glow: preset.glow,
        kind: preset.kind,
      };
    };

    const updatePrediction = (aim: AimState | null) => {
      if (!aim?.active) {
        pred = null;
        return;
      }
      const now = performance.now();
      if (now - predClock < 24) return;
      predClock = now;
      pred = predictPath(world, aim);
    };

    const applyZoom = (factor: number, lx: number, ly: number) => {
      const before = toWorld(lx, ly);
      camera.zoom = clamp(camera.zoom * factor, ZOOM_MIN, ZOOM_MAX);
      const after = toWorld(lx, ly);
      camera.x += before.x - after.x;
      camera.y += before.y - after.y;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!useSimUi.getState().started) return;
      resumeAudioIfNeeded();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* pointer may be synthetic */
      }
      e.preventDefault();
      const loc = toLocal(e);
      pointers.set(e.pointerId, { id: e.pointerId, x: loc.x, y: loc.y });

      if (pointers.size === 2) {
        launch = null;
        pred = null;
        const [a, b] = [...pointers.values()];
        if (a && b) {
          pinch = {
            dist: Math.hypot(a.x - b.x, a.y - b.y),
            zoom: camera.zoom,
          };
          panLast = { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
        }
        panning = true;
        useSimUi.getState().setFollow(null, null);
        return;
      }

      const isPan =
        useSimUi.getState().tool === "pan" ||
        e.button === 1 ||
        e.button === 2 ||
        e.shiftKey ||
        e.altKey;

      if (isPan) {
        panning = true;
        panLast = loc;
        useSimUi.getState().setFollow(null, null);
        return;
      }

      if (e.button !== 0 && e.pointerType === "mouse") return;

      const wpt = toWorld(loc.x, loc.y);
      launch = {
        pointerId: e.pointerId,
        startX: loc.x,
        startY: loc.y,
        currX: loc.x,
        currY: loc.y,
        worldX: wpt.x,
        worldY: wpt.y,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const loc = toLocal(e);
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { id: e.pointerId, x: loc.x, y: loc.y });
      }

      if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        if (a && b) {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const midX = (a.x + b.x) * 0.5;
          const midY = (a.y + b.y) * 0.5;
          if (pinch.dist > 8) {
            applyZoom(dist / pinch.dist, midX, midY);
            pinch = { dist, zoom: camera.zoom };
          }
          if (panLast) {
            camera.x -= (midX - panLast.x) / camera.zoom;
            camera.y -= (midY - panLast.y) / camera.zoom;
          }
          panLast = { x: midX, y: midY };
          useSimUi.getState().setFollow(null, null);
        }
        return;
      }

      if (panning && panLast) {
        camera.x -= (loc.x - panLast.x) / camera.zoom;
        camera.y -= (loc.y - panLast.y) / camera.zoom;
        panLast = loc;
        return;
      }

      if (launch && launch.pointerId === e.pointerId) {
        launch.currX = loc.x;
        launch.currY = loc.y;
        updatePrediction(currentAim());
      }
    };

    const endPointer = (e: PointerEvent) => {
      const loc = toLocal(e);
      pointers.delete(e.pointerId);

      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        panning = false;
        panLast = null;
      }

      if (launch && launch.pointerId === e.pointerId) {
        const dx = loc.x - launch.startX;
        const dy = loc.y - launch.startY;
        const dist = Math.hypot(dx, dy);
        const wpt = { x: launch.worldX, y: launch.worldY };
        launch = null;
        pred = null;

        if (dist < DRAG_CLICK_PX) {
          const hit = world.hitTest(wpt.x, wpt.y, 12 / camera.zoom);
          if (hit) useSimUi.getState().setFollow(hit.id, hit.name);
          else useSimUi.getState().setFollow(null, null);
          return;
        }

        const preset = presetByKind(useSimUi.getState().kind);
        const body = world.spawn({
          x: wpt.x,
          y: wpt.y,
          vx: (dx / camera.zoom) * LAUNCH_GAIN,
          vy: (dy / camera.zoom) * LAUNCH_GAIN,
          mass: preset.mass,
          kind: preset.kind,
          color: preset.color,
          glow: preset.glow,
        });
        if (body) playLaunch(Math.hypot(body.vx, body.vy));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!useSimUi.getState().started) return;
      const rect = canvas.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      applyZoom(factor, lx, ly);
    };

    const onContext = (e: Event) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      if (!useSimUi.getState().started) return;
      const ui = useSimUi.getState();
      if (e.code === "Space") {
        e.preventDefault();
        ui.togglePaused();
      } else if (e.code === "KeyC") {
        world.clear();
        ui.setFollow(null, null);
      } else if (e.code === "KeyT") {
        ui.setTrails(!ui.trails);
      } else if (e.code === "KeyG") {
        ui.setGrid(!ui.grid);
      } else if (e.code === "KeyH") {
        ui.setTool(ui.tool === "pan" ? "launch" : "pan");
      } else if (e.code === "KeyR") {
        world.reset(ui.scenario);
        ui.setFollow(null, null);
        resetCamera();
        particles.length = 0;
      } else if (e.code === "Escape") {
        ui.setFollow(null, null);
        ui.setHelpOpen(false);
      } else if (e.code.startsWith("Digit")) {
        const n = Number(e.code.slice(5));
        const preset = MASS_PRESETS[n - 1];
        if (preset) ui.setKind(preset.kind);
      }
    };

    const onBlur = () => {
      pointers.clear();
      launch = null;
      panning = false;
      pinch = null;
    };

    let lastScenario = useSimUi.getState().scenario;
    const unsub = useSimUi.subscribe((s) => {
      if (s.scenario !== lastScenario) {
        lastScenario = s.scenario;
        world.reset(s.scenario);
        resetCamera();
        particles.length = 0;
      }
    });

    const onClear = () => {
      const handler = (ev: Event) => {
        const detail = (ev as CustomEvent<{ type: string }>).detail;
        if (detail?.type === "clear") {
          world.clear();
          useSimUi.getState().setFollow(null, null);
          particles.length = 0;
        }
        if (detail?.type === "reset") {
          const ui = useSimUi.getState();
          world.reset(ui.scenario);
          ui.setFollow(null, null);
          resetCamera();
          particles.length = 0;
        }
      };
      window.addEventListener("orbita-cmd", handler);
      return () => window.removeEventListener("orbita-cmd", handler);
    };
    const offClear = onClear();

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", resumeAudioIfNeeded);

    let lastCount = -1;
    let lastZoom = -1;

    const tick = (now: number) => {
      if (!running) return;
      const raw = Math.min(0.1, (now - last) / 1000);
      last = now;
      time += raw;
      const ui = useSimUi.getState();
      const scale = !ui.started || ui.paused ? 0 : ui.timeScale;

      acc += raw * scale;
      if (acc > PHYSICS_DT * MAX_STEPS_PER_FRAME) acc = PHYSICS_DT * MAX_STEPS_PER_FRAME;

      let stepped = false;
      if (acc >= PHYSICS_DT) {
        world.savePrev();
        stepped = true;
      }
      let steps = 0;
      while (acc >= PHYSICS_DT && steps < MAX_STEPS_PER_FRAME) {
        const merges = world.step();
        for (const m of merges) {
          emitBurst(particles, m.x, m.y, m.color, m.mass);
          playMerge(m.mass);
          trauma = Math.min(1, trauma + Math.min(0.7, 0.18 + m.mass / 18000));
          if (ui.followId === m.absorbedId) {
            const survivor = world.find(m.survivorId);
            useSimUi.getState().setFollow(m.survivorId, survivor?.name ?? null);
          }
        }
        acc -= PHYSICS_DT;
        steps += 1;
      }

      stepParticles(particles, raw * Math.max(0.35, scale || 1));
      trauma = Math.max(0, trauma - raw * 1.7);

      const follow = world.find(ui.followId);
      if (follow && !panning) {
        const alpha = stepped ? Math.min(1, acc / PHYSICS_DT) : 1;
        const fx = follow.px + (follow.x - follow.px) * alpha;
        const fy = follow.py + (follow.y - follow.py) * alpha;
        const k = 1 - Math.exp(-4.2 * raw);
        camera.x += (fx - camera.x) * k;
        camera.y += (fy - camera.y) * k;
      } else if (ui.followId != null && !follow) {
        useSimUi.getState().setFollow(null, null);
      }

      const shake = reduced ? 0 : trauma * trauma;
      const shakeX = shake * 12 * Math.sin(time * 53.1);
      const shakeY = shake * 12 * Math.cos(time * 41.7);

      const aim = currentAim();
      if (aim?.active) updatePrediction(aim);

      const alpha = stepped ? Math.min(1, acc / PHYSICS_DT) : 1;
      drawFrame({
        ctx,
        width: cssW,
        height: cssH,
        dpr,
        cam: camera,
        bodies: world.bodies,
        particles,
        alpha,
        time,
        trails: ui.trails,
        grid: ui.grid,
        reduced,
        followId: ui.followId,
        aim,
        prediction: aim?.active ? pred : null,
        shakeX,
        shakeY,
      });

      if (world.bodies.length !== lastCount || Math.abs(camera.zoom - lastZoom) > 0.01) {
        lastCount = world.bodies.length;
        lastZoom = camera.zoom;
        useSimUi.getState().setStats(world.bodies.length, camera.zoom);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      offClear();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", resumeAudioIfNeeded);
    };
  }, []);

  const tool = useSimUi((s) => s.tool);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className={tool === "pan" ? "cursor-grab touch-none" : "cursor-crosshair touch-none"}
        onAuxClick={(e) => e.preventDefault()}
      />
    </div>
  );
}
