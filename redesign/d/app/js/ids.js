// Ids and times. Pure: pass `now` and `bytes` in tests.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomChars(n = 6, bytes = (len) => crypto.getRandomValues(new Uint8Array(len))) {
  let out = "";
  for (const b of bytes(n)) out += ALPHABET[b % ALPHABET.length];
  return out;
}

// UTC date as yyyymmdd
export function ymd(now = new Date()) {
  return now.toISOString().slice(0, 10).replaceAll("-", "");
}

// Format: <kind>-<yyyymmdd>-<6 random letters or digits>, e.g. s-20261117-k3f9qz
export function newId(kind, now = new Date(), bytes) {
  return `${kind}-${ymd(now)}-${randomChars(6, bytes)}`;
}

// Weigh-ins: one per day, so two devices merge into one. Date is yyyy-mm-dd.
export function weighinId(dateStr) { return `w-${dateStr}`; }
// Exercise state: one per exercise.
export function exerciseStateId(exerciseId) { return `x-${exerciseId}`; }
// "Where it is in my gym" note: one per machine (redesign D).
export function machineSpotId(machineId) { return `g-${machineId}`; }

// UTC time with milliseconds, e.g. 2026-11-17T18:42:07.311Z
export function nowUtc(now = new Date()) { return now.toISOString(); }

// Local calendar date (the phone's own day) as yyyy-mm-dd.
export function localDate(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
