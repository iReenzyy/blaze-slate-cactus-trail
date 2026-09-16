let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.7;
    master.gain.value = muted ? 0 : 0.85;
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const ac = ensure();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
}

export function setMuted(next: boolean): void {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.02);
  }
}

export function isMuted(): boolean {
  return muted;
}

function envGain(duration: number, peak: number): GainNode | null {
  if (!ctx || !sfx) return null;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  g.connect(sfx);
  return g;
}

export function playLaunch(speed: number): void {
  const ac = ensure();
  if (!ac || !sfx || muted) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = envGain(0.16, 0.09);
  if (!g) return;
  osc.type = "sine";
  const f = 180 + Math.min(420, speed * 1.4);
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.14);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + 0.18);

  const noise = ac.createBufferSource();
  const buffer = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buffer;
  const ng = envGain(0.1, 0.04);
  if (ng) {
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 600;
    noise.connect(filter);
    filter.connect(ng);
    noise.start(t);
    noise.stop(t + 0.12);
  }
}

export function playMerge(mass: number): void {
  const ac = ensure();
  if (!ac || !sfx || muted) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = envGain(0.32, Math.min(0.22, 0.06 + mass / 40000));
  if (!g) return;
  osc.type = "sine";
  const f = Math.max(48, 140 - Math.log10(mass + 1) * 22);
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.28);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + 0.34);

  const osc2 = ac.createOscillator();
  const g2 = envGain(0.18, 0.05);
  if (g2) {
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(f * 2.1, t);
    osc2.frequency.exponentialRampToValueAtTime(f, t + 0.16);
    osc2.connect(g2);
    osc2.start(t);
    osc2.stop(t + 0.2);
  }
}

export function resumeAudioIfNeeded(): void {
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
}
