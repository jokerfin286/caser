let ctx: AudioContext | null = null;
let enabled = true;

export function loadSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("keiser-sound") !== "0";
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("keiser-sound", value ? "1" : "0");
  }
}

export function syncSoundEnabled(value: boolean) {
  enabled = value;
}

function beep(freq: number, duration = 0.04, gain = 0.02) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new AudioCtx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration + 0.01);
  } catch {
    enabled = false;
  }
}

export function playTick(freq = 760) {
  beep(freq, 0.03, 0.015);
}

export function playWin(rare: boolean) {
  beep(rare ? 880 : 520, 0.08, 0.03);
  window.setTimeout(() => beep(rare ? 1180 : 700, 0.09, 0.03), 90);
  window.setTimeout(() => beep(rare ? 1480 : 880, 0.12, 0.035), 190);
}

export function playFail() {
  beep(160, 0.16, 0.03);
}
