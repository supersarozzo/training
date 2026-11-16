// Settings. Only Sound for now; sync, backup, gym and theme come in later build steps.
import { h } from "../h.js";
import { screen } from "./parts.js";
import { rerender } from "./app.js";
import { soundOn, setSound } from "../active.js";
import { setSoundOn, beep } from "../sound.js";

export function renderSettings() {
  const on = soundOn();
  const toggle = () => { setSound(!on); setSoundOn(!on); if (!on) beep(); rerender(); };
  return screen(
    h("h1", {}, "Settings"),
    h("div", { class: "card" },
      h("h2", {}, "Sound"),
      h("p", { class: "muted" }, "A beep when a timer ends. It only plays with the app open and the phone's ring switch on. The screen flash always shows."),
      h("button", { class: "choice", type: "button", "aria-pressed": on ? "true" : "false", onclick: toggle }, on ? "Sound is on" : "Sound is off")));
}
