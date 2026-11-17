// Beep with the Web Audio API. iPhones only allow sound after a tap, so `prime()` is called from the Start tap.
// The ring/silent switch mutes it; the screen flash always works (docs/ARCHITECTURE.md section 8).
let ctx = null;
let on = true;

export function setSoundOn(value) { on = value !== false; }
export function isSoundOn() { return on; }

export function prime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
  } catch { /* no sound: the flash still works */ }
}

// Two short tones. `long` makes them a bit longer (timer end).
export function beep({ long = false } = {}) {
  if (!on) return;
  try {
    prime();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [0, 0.22].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i === 0 ? 880 : 1175;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + (long ? 0.3 : 0.16));
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + (long ? 0.32 : 0.18));
    });
  } catch { /* ignore */ }
}
