import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Route, c as Pause, d as Hand, f as Grid3x3, l as Orbit, m as CircleHelp, n as VolumeX, o as RotateCcw, p as Eraser, r as Volume2, s as Play, t as X, u as MousePointer2 } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BXPJ7BN2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PHYSICS_DT = 1 / 120;
var ESCAPE_RADIUS = 22e3;
var LAUNCH_GAIN = 1.05;
var ZOOM_MIN = .12;
var ZOOM_MAX = 5.2;
var MASS_PRESETS = [
	{
		kind: "dust",
		label: "Пыль",
		mass: 4,
		color: "#9aa3ad",
		glow: "#c5ccd4"
	},
	{
		kind: "asteroid",
		label: "Астероид",
		mass: 16,
		color: "#8a7a6b",
		glow: "#c4b4a2"
	},
	{
		kind: "moon",
		label: "Луна",
		mass: 48,
		color: "#c5c8ce",
		glow: "#eceff3"
	},
	{
		kind: "planet",
		label: "Планета",
		mass: 420,
		color: "#6a9bb8",
		glow: "#9fd0e6"
	},
	{
		kind: "giant",
		label: "Гигант",
		mass: 1600,
		color: "#b07058",
		glow: "#e0a790"
	},
	{
		kind: "star",
		label: "Звезда",
		mass: 16e3,
		color: "#efe6d2",
		glow: "#fff6e0"
	}
];
var KIND_LABEL = {
	dust: "Пыль",
	asteroid: "Астероид",
	moon: "Луна",
	planet: "Планета",
	giant: "Гигант",
	star: "Звезда"
};
var SCENARIOS = [
	{
		id: "system",
		label: "Система",
		hint: "Звезда, две планеты и луна"
	},
	{
		id: "binary",
		label: "Двойная",
		hint: "Две звезды вокруг общего центра"
	},
	{
		id: "slingshot",
		label: "Слингшот",
		hint: "Комета у планеты на орбите"
	},
	{
		id: "empty",
		label: "Пустота",
		hint: "Чистое пространство"
	}
];
function radiusFromMass(mass) {
	const r = 2.15 * Math.cbrt(mass);
	if (mass >= 6e3) return r + 10;
	if (mass >= 900) return r + 3;
	return Math.max(3.2, r + .6);
}
function kindFromMass(mass) {
	if (mass >= 6e3) return "star";
	if (mass >= 900) return "giant";
	if (mass >= 180) return "planet";
	if (mass >= 40) return "moon";
	if (mass >= 8) return "asteroid";
	return "dust";
}
function presetByKind(kind) {
	return MASS_PRESETS.find((p) => p.kind === kind) ?? MASS_PRESETS[3];
}
function mixHex(a, b, t) {
	const pa = hexToRgb(a);
	const pb = hexToRgb(b);
	return rgbToHex(Math.round(pa.r + (pb.r - pa.r) * t), Math.round(pa.g + (pb.g - pa.g) * t), Math.round(pa.b + (pb.b - pa.b) * t));
}
function hexToRgb(hex) {
	const h = hex.replace("#", "");
	const n = Number.parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
	return {
		r: n >> 16 & 255,
		g: n >> 8 & 255,
		b: n & 255
	};
}
function rgbToHex(r, g, b) {
	return `#${[
		r,
		g,
		b
	].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function colorsForKind(kind, fallback) {
	const preset = MASS_PRESETS.find((p) => p.kind === kind);
	if (preset) return {
		color: preset.color,
		glow: preset.glow
	};
	return {
		color: fallback ?? "#9aa3ad",
		glow: "#c5ccd4"
	};
}
var ctx = null;
var master = null;
var sfx = null;
var muted = false;
function ensure() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		sfx.gain.value = .7;
		master.gain.value = muted ? 0 : .85;
		sfx.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const ac = ensure();
	if (!ac) return;
	if (ac.state === "suspended") ac.resume();
}
function setMuted(next) {
	muted = next;
	if (master && ctx) master.gain.setTargetAtTime(next ? 0 : .85, ctx.currentTime, .02);
}
function envGain(duration, peak) {
	if (!ctx || !sfx) return null;
	const g = ctx.createGain();
	const t = ctx.currentTime;
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(peak, t + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, t + duration);
	g.connect(sfx);
	return g;
}
function playLaunch(speed) {
	const ac = ensure();
	if (!ac || !sfx || muted) return;
	const t = ac.currentTime;
	const osc = ac.createOscillator();
	const g = envGain(.16, .09);
	if (!g) return;
	osc.type = "sine";
	const f = 180 + Math.min(420, speed * 1.4);
	osc.frequency.setValueAtTime(f, t);
	osc.frequency.exponentialRampToValueAtTime(90, t + .14);
	osc.connect(g);
	osc.start(t);
	osc.stop(t + .18);
	const noise = ac.createBufferSource();
	const buffer = ac.createBuffer(1, ac.sampleRate * .12, ac.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
	noise.buffer = buffer;
	const ng = envGain(.1, .04);
	if (ng) {
		const filter = ac.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = 600;
		noise.connect(filter);
		filter.connect(ng);
		noise.start(t);
		noise.stop(t + .12);
	}
}
function playMerge(mass) {
	const ac = ensure();
	if (!ac || !sfx || muted) return;
	const t = ac.currentTime;
	const osc = ac.createOscillator();
	const g = envGain(.32, Math.min(.22, .06 + mass / 4e4));
	if (!g) return;
	osc.type = "sine";
	const f = Math.max(48, 140 - Math.log10(mass + 1) * 22);
	osc.frequency.setValueAtTime(f, t);
	osc.frequency.exponentialRampToValueAtTime(f * .45, t + .28);
	osc.connect(g);
	osc.start(t);
	osc.stop(t + .34);
	const osc2 = ac.createOscillator();
	const g2 = envGain(.18, .05);
	if (g2) {
		osc2.type = "triangle";
		osc2.frequency.setValueAtTime(f * 2.1, t);
		osc2.frequency.exponentialRampToValueAtTime(f, t + .16);
		osc2.connect(g2);
		osc2.start(t);
		osc2.stop(t + .2);
	}
}
function resumeAudioIfNeeded() {
	if (!ctx) return;
	if (ctx.state === "suspended") ctx.resume();
}
var stars = [];
var starsW = 0;
var starsH = 0;
function ensureStars(w, h) {
	if (stars.length && starsW === w && starsH === h) return;
	starsW = w;
	starsH = h;
	const count = Math.floor(w * h / 14e3);
	stars = [];
	for (let i = 0; i < count; i++) stars.push({
		x: Math.random() * w,
		y: Math.random() * h,
		r: Math.random() < .12 ? 1.2 + Math.random() * 1.1 : .4 + Math.random() * .7,
		a: .22 + Math.random() * .7,
		layer: Math.random() < .35 ? 0 : Math.random() < .6 ? 1 : 2
	});
}
function rgba(hex, a) {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r},${g},${b},${a})`;
}
function worldToScreen(x, y, cam, w, h) {
	return {
		x: (x - cam.x) * cam.zoom + w * .5,
		y: (y - cam.y) * cam.zoom + h * .5
	};
}
function screenToWorld(sx, sy, cam, w, h) {
	return {
		x: cam.x + (sx - w * .5) / cam.zoom,
		y: cam.y + (sy - h * .5) / cam.zoom
	};
}
function drawGrid(ctx, cam, w, h) {
	const step = niceGrid(120 / cam.zoom);
	const left = cam.x - w / (2 * cam.zoom);
	const right = cam.x + w / (2 * cam.zoom);
	const top = cam.y - h / (2 * cam.zoom);
	const bottom = cam.y + h / (2 * cam.zoom);
	const x0 = Math.floor(left / step) * step;
	const y0 = Math.floor(top / step) * step;
	ctx.beginPath();
	ctx.strokeStyle = "rgba(236,236,232,0.045)";
	ctx.lineWidth = 1;
	for (let x = x0; x <= right; x += step) {
		const s = worldToScreen(x, 0, cam, w, h);
		ctx.moveTo(s.x, 0);
		ctx.lineTo(s.x, h);
	}
	for (let y = y0; y <= bottom; y += step) {
		const s = worldToScreen(0, y, cam, w, h);
		ctx.moveTo(0, s.y);
		ctx.lineTo(w, s.y);
	}
	ctx.stroke();
	const origin = worldToScreen(0, 0, cam, w, h);
	ctx.beginPath();
	ctx.strokeStyle = "rgba(236,236,232,0.08)";
	ctx.moveTo(origin.x, 0);
	ctx.lineTo(origin.x, h);
	ctx.moveTo(0, origin.y);
	ctx.lineTo(w, origin.y);
	ctx.stroke();
}
function niceGrid(raw) {
	const pow = Math.pow(10, Math.floor(Math.log10(raw)));
	const n = raw / pow;
	if (n < 1.5) return pow;
	if (n < 3.5) return 2 * pow;
	if (n < 7.5) return 5 * pow;
	return 10 * pow;
}
function drawTrails(ctx, bodies, cam, w, h, alpha) {
	for (const b of bodies) {
		if (b.trailCount < 2) continue;
		ctx.beginPath();
		let started = false;
		const n = b.trailCount;
		for (let k = 0; k < n; k++) {
			const idx = (b.trailHead - n + k + 880) % 220;
			let x = b.trail[idx * 2];
			let y = b.trail[idx * 2 + 1];
			if (k === n - 1) {
				x = b.px + (b.x - b.px) * alpha;
				y = b.py + (b.y - b.py) * alpha;
			}
			const s = worldToScreen(x, y, cam, w, h);
			if (!started) {
				ctx.moveTo(s.x, s.y);
				started = true;
			} else ctx.lineTo(s.x, s.y);
		}
		ctx.strokeStyle = rgba(b.glow, .22);
		ctx.lineWidth = Math.max(1, Math.min(3.2, b.radius * cam.zoom * .12));
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.stroke();
		ctx.beginPath();
		started = false;
		const tail = Math.min(48, n);
		for (let k = n - tail; k < n; k++) {
			const idx = (b.trailHead - n + k + 880) % 220;
			let x = b.trail[idx * 2];
			let y = b.trail[idx * 2 + 1];
			if (k === n - 1) {
				x = b.px + (b.x - b.px) * alpha;
				y = b.py + (b.y - b.py) * alpha;
			}
			const s = worldToScreen(x, y, cam, w, h);
			if (!started) {
				ctx.moveTo(s.x, s.y);
				started = true;
			} else ctx.lineTo(s.x, s.y);
		}
		ctx.strokeStyle = rgba(b.glow, .55);
		ctx.lineWidth = Math.max(1.2, Math.min(4, b.radius * cam.zoom * .16));
		ctx.stroke();
	}
}
function drawBody(ctx, b, cam, w, h, alpha, time, reduced, selected) {
	const s = worldToScreen(b.px + (b.x - b.px) * alpha, b.py + (b.y - b.py) * alpha, cam, w, h);
	const r = b.radius * cam.zoom;
	if (s.x < -r * 4 || s.y < -r * 4 || s.x > w + r * 4 || s.y > h + r * 4) return;
	const glowR = r * (b.kind === "star" ? 3.4 : 2.2);
	const glow = ctx.createRadialGradient(s.x, s.y, r * .2, s.x, s.y, glowR);
	glow.addColorStop(0, rgba(b.glow, b.kind === "star" ? .55 : .28));
	glow.addColorStop(.45, rgba(b.glow, .08));
	glow.addColorStop(1, rgba(b.glow, 0));
	ctx.fillStyle = glow;
	ctx.beginPath();
	ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
	ctx.fill();
	if (b.kind === "star") {
		const pulse = reduced ? 1 : 1 + Math.sin(time * 2.1 + b.id) * .04;
		ctx.save();
		ctx.translate(s.x, s.y);
		ctx.globalAlpha = .35;
		ctx.strokeStyle = rgba(b.glow, .5);
		ctx.lineWidth = Math.max(1, r * .08);
		ctx.beginPath();
		ctx.moveTo(-r * 3.2 * pulse, 0);
		ctx.lineTo(r * 3.2 * pulse, 0);
		ctx.moveTo(0, -r * 2.4 * pulse);
		ctx.lineTo(0, r * 2.4 * pulse);
		ctx.stroke();
		ctx.restore();
	}
	const hx = s.x - r * .32;
	const hy = s.y - r * .38;
	const disc = ctx.createRadialGradient(hx, hy, r * .08, s.x, s.y, r);
	if (b.kind === "star") {
		disc.addColorStop(0, "#fffaf0");
		disc.addColorStop(.35, b.color);
		disc.addColorStop(1, "#c4a070");
	} else {
		disc.addColorStop(0, rgba("#ffffff", .72));
		disc.addColorStop(.22, b.color);
		disc.addColorStop(.78, b.color);
		disc.addColorStop(1, rgba("#05060a", .55));
	}
	ctx.fillStyle = disc;
	ctx.beginPath();
	ctx.arc(s.x, s.y, Math.max(1.2, r), 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(s.x, s.y, Math.max(1.2, r), 0, Math.PI * 2);
	ctx.strokeStyle = rgba(b.glow, .35);
	ctx.lineWidth = Math.max(1, r * .06);
	ctx.stroke();
	if (selected) {
		ctx.beginPath();
		ctx.arc(s.x, s.y, r + 6, 0, Math.PI * 2);
		ctx.strokeStyle = "rgba(200,204,212,0.7)";
		ctx.lineWidth = 1.2;
		ctx.setLineDash([4, 4]);
		ctx.stroke();
		ctx.setLineDash([]);
	}
}
function drawParticles(ctx, particles, cam, w, h) {
	for (const p of particles) {
		const s = worldToScreen(p.x, p.y, cam, w, h);
		const t = p.life / p.maxLife;
		ctx.fillStyle = rgba(p.color, t * .85);
		ctx.beginPath();
		ctx.arc(s.x, s.y, Math.max(.6, p.size * cam.zoom * t), 0, Math.PI * 2);
		ctx.fill();
	}
}
function drawPrediction(ctx, points, collided, cam, w, h) {
	if (points.length < 2) return;
	ctx.beginPath();
	for (let i = 0; i < points.length; i++) {
		const s = worldToScreen(points[i].x, points[i].y, cam, w, h);
		if (i === 0) ctx.moveTo(s.x, s.y);
		else ctx.lineTo(s.x, s.y);
	}
	ctx.strokeStyle = collided ? "rgba(232,176,164,0.7)" : "rgba(200,204,212,0.7)";
	ctx.lineWidth = 1.4;
	ctx.setLineDash([5, 5]);
	ctx.stroke();
	ctx.setLineDash([]);
	const last = points[points.length - 1];
	const ls = worldToScreen(last.x, last.y, cam, w, h);
	ctx.beginPath();
	ctx.arc(ls.x, ls.y, 3.2, 0, Math.PI * 2);
	ctx.fillStyle = collided ? "rgba(232,176,164,0.9)" : "rgba(236,236,232,0.85)";
	ctx.fill();
}
function drawAim(ctx, aim, cam, w, h) {
	const s = worldToScreen(aim.x, aim.y, cam, w, h);
	const tip = worldToScreen(aim.x + aim.vx * .55, aim.y + aim.vy * .55, cam, w, h);
	ctx.beginPath();
	ctx.moveTo(s.x, s.y);
	ctx.lineTo(tip.x, tip.y);
	ctx.strokeStyle = "rgba(236,236,232,0.85)";
	ctx.lineWidth = 1.6;
	ctx.stroke();
	const ang = Math.atan2(tip.y - s.y, tip.x - s.x);
	ctx.beginPath();
	ctx.moveTo(tip.x, tip.y);
	ctx.lineTo(tip.x - 9 * Math.cos(ang - .45), tip.y - 9 * Math.sin(ang - .45));
	ctx.lineTo(tip.x - 9 * Math.cos(ang + .45), tip.y - 9 * Math.sin(ang + .45));
	ctx.closePath();
	ctx.fillStyle = "rgba(236,236,232,0.9)";
	ctx.fill();
	const r = Math.max(3, aim.radius * cam.zoom);
	ctx.beginPath();
	ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
	ctx.fillStyle = rgba(aim.color, .55);
	ctx.fill();
	ctx.strokeStyle = rgba(aim.glow, .9);
	ctx.lineWidth = 1.2;
	ctx.stroke();
}
function drawFrame(frame) {
	const { ctx, width: w, height: h, cam, dpr } = frame;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, w * dpr, h * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = "#07080c";
	ctx.fillRect(0, 0, w, h);
	ensureStars(w, h);
	ctx.save();
	ctx.translate(frame.shakeX, frame.shakeY);
	for (const star of stars) {
		const par = .12 + star.layer * .18;
		const sx = (star.x - cam.x * par * .15) % w;
		const sy = (star.y - cam.y * par * .15) % h;
		const x = sx < 0 ? sx + w : sx;
		const y = sy < 0 ? sy + h : sy;
		ctx.fillStyle = `rgba(236,236,232,${star.a})`;
		ctx.beginPath();
		ctx.arc(x, y, star.r, 0, Math.PI * 2);
		ctx.fill();
	}
	const nebula = ctx.createRadialGradient(w * .3, h * .28, 20, w * .3, h * .28, Math.max(w, h) * .55);
	nebula.addColorStop(0, "rgba(28,34,48,0.22)");
	nebula.addColorStop(1, "rgba(7,8,12,0)");
	ctx.fillStyle = nebula;
	ctx.fillRect(0, 0, w, h);
	if (frame.grid) drawGrid(ctx, cam, w, h);
	if (frame.trails) drawTrails(ctx, frame.bodies, cam, w, h, frame.alpha);
	if (frame.prediction) drawPrediction(ctx, frame.prediction.points, frame.prediction.collided, cam, w, h);
	for (const b of frame.bodies) drawBody(ctx, b, cam, w, h, frame.alpha, frame.time, frame.reduced, b.id === frame.followId);
	drawParticles(ctx, frame.particles, cam, w, h);
	if (frame.aim?.active) drawAim(ctx, frame.aim, cam, w, h);
	ctx.restore();
}
function emitBurst(particles, x, y, color, mass) {
	const n = Math.min(42, 10 + Math.floor(Math.log10(mass + 1) * 8));
	const speed = 18 + Math.min(90, Math.sqrt(mass));
	for (let i = 0; i < n; i++) {
		const ang = Math.PI * 2 * i / n + Math.random() * .4;
		const sp = speed * (.35 + Math.random());
		particles.push({
			x,
			y,
			vx: Math.cos(ang) * sp,
			vy: Math.sin(ang) * sp,
			life: 1,
			maxLife: .45 + Math.random() * .5,
			size: 1.2 + Math.random() * 2.4,
			color
		});
	}
}
function stepParticles(particles, dt) {
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vx *= .98;
		p.vy *= .98;
		p.life -= dt / p.maxLife;
		if (p.life <= 0) particles.splice(i, 1);
	}
}
var ax = [];
var ay = [];
function softening(a, b) {
	return Math.max(10, .38 * (a.radius + b.radius));
}
function computeAccelerations(bodies) {
	const n = bodies.length;
	while (ax.length < n) ax.push(0);
	while (ay.length < n) ay.push(0);
	for (let i = 0; i < n; i++) {
		ax[i] = 0;
		ay[i] = 0;
	}
	for (let i = 0; i < n; i++) {
		const a = bodies[i];
		for (let j = i + 1; j < n; j++) {
			const b = bodies[j];
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const r2 = dx * dx + dy * dy;
			const eps = softening(a, b);
			const inv = 1 / (r2 + eps * eps);
			const s = 240 * (inv * Math.sqrt(inv));
			const fx = dx * s;
			const fy = dy * s;
			ax[i] += fx * b.mass;
			ay[i] += fy * b.mass;
			ax[j] -= fx * a.mass;
			ay[j] -= fy * a.mass;
		}
	}
}
function leapfrog(bodies, dt) {
	const n = bodies.length;
	if (n === 0) return;
	computeAccelerations(bodies);
	const half = dt * .5;
	for (let i = 0; i < n; i++) {
		const b = bodies[i];
		b.vx += ax[i] * half;
		b.vy += ay[i] * half;
		b.x += b.vx * dt;
		b.y += b.vy * dt;
	}
	computeAccelerations(bodies);
	for (let i = 0; i < n; i++) {
		const b = bodies[i];
		b.vx += ax[i] * half;
		b.vy += ay[i] * half;
	}
}
function circularVelocity(host, x, y, clockwise = true) {
	const dx = x - host.x;
	const dy = y - host.y;
	const r = Math.hypot(dx, dy) || 1;
	const speed = Math.sqrt(240 * host.mass / r);
	const nx = dx / r;
	const ny = dy / r;
	const tx = clockwise ? -ny : ny;
	const ty = clockwise ? nx : -nx;
	return {
		vx: host.vx + tx * speed,
		vy: host.vy + ty * speed
	};
}
function binaryOrbitalVelocities(a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const d = Math.hypot(dx, dy) || 1;
	const nx = dx / d;
	const tx = -(dy / d);
	const ty = nx;
	const total = a.mass + b.mass;
	const ra = d * b.mass / total;
	const rb = d * a.mass / total;
	const omega = Math.sqrt(240 * total / (d * d * d));
	return {
		va: {
			vx: -tx * omega * ra,
			vy: -ty * omega * ra
		},
		vb: {
			vx: tx * omega * rb,
			vy: ty * omega * rb
		}
	};
}
function loadScenario(world, id) {
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
function loadSystem(world) {
	const starPreset = presetByKind("star");
	const star = world.addRaw({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		mass: 18e3,
		kind: "star",
		color: starPreset.color,
		glow: starPreset.glow,
		name: "Солнце"
	});
	const innerPreset = presetByKind("planet");
	const innerPos = {
		x: 196,
		y: 0
	};
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
		name: "Вулкан"
	});
	const outerPreset = innerPreset;
	const outerPos = {
		x: 372,
		y: 0
	};
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
		name: "Океан"
	});
	const moonPreset = presetByKind("moon");
	const moonPos = {
		x: planet.x + 48,
		y: planet.y
	};
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
		name: "Спутник"
	});
}
function loadBinary(world) {
	const star = presetByKind("star");
	const a = {
		x: -128,
		y: 0,
		mass: 9e3,
		kind: "star",
		color: star.color,
		glow: star.glow
	};
	const b = {
		x: 128,
		y: 0,
		mass: 9e3,
		kind: "star",
		color: "#e8d4b8",
		glow: "#ffe9c8"
	};
	const v = binaryOrbitalVelocities(a, b);
	world.addRaw({
		...a,
		vx: v.va.vx,
		vy: v.va.vy,
		name: "Альфа"
	});
	world.addRaw({
		...b,
		vx: v.vb.vx,
		vy: v.vb.vy,
		name: "Бета"
	});
	const planetPreset = presetByKind("planet");
	const host = {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		mass: 18e3
	};
	const p = {
		x: 0,
		y: 430
	};
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
		name: "Спутник пары"
	});
}
function loadSlingshot(world) {
	const starPreset = presetByKind("star");
	const star = world.addRaw({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		mass: 16e3,
		kind: "star",
		color: starPreset.color,
		glow: starPreset.glow,
		name: "Солнце"
	});
	const planetPreset = presetByKind("planet");
	const ppos = {
		x: 0,
		y: -310
	};
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
		name: "Газ"
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
		name: "Комета"
	});
}
var nextId = 1;
function allocTrail() {
	return /* @__PURE__ */ new Float64Array(440);
}
function makeBody(partial) {
	const radius = radiusFromMass(partial.mass);
	return {
		id: nextId++,
		x: partial.x,
		y: partial.y,
		px: partial.x,
		py: partial.y,
		vx: partial.vx,
		vy: partial.vy,
		mass: partial.mass,
		radius,
		color: partial.color,
		glow: partial.glow,
		kind: partial.kind,
		name: partial.name ?? KIND_LABEL[partial.kind],
		trail: allocTrail(),
		trailCount: 0,
		trailHead: 0,
		trailClock: 0
	};
}
var GravityWorld = class {
	bodies = [];
	nameCount = {
		dust: 0,
		asteroid: 0,
		moon: 0,
		planet: 0,
		giant: 0,
		star: 0
	};
	mergeBuffer = [];
	reset(scenario) {
		this.bodies = [];
		this.nameCount = {
			dust: 0,
			asteroid: 0,
			moon: 0,
			planet: 0,
			giant: 0,
			star: 0
		};
		loadScenario(this, scenario);
	}
	spawn(input) {
		if (this.bodies.length >= 48) return null;
		this.nameCount[input.kind] += 1;
		const body = makeBody({
			...input,
			name: `${KIND_LABEL[input.kind]} ${this.nameCount[input.kind]}`
		});
		this.pushTrail(body, body.x, body.y);
		this.bodies.push(body);
		return body;
	}
	addRaw(input) {
		const body = makeBody(input);
		this.pushTrail(body, body.x, body.y);
		this.bodies.push(body);
		return body;
	}
	clear() {
		this.bodies = [];
	}
	hitTest(x, y, extra = 8) {
		let best = null;
		let bestD = Infinity;
		for (const b of this.bodies) {
			const d = Math.hypot(b.x - x, b.y - y);
			if (d <= b.radius + extra && d < bestD) {
				best = b;
				bestD = d;
			}
		}
		return best;
	}
	find(id) {
		if (id == null) return null;
		return this.bodies.find((b) => b.id === id) ?? null;
	}
	savePrev() {
		for (const b of this.bodies) {
			b.px = b.x;
			b.py = b.y;
		}
	}
	step() {
		this.mergeBuffer.length = 0;
		leapfrog(this.bodies, PHYSICS_DT);
		this.resolveCollisions();
		this.cullEscaped();
		this.sampleTrails();
		return this.mergeBuffer;
	}
	sampleTrails() {
		for (const b of this.bodies) {
			b.trailClock += 1;
			if (b.trailClock % 3 !== 0) continue;
			this.pushTrail(b, b.x, b.y);
		}
	}
	pushTrail(b, x, y) {
		const i = b.trailHead % 220;
		b.trail[i * 2] = x;
		b.trail[i * 2 + 1] = y;
		b.trailHead += 1;
		if (b.trailCount < 220) b.trailCount += 1;
	}
	resolveCollisions() {
		let guard = 0;
		while (guard++ < 12) {
			let merged = false;
			const n = this.bodies.length;
			for (let i = 0; i < n; i++) {
				const a = this.bodies[i];
				if (!a) continue;
				for (let j = i + 1; j < n; j++) {
					const b = this.bodies[j];
					if (!b) continue;
					const dx = b.x - a.x;
					const dy = b.y - a.y;
					const min = (a.radius + b.radius) * .9;
					if (dx * dx + dy * dy > min * min) continue;
					this.merge(i, j);
					merged = true;
					break;
				}
				if (merged) break;
			}
			if (!merged) break;
		}
	}
	merge(i, j) {
		const a = this.bodies[i];
		const b = this.bodies[j];
		const heavy = a.mass >= b.mass ? a : b;
		const light = heavy === a ? b : a;
		const mass = a.mass + b.mass;
		const t = b.mass / mass;
		const x = (a.x * a.mass + b.x * b.mass) / mass;
		const y = (a.y * a.mass + b.y * b.mass) / mass;
		const vx = (a.vx * a.mass + b.vx * b.mass) / mass;
		const vy = (a.vy * a.mass + b.vy * b.mass) / mass;
		const kind = kindFromMass(mass);
		const palette = colorsForKind(kind);
		const color = mixHex(mixHex(a.color, b.color, t), palette.color, .35);
		const survivor = makeBody({
			x,
			y,
			vx,
			vy,
			mass,
			kind,
			color,
			glow: mixHex(mixHex(a.glow, b.glow, t), palette.glow, .35),
			name: heavy.name
		});
		survivor.id = heavy.id;
		survivor.px = x;
		survivor.py = y;
		survivor.trail = heavy.trail;
		survivor.trailCount = heavy.trailCount;
		survivor.trailHead = heavy.trailHead;
		survivor.trailClock = 0;
		this.mergeBuffer.push({
			x,
			y,
			mass,
			color,
			survivorId: survivor.id,
			absorbedId: light.id
		});
		const keep = this.bodies.filter((_, idx) => idx !== i && idx !== j);
		keep.push(survivor);
		this.bodies = keep;
	}
	cullEscaped() {
		const lim2 = ESCAPE_RADIUS * ESCAPE_RADIUS;
		this.bodies = this.bodies.filter((b) => b.x * b.x + b.y * b.y < lim2);
	}
};
function predictPath(world, ghost, steps = 280, dt = 1 / 36) {
	const bodies = world.bodies.map((b) => ({
		x: b.x,
		y: b.y,
		vx: b.vx,
		vy: b.vy,
		mass: b.mass,
		radius: b.radius,
		ghost: false
	}));
	const g = {
		x: ghost.x,
		y: ghost.y,
		vx: ghost.vx,
		vy: ghost.vy,
		mass: ghost.mass,
		radius: ghost.radius,
		ghost: true
	};
	bodies.push(g);
	const points = [{
		x: g.x,
		y: g.y
	}];
	let collided = false;
	const n = bodies.length;
	const pax = new Float64Array(n);
	const pay = new Float64Array(n);
	const accel = () => {
		pax.fill(0);
		pay.fill(0);
		for (let i = 0; i < n; i++) {
			const a = bodies[i];
			for (let j = i + 1; j < n; j++) {
				const b = bodies[j];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const eps = Math.max(10, .38 * (a.radius + b.radius));
				const inv = 1 / (dx * dx + dy * dy + eps * eps);
				const s = 240 * (inv * Math.sqrt(inv));
				const fx = dx * s;
				const fy = dy * s;
				pax[i] += fx * b.mass;
				pay[i] += fy * b.mass;
				pax[j] -= fx * a.mass;
				pay[j] -= fy * a.mass;
			}
		}
	};
	for (let s = 0; s < steps; s++) {
		accel();
		const half = dt * .5;
		for (let i = 0; i < n; i++) {
			const b = bodies[i];
			b.vx += pax[i] * half;
			b.vy += pay[i] * half;
			b.x += b.vx * dt;
			b.y += b.vy * dt;
		}
		accel();
		for (let i = 0; i < n; i++) {
			const b = bodies[i];
			b.vx += pax[i] * half;
			b.vy += pay[i] * half;
		}
		for (let i = 0; i < n - 1; i++) {
			const a = bodies[i];
			const dx = g.x - a.x;
			const dy = g.y - a.y;
			const min = (g.radius + a.radius) * .9;
			if (dx * dx + dy * dy <= min * min) {
				collided = true;
				points.push({
					x: g.x,
					y: g.y
				});
				return {
					points,
					collided
				};
			}
		}
		if (s % 2 === 0) points.push({
			x: g.x,
			y: g.y
		});
	}
	return {
		points,
		collided
	};
}
var useSimUi = create((set) => ({
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
	setTimeScale: (timeScale) => set({
		timeScale,
		paused: timeScale === 0 ? true : false
	}),
	setKind: (kind) => set({ kind }),
	setTool: (tool) => set({ tool }),
	setTrails: (trails) => set({ trails }),
	setGrid: (grid) => set({ grid }),
	setMuted: (muted) => set({ muted }),
	setHelpOpen: (helpOpen) => set({ helpOpen }),
	setScenario: (scenario) => set({
		scenario,
		followId: null,
		followName: null
	}),
	setFollow: (followId, followName) => set({
		followId,
		followName
	}),
	setStats: (bodyCount, zoom) => set({
		bodyCount,
		zoom
	}),
	hydrate: (partial) => set(partial)
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function pluralRu(n, one, few, many) {
	const abs = Math.abs(n) % 100;
	const d = abs % 10;
	if (abs > 10 && abs < 20) return many;
	if (d > 1 && d < 5) return few;
	if (d === 1) return one;
	return many;
}
function GravityCanvas() {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const ctx = canvas.getContext("2d", {
			alpha: false,
			desynchronized: true
		});
		if (!ctx) return;
		const world = new GravityWorld();
		world.reset(useSimUi.getState().scenario);
		const camera = {
			x: 0,
			y: 0,
			zoom: 1
		};
		const particles = [];
		const pointers = /* @__PURE__ */ new Map();
		let acc = 0;
		let last = performance.now();
		let trauma = 0;
		let time = 0;
		let raf = 0;
		let launch = null;
		let panLast = null;
		let pinch = null;
		let panning = false;
		let dpr = 1;
		let cssW = 1;
		let cssH = 1;
		let pred = null;
		let predClock = 0;
		let running = true;
		const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const resetCamera = () => {
			camera.x = 0;
			camera.y = 0;
			camera.zoom = clamp(Math.min(cssW, cssH) / 920, .48, 1.05);
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
		const toLocal = (e) => {
			const rect = canvas.getBoundingClientRect();
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			};
		};
		const toWorld = (lx, ly) => screenToWorld(lx, ly, camera, cssW, cssH);
		const currentAim = () => {
			if (!launch) return null;
			const preset = presetByKind(useSimUi.getState().kind);
			const dx = launch.currX - launch.startX;
			const dy = launch.currY - launch.startY;
			const vx = dx / camera.zoom * LAUNCH_GAIN;
			const vy = dy / camera.zoom * LAUNCH_GAIN;
			return {
				active: Math.hypot(dx, dy) >= 10,
				x: launch.worldX,
				y: launch.worldY,
				vx,
				vy,
				mass: preset.mass,
				radius: radiusFromMass(preset.mass),
				color: preset.color,
				glow: preset.glow,
				kind: preset.kind
			};
		};
		const updatePrediction = (aim) => {
			if (!aim?.active) {
				pred = null;
				return;
			}
			const now = performance.now();
			if (now - predClock < 24) return;
			predClock = now;
			pred = predictPath(world, aim);
		};
		const applyZoom = (factor, lx, ly) => {
			const before = toWorld(lx, ly);
			camera.zoom = clamp(camera.zoom * factor, ZOOM_MIN, ZOOM_MAX);
			const after = toWorld(lx, ly);
			camera.x += before.x - after.x;
			camera.y += before.y - after.y;
		};
		const onPointerDown = (e) => {
			if (!useSimUi.getState().started) return;
			resumeAudioIfNeeded();
			try {
				canvas.setPointerCapture(e.pointerId);
			} catch {}
			e.preventDefault();
			const loc = toLocal(e);
			pointers.set(e.pointerId, {
				id: e.pointerId,
				x: loc.x,
				y: loc.y
			});
			if (pointers.size === 2) {
				launch = null;
				pred = null;
				const [a, b] = [...pointers.values()];
				if (a && b) {
					pinch = {
						dist: Math.hypot(a.x - b.x, a.y - b.y),
						zoom: camera.zoom
					};
					panLast = {
						x: (a.x + b.x) * .5,
						y: (a.y + b.y) * .5
					};
				}
				panning = true;
				useSimUi.getState().setFollow(null, null);
				return;
			}
			if (useSimUi.getState().tool === "pan" || e.button === 1 || e.button === 2 || e.shiftKey || e.altKey) {
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
				worldY: wpt.y
			};
		};
		const onPointerMove = (e) => {
			const loc = toLocal(e);
			if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {
				id: e.pointerId,
				x: loc.x,
				y: loc.y
			});
			if (pointers.size === 2 && pinch) {
				const [a, b] = [...pointers.values()];
				if (a && b) {
					const dist = Math.hypot(a.x - b.x, a.y - b.y);
					const midX = (a.x + b.x) * .5;
					const midY = (a.y + b.y) * .5;
					if (pinch.dist > 8) {
						applyZoom(dist / pinch.dist, midX, midY);
						pinch = {
							dist,
							zoom: camera.zoom
						};
					}
					if (panLast) {
						camera.x -= (midX - panLast.x) / camera.zoom;
						camera.y -= (midY - panLast.y) / camera.zoom;
					}
					panLast = {
						x: midX,
						y: midY
					};
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
		const endPointer = (e) => {
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
				const wpt = {
					x: launch.worldX,
					y: launch.worldY
				};
				launch = null;
				pred = null;
				if (dist < 10) {
					const hit = world.hitTest(wpt.x, wpt.y, 12 / camera.zoom);
					if (hit) useSimUi.getState().setFollow(hit.id, hit.name);
					else useSimUi.getState().setFollow(null, null);
					return;
				}
				const preset = presetByKind(useSimUi.getState().kind);
				const body = world.spawn({
					x: wpt.x,
					y: wpt.y,
					vx: dx / camera.zoom * LAUNCH_GAIN,
					vy: dy / camera.zoom * LAUNCH_GAIN,
					mass: preset.mass,
					kind: preset.kind,
					color: preset.color,
					glow: preset.glow
				});
				if (body) playLaunch(Math.hypot(body.vx, body.vy));
			}
		};
		const onWheel = (e) => {
			e.preventDefault();
			if (!useSimUi.getState().started) return;
			const rect = canvas.getBoundingClientRect();
			const lx = e.clientX - rect.left;
			const ly = e.clientY - rect.top;
			const factor = Math.exp(-e.deltaY * .0015);
			applyZoom(factor, lx, ly);
		};
		const onContext = (e) => e.preventDefault();
		const onKey = (e) => {
			if (!useSimUi.getState().started) return;
			const ui = useSimUi.getState();
			if (e.code === "Space") {
				e.preventDefault();
				ui.togglePaused();
			} else if (e.code === "KeyC") {
				world.clear();
				ui.setFollow(null, null);
			} else if (e.code === "KeyT") ui.setTrails(!ui.trails);
			else if (e.code === "KeyG") ui.setGrid(!ui.grid);
			else if (e.code === "KeyH") ui.setTool(ui.tool === "pan" ? "launch" : "pan");
			else if (e.code === "KeyR") {
				world.reset(ui.scenario);
				ui.setFollow(null, null);
				resetCamera();
				particles.length = 0;
			} else if (e.code === "Escape") {
				ui.setFollow(null, null);
				ui.setHelpOpen(false);
			} else if (e.code.startsWith("Digit")) {
				const preset = MASS_PRESETS[Number(e.code.slice(5)) - 1];
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
			const handler = (ev) => {
				const detail = ev.detail;
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
		const tick = (now) => {
			if (!running) return;
			const raw = Math.min(.1, (now - last) / 1e3);
			last = now;
			time += raw;
			const ui = useSimUi.getState();
			const scale = !ui.started || ui.paused ? 0 : ui.timeScale;
			acc += raw * scale;
			if (acc > .2) acc = PHYSICS_DT * 24;
			let stepped = false;
			if (acc >= .008333333333333333) {
				world.savePrev();
				stepped = true;
			}
			let steps = 0;
			while (acc >= .008333333333333333 && steps < 24) {
				const merges = world.step();
				for (const m of merges) {
					emitBurst(particles, m.x, m.y, m.color, m.mass);
					playMerge(m.mass);
					trauma = Math.min(1, trauma + Math.min(.7, .18 + m.mass / 18e3));
					if (ui.followId === m.absorbedId) {
						const survivor = world.find(m.survivorId);
						useSimUi.getState().setFollow(m.survivorId, survivor?.name ?? null);
					}
				}
				acc -= PHYSICS_DT;
				steps += 1;
			}
			stepParticles(particles, raw * Math.max(.35, scale || 1));
			trauma = Math.max(0, trauma - raw * 1.7);
			const follow = world.find(ui.followId);
			if (follow && !panning) {
				const alpha = stepped ? Math.min(1, acc / PHYSICS_DT) : 1;
				const fx = follow.px + (follow.x - follow.px) * alpha;
				const fy = follow.py + (follow.y - follow.py) * alpha;
				const k = 1 - Math.exp(-4.2 * raw);
				camera.x += (fx - camera.x) * k;
				camera.y += (fy - camera.y) * k;
			} else if (ui.followId != null && !follow) useSimUi.getState().setFollow(null, null);
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
				shakeY
			});
			if (world.bodies.length !== lastCount || Math.abs(camera.zoom - lastZoom) > .01) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "absolute inset-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: tool === "pan" ? "cursor-grab touch-none" : "cursor-crosshair touch-none",
			onAuxClick: (e) => e.preventDefault()
		})
	});
}
function dispatchCmd(type) {
	window.dispatchEvent(new CustomEvent("orbita-cmd", { detail: { type } }));
}
function Hud() {
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
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem("orbita-prefs");
			if (!raw) return;
			const parsed = JSON.parse(raw);
			useSimUi.getState().hydrate(parsed);
			if (typeof parsed.muted === "boolean") setMuted(parsed.muted);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		return useSimUi.subscribe((s) => {
			try {
				localStorage.setItem("orbita-prefs", JSON.stringify({
					muted: s.muted,
					trails: s.trails,
					kind: s.kind,
					timeScale: s.timeScale,
					grid: s.grid
				}));
			} catch {}
		});
	}, []);
	const toggleMute = () => {
		unlockAudio();
		const next = !useSimUi.getState().muted;
		useSimUi.getState().setMuted(next);
		setMuted(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4", "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]", "transition-opacity duration-(--motion-fast) ease-(--ease-smooth-out)", started ? "opacity-100" : "invisible opacity-0"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hud-panel pointer-events-auto hidden px-3.5 py-2.5 sm:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-sm font-medium tracking-tight text-fg",
						children: "Орбита"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "симулятор гравитации"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto flex max-w-full flex-1 items-center justify-center sm:flex-none sm:justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-panel no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto p-1",
						children: MASS_PRESETS.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							title: `${p.label} (${i + 1})`,
							onClick: () => useSimUi.getState().setKind(p.kind),
							className: cn("hud-chip", kind === p.kind && "hud-chip-active"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mass-swatch",
								"data-kind": p.kind,
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.label })]
						}, p.kind))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
						label: muted ? "Звук" : "Без звука",
						onClick: toggleMute,
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
						label: "Справка",
						onClick: () => useSimUi.getState().setHelpOpen(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "size-4" })
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto hud-panel no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto p-1",
				children: SCENARIOS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					title: s.hint,
					onClick: () => useSimUi.getState().setScenario(s.id),
					className: cn("hud-chip", scenario === s.id && "hud-chip-active"),
					children: s.label
				}, s.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto hud-panel flex w-full flex-col gap-2 p-2 sm:w-auto sm:min-w-[22rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: paused ? "Продолжить" : "Пауза",
							onClick: () => {
								const ui = useSimUi.getState();
								if (ui.paused && ui.timeScale === 0) ui.setTimeScale(1);
								else ui.togglePaused();
							},
							children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex min-w-0 flex-1 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-10 shrink-0 font-mono text-xs tabular-nums text-muted",
								children: paused || timeScale === 0 ? "пауза" : `×${timeScale.toFixed(1)}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 8,
								step: .25,
								value: timeScale,
								onChange: (e) => useSimUi.getState().setTimeScale(Number(e.target.value)),
								className: "hud-slider",
								"aria-label": "Масштаб времени"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Сбросить сцену",
							onClick: () => dispatchCmd("reset"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Очистить",
							onClick: () => dispatchCmd("clear"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-4" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Запуск",
							onClick: () => useSimUi.getState().setTool("launch"),
							active: tool === "launch",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointer2, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Панорама",
							onClick: () => useSimUi.getState().setTool("pan"),
							active: tool === "pan",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hand, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Траектории",
							onClick: () => useSimUi.getState().setTrails(!trails),
							active: trails,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Сетка",
							onClick: () => useSimUi.getState().setGrid(!grid),
							active: grid,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-auto font-mono text-[0.7rem] tabular-nums text-subtle",
							children: [
								bodyCount,
								" ",
								pluralRu(bodyCount, "тело", "тела", "тел"),
								" · ×",
								zoom.toFixed(2),
								followName ? ` · ${followName}` : ""
							]
						})
					]
				})]
			})]
		})]
	}), helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpDialog, {}) : null] });
}
function IconBtn({ children, onClick, label, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		title: label,
		onClick,
		className: cn("hud-icon-btn", active && "hud-icon-btn-active"),
		children
	});
}
function HelpDialog() {
	const close = () => useSimUi.getState().setHelpOpen(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Закрыть",
			className: "absolute inset-0 bg-bg/60",
			onClick: close
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-labelledby": "help-title",
			className: "hud-panel relative z-10 w-full max-w-md p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "help-title",
					className: "font-display text-lg font-medium text-fg",
					children: "Как играть"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Ньютоновская гравитация нескольких тел"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "hud-icon-btn",
					"aria-label": "Закрыть",
					onClick: close,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2.5 text-sm leading-normal text-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Перетащите по сцене — появится тело с заданной скоростью. Пунктир показывает прогноз траектории." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Колёсико или щипок меняет масштаб. Правая кнопка, Shift или режим «рука» — панорама." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Короткий клик по телу включает слежение камеры. Ещё раз по пустому месту — отмена." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Столкновение сливает тела: сохраняются масса и импульс." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Пробел — пауза, C — очистить, R — сбросить сцену, 1–6 — масса." })
				]
			})]
		})]
	});
}
function StartOverlay() {
	const started = useSimUi((s) => s.started);
	const start = useSimUi((s) => s.start);
	const onStart = () => {
		unlockAudio();
		start();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("absolute inset-0 z-30 flex items-center justify-center px-5", "bg-bg/78 transition-[opacity,visibility] duration-(--motion-slow) ease-(--ease-smooth-out)", started ? "pointer-events-none invisible opacity-0" : "visible opacity-100"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-w-md flex-col items-start gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stagger-item flex items-center gap-3 text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Orbit, {
						className: "size-5",
						strokeWidth: 1.5
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs tracking-[0.22em] uppercase",
						children: "sandbox"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "stagger-item font-display text-4xl font-medium tracking-tight text-fg text-balance sm:text-5xl",
					children: "Орбита"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "stagger-item max-w-sm text-base leading-normal text-muted text-pretty",
					children: "Перетащите тело, чтобы задать скорость. Наблюдайте орбиты, гравитационные манёвры и столкновения."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onStart,
					className: "stagger-item hud-btn-primary min-h-11 px-6",
					children: "Начать"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "stagger-item font-mono text-xs text-subtle",
					children: "Перетаскивание — запуск · колёсико — масштаб · ПКМ — панорама"
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GravityCanvas, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartOverlay, {})
		]
	});
}
//#endregion
export { Home as component };
