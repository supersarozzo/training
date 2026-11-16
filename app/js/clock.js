// The app's clock. On a computer at localhost (testing only), `?date=yyyy-mm-dd` pretends it is another day,
// so week 1, week 2 and every weekday can be tested. On a real phone it is always the real time.
import { localDate } from "./ids.js";

function devDate() {
  try {
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") return null;
    const d = new URLSearchParams(location.search).get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch { return null; }
}

export function now() {
  const d = devDate();
  if (!d) return new Date();
  const real = new Date();
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day, real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
}
export const today = () => localDate(now());
export const isDevDate = () => devDate() !== null;
