import { create } from "zustand";
import type { MassKind, ScenarioId } from "@/lib/sim/types";

export type ToolMode = "launch" | "pan";

type SimUi = {
  started: boolean;
  paused: boolean;
  timeScale: number;
  kind: MassKind;
  tool: ToolMode;
  trails: boolean;
  grid: boolean;
  muted: boolean;
  helpOpen: boolean;
  scenario: ScenarioId;
  followId: number | null;
  followName: string | null;
  bodyCount: number;
  zoom: number;
  start: () => void;
  setPaused: (v: boolean) => void;
  togglePaused: () => void;
  setTimeScale: (v: number) => void;
  setKind: (v: MassKind) => void;
  setTool: (v: ToolMode) => void;
  setTrails: (v: boolean) => void;
  setGrid: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  setScenario: (v: ScenarioId) => void;
  setFollow: (id: number | null, name: string | null) => void;
  setStats: (bodyCount: number, zoom: number) => void;
  hydrate: (partial: Partial<Pick<SimUi, "muted" | "trails" | "kind" | "timeScale" | "grid">>) => void;
};

export const useSimUi = create<SimUi>((set) => ({
  started: false,
  paused: false,
  timeScale: 1,
  kind: "planet",
  tool: "launch",
  trails: true,
  grid: false,
  muted: false,
  helpOpen: false,
  scenario: "system",
  followId: null,
  followName: null,
  bodyCount: 0,
  zoom: 1,
  start: () => set({ started: true }),
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setTimeScale: (timeScale) => set({ timeScale, paused: timeScale === 0 ? true : false }),
  setKind: (kind) => set({ kind }),
  setTool: (tool) => set({ tool }),
  setTrails: (trails) => set({ trails }),
  setGrid: (grid) => set({ grid }),
  setMuted: (muted) => set({ muted }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setScenario: (scenario) => set({ scenario, followId: null, followName: null }),
  setFollow: (followId, followName) => set({ followId, followName }),
  setStats: (bodyCount, zoom) => set({ bodyCount, zoom }),
  hydrate: (partial) => set(partial),
}));
