// The optional "Log to Health" button (docs/ARCHITECTURE.md section 9). Off until turned on in Settings.
// The link carries the start time and the minutes only: no body data.
export const DEFAULT_SHORTCUT_NAME = "Log Training";

export function shortcutOn(settings) {
  return Boolean(settings && settings.shortcut && settings.shortcut.on === true);
}

export function shortcutName(settings) {
  const n = settings && settings.shortcut && typeof settings.shortcut.name === "string" ? settings.shortcut.name.trim() : "";
  return n && n.length <= 80 ? n : DEFAULT_SHORTCUT_NAME;
}

// The link, or null when the button is off or the times are not usable.
export function shortcutUrl(settings, startedAtIso, minutes) {
  if (!shortcutOn(settings)) return null;
  if (typeof startedAtIso !== "string" || Number.isNaN(Date.parse(startedAtIso))) return null;
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) return null;
  const text = `${startedAtIso}|${Math.round(minutes)}`;
  return `shortcuts://run-shortcut?name=${encodeURIComponent(shortcutName(settings))}&input=text&text=${encodeURIComponent(text)}`;
}
