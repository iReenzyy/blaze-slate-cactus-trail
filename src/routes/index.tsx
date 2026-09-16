import { createFileRoute } from "@tanstack/react-router";
import { GravityCanvas } from "@/components/sim/gravity-canvas";
import { Hud } from "@/components/sim/hud";
import { StartOverlay } from "@/components/sim/start-overlay";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <GravityCanvas />
      <Hud />
      <StartOverlay />
    </main>
  );
}
