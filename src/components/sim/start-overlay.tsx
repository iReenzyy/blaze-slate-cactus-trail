import { Orbit } from "lucide-react";
import { unlockAudio } from "@/lib/sim/audio";
import { cn } from "@/lib/utils";
import { useSimUi } from "@/stores/sim-ui";

export function StartOverlay() {
  const started = useSimUi((s) => s.started);
  const start = useSimUi((s) => s.start);

  const onStart = () => {
    unlockAudio();
    start();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex items-center justify-center px-5",
        "bg-bg/78 transition-[opacity,visibility] duration-(--motion-slow) ease-(--ease-smooth-out)",
        started ? "pointer-events-none invisible opacity-0" : "visible opacity-100",
      )}
    >
      <div className="flex max-w-md flex-col items-start gap-5">
        <div className="stagger-item flex items-center gap-3 text-muted">
          <Orbit className="size-5" strokeWidth={1.5} />
          <span className="font-mono text-xs tracking-[0.22em] uppercase">sandbox</span>
        </div>
        <h1 className="stagger-item font-display text-4xl font-medium tracking-tight text-fg text-balance sm:text-5xl">
          Орбита
        </h1>
        <p className="stagger-item max-w-sm text-base leading-normal text-muted text-pretty">
          Перетащите тело, чтобы задать скорость. Наблюдайте орбиты, гравитационные манёвры и
          столкновения.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="stagger-item hud-btn-primary min-h-11 px-6"
        >
          Начать
        </button>
        <p className="stagger-item font-mono text-xs text-subtle">
          Перетаскивание — запуск · колёсико — масштаб · ПКМ — панорама
        </p>
      </div>
    </div>
  );
}
