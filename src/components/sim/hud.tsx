import {
  CircleHelp,
  Eraser,
  Grid3x3,
  Hand,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Route,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { MASS_PRESETS, SCENARIOS } from "@/lib/sim/constants";
import { setMuted as setAudioMuted, unlockAudio } from "@/lib/sim/audio";
import { cn, pluralRu } from "@/lib/utils";
import { useSimUi } from "@/stores/sim-ui";

function dispatchCmd(type: "clear" | "reset") {
  window.dispatchEvent(new CustomEvent("orbita-cmd", { detail: { type } }));
}

export function Hud() {
  const started = useSimUi((s) => s.started);
  const paused = useSimUi((s) => s.paused);
  const timeScale = useSimUi((s) => s.timeScale);
  const kind = useSimUi((s) => s.kind);
  const tool = useSimUi((s) => s.tool);
  const trails = useSimUi((s) => s.trails);
  const grid = useSimUi((s) => s.grid);
  const muted = useSimUi((s) => s.muted);
  const helpOpen = useSimUi((s) => s.helpOpen);
  const scenario = useSimUi((s) => s.scenario);
  const followName = useSimUi((s) => s.followName);
  const bodyCount = useSimUi((s) => s.bodyCount);
  const zoom = useSimUi((s) => s.zoom);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("orbita-prefs");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        muted?: boolean;
        trails?: boolean;
        kind?: typeof kind;
        timeScale?: number;
        grid?: boolean;
      };
      useSimUi.getState().hydrate(parsed);
      if (typeof parsed.muted === "boolean") setAudioMuted(parsed.muted);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const unsub = useSimUi.subscribe((s) => {
      try {
        localStorage.setItem(
          "orbita-prefs",
          JSON.stringify({
            muted: s.muted,
            trails: s.trails,
            kind: s.kind,
            timeScale: s.timeScale,
            grid: s.grid,
          }),
        );
      } catch {
        /* ignore */
      }
    });
    return unsub;
  }, []);

  const toggleMute = () => {
    unlockAudio();
    const next = !useSimUi.getState().muted;
    useSimUi.getState().setMuted(next);
    setAudioMuted(next);
  };

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4",
          "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "transition-opacity duration-(--motion-fast) ease-(--ease-smooth-out)",
          started ? "opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="hud-panel pointer-events-auto hidden px-3.5 py-2.5 sm:block">
            <p className="font-display text-sm font-medium tracking-tight text-fg">Орбита</p>
            <p className="text-xs text-muted">симулятор гравитации</p>
          </div>

          <div className="pointer-events-auto flex max-w-full flex-1 items-center justify-center sm:flex-none sm:justify-end">
            <div className="hud-panel no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto p-1">
              {MASS_PRESETS.map((p, i) => (
                <button
                  key={p.kind}
                  type="button"
                  title={`${p.label} (${i + 1})`}
                  onClick={() => useSimUi.getState().setKind(p.kind)}
                  className={cn("hud-chip", kind === p.kind && "hud-chip-active")}
                >
                  <span className="mass-swatch" data-kind={p.kind} aria-hidden />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <IconBtn label={muted ? "Звук" : "Без звука"} onClick={toggleMute}>
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </IconBtn>
            <IconBtn label="Справка" onClick={() => useSimUi.getState().setHelpOpen(true)}>
              <CircleHelp className="size-4" />
            </IconBtn>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-auto hud-panel no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto p-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.hint}
                onClick={() => useSimUi.getState().setScenario(s.id)}
                className={cn("hud-chip", scenario === s.id && "hud-chip-active")}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="pointer-events-auto hud-panel flex w-full flex-col gap-2 p-2 sm:w-auto sm:min-w-[22rem]">
            <div className="flex items-center gap-2">
              <IconBtn
                label={paused ? "Продолжить" : "Пауза"}
                onClick={() => {
                  const ui = useSimUi.getState();
                  if (ui.paused && ui.timeScale === 0) ui.setTimeScale(1);
                  else ui.togglePaused();
                }}
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </IconBtn>
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-muted">
                  {paused || timeScale === 0 ? "пауза" : `×${timeScale.toFixed(1)}`}
                </span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={0.25}
                  value={timeScale}
                  onChange={(e) => useSimUi.getState().setTimeScale(Number(e.target.value))}
                  className="hud-slider"
                  aria-label="Масштаб времени"
                />
              </label>
              <IconBtn label="Сбросить сцену" onClick={() => dispatchCmd("reset")}>
                <RotateCcw className="size-4" />
              </IconBtn>
              <IconBtn label="Очистить" onClick={() => dispatchCmd("clear")}>
                <Eraser className="size-4" />
              </IconBtn>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <IconBtn
                label="Запуск"
                onClick={() => useSimUi.getState().setTool("launch")}
                active={tool === "launch"}
              >
                <MousePointer2 className="size-4" />
              </IconBtn>
              <IconBtn
                label="Панорама"
                onClick={() => useSimUi.getState().setTool("pan")}
                active={tool === "pan"}
              >
                <Hand className="size-4" />
              </IconBtn>
              <IconBtn
                label="Траектории"
                onClick={() => useSimUi.getState().setTrails(!trails)}
                active={trails}
              >
                <Route className="size-4" />
              </IconBtn>
              <IconBtn
                label="Сетка"
                onClick={() => useSimUi.getState().setGrid(!grid)}
                active={grid}
              >
                <Grid3x3 className="size-4" />
              </IconBtn>
              <span className="ml-auto font-mono text-[0.7rem] tabular-nums text-subtle">
                {bodyCount} {pluralRu(bodyCount, "тело", "тела", "тел")} · ×{zoom.toFixed(2)}
                {followName ? ` · ${followName}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {helpOpen ? <HelpDialog /> : null}
    </>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("hud-icon-btn", active && "hud-icon-btn-active")}
    >
      {children}
    </button>
  );
}

function HelpDialog() {
  const close = () => useSimUi.getState().setHelpOpen(false);
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center">
      <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-bg/60" onClick={close} />
      <div
        role="dialog"
        aria-labelledby="help-title"
        className="hud-panel relative z-10 w-full max-w-md p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="help-title" className="font-display text-lg font-medium text-fg">
              Как играть
            </h2>
            <p className="text-sm text-muted">Ньютоновская гравитация нескольких тел</p>
          </div>
          <button type="button" className="hud-icon-btn" aria-label="Закрыть" onClick={close}>
            <X className="size-4" />
          </button>
        </div>
        <ul className="space-y-2.5 text-sm leading-normal text-fg">
          <li>Перетащите по сцене — появится тело с заданной скоростью. Пунктир показывает прогноз траектории.</li>
          <li>Колёсико или щипок меняет масштаб. Правая кнопка, Shift или режим «рука» — панорама.</li>
          <li>Короткий клик по телу включает слежение камеры. Ещё раз по пустому месту — отмена.</li>
          <li>Столкновение сливает тела: сохраняются масса и импульс.</li>
          <li>Пробел — пауза, C — очистить, R — сбросить сцену, 1–6 — масса.</li>
        </ul>
      </div>
    </div>
  );
}
