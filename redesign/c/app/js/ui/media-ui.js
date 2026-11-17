// Exercise pictures (2-photo flip), the exercise sheet (photos, tips, video, machine, settings note)
// and the machine card (picture, sign, area, "Where it is in my gym"). All text is set as text, never innerHTML.
import { MAX_TEXT } from "../validate.js";
import { h } from "../h.js";
import { s } from "./svg.js";
import { icon } from "./icons.js";
import { openSheet, chip } from "./parts.js";
import { model, rerender } from "./app.js";
import { exercises, warmupMoves, upperDayWarmupExtra } from "../plan/plan-v2.js";
import { cues } from "../plan/cues.js";
import { exerciseMedia, otherMedia, machines, AREAS, videos, photosFor, machineFor } from "../plan/media.js";
import { motionOk } from "./prefs.js";

const MUSCLE = { chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps", triceps: "Triceps", abs: "Abs", quads: "Front of thighs", hamstrings: "Back of thighs", glutes: "Glutes", calves: "Calves" };

export function nameOf(id) {
  if (exercises[id]) return exercises[id].name;
  if (id === "uphill_walk") return "Fast uphill walk";
  const m = [...warmupMoves, upperDayWarmupExtra].find((x) => x.id === id);
  return m ? m.name : id;
}

// Our own drawing for a move with no library photo (hip hinge): a simple figure, start and end.
function figure(frame) {
  const bent = frame === 1;
  return s("svg", { class: "figure", viewBox: "0 0 150 100", "aria-hidden": "true" },
    s("line", { class: "floor", x1: 30, y1: 92, x2: 120, y2: 92 }),
    bent
      // side view: hips pushed back, knees soft, back straight and forward, hands on hips
      ? [s("circle", { class: "head", cx: 87, cy: 23, r: 7 }),
        s("path", { class: "fg", d: "M56 54 L80 30 M56 54 L66 72 L66 90 L76 90 M80 32 L66 28 L60 47" })]
      : [s("circle", { class: "head", cx: 72, cy: 13, r: 7 }),
        s("path", { class: "fg", d: "M72 22 L72 54 M72 54 L72 72 L72 90 L82 90 M72 25 L63 37 L70 49" })]);
}

function imgs(id) {
  const p = photosFor(id);
  if (!p) return [figure(0), figure(1)];
  return p.map((src, i) => h("img", { src, alt: i ? "" : `${nameOf(id)}, start and end position`, loading: "lazy", decoding: "async" }));
}

// A small square picture (first photo only, no movement: lists stay calm).
export function thumb(id, { size = "", onclick = null } = {}) {
  const p = photosFor(id);
  const content = p ? h("img", { src: p[0], alt: "", loading: "lazy", decoding: "async" }) : figure(1);
  return h(onclick ? "button" : "div", { class: `thumb ${size}`.trim(), type: onclick ? "button" : null, onclick, "aria-label": onclick ? `About ${nameOf(id)}` : null }, content);
}

// The two photos as a short loop (start, end, start ...). With animations off it shows the start; tap to switch.
export function flip(id, { wide = false, size = "", onclick = null, tag = true } = {}) {
  const el = h(onclick ? "button" : "div", { class: `${wide ? "flip wide" : `thumb ${size} flip`}${motionOk() ? "" : " paused"}`, type: onclick ? "button" : null, onclick, "aria-label": onclick ? `About ${nameOf(id)}` : null }, imgs(id),
    wide && tag ? h("span", { class: "flip-tag" }, photosFor(id) ? "Start · end" : "Drawing") : null);
  if (!motionOk() && wide) el.addEventListener("click", () => el.classList.toggle("paused"));
  return el;
}

export function videoLink(id, label = "Watch video") {
  const v = videos[id];
  if (!v) return null;
  return chip("play", label, null, { href: v.url });
}

export function whereOf(doc, machineId) {
  const r = (doc.gym_spots ?? []).find((x) => x.id === `g-${machineId}` && !x.deleted);
  return r && r.where ? r.where : "";
}

// ---------- the exercise sheet ----------
// opts.noteFor: an exercise id whose machine settings note (seat height, pin) can be edited here (the old "Tips").
export function openExercise(id, { noteFor = null, onSaved = null } = {}) {
  const ex = exercises[id];
  const media = exerciseMedia[id] ?? otherMedia[id] ?? {};
  const mId = machineFor(id);
  const doc = model.doc();
  const st = noteFor ? doc.exercise_state.find((x) => x.id === `x-${noteFor}` && !x.deleted) : null;
  let note = st?.machine_note ?? "";
  const where = mId ? whereOf(doc, mId) : "";
  const v = videos[id];
  let close = () => {};
  close = openSheet(
    flip(id, { wide: true }),
    media.match === "close" && media.matchNote ? h("p", { class: "photo-note" }, media.matchNote) : null,
    h("h2", { class: "rise" }, nameOf(id)),
    ex ? h("p", { class: "small muted" }, `${ex.equipment} · ${MUSCLE[ex.muscle] ?? ex.muscle}`) : null,
    h("p", {}, cues[id] ?? (ex ? "Move slowly and keep good form." : "Easy and controlled. Breathe out on the effort.")),
    h("div", { class: "chips" },
      v ? chip("play", "Watch video", null, { href: v.url }) : null,
      mId ? chip("machine", machines[mId].name, () => openMachine(mId)) : null),
    v ? h("p", { class: "tiny faint" }, `Video: ${v.by}. Opens in Safari.`) : null,
    mId ? h("button", { class: `list-row`, type: "button", onclick: () => openMachine(mId) },
      icon("pin"), h("div", { class: "grow" }, h("div", { class: "title" }, "Where it is in my gym"), h("div", { class: "sub" }, where || "Not noted yet. Tap to add it.")), icon("chev", "chev")) : null,
    noteFor ? [
      h("div", { class: "field" },
        h("label", { for: "machine-note" }, "Machine settings note (seat height, pin)"),
        h("textarea", { id: "machine-note", maxlength: MAX_TEXT, oninput: (e) => { note = e.target.value; }, value: note })),
      h("button", { class: "button", type: "button", onclick: () => { model.setExerciseState(noteFor, { machine_note: note.trim() }); close(); if (onSaved) onSaved(); else rerender(); } }, "Save note"),
    ] : null);
  return close;
}

// ---------- the machine card ----------
export function openMachine(machineId, { edit = false } = {}) {
  const m = machines[machineId];
  if (!m) return null;
  const doc = model.doc();
  const where = whereOf(doc, machineId);
  const users = Object.entries(exerciseMedia).filter(([, x]) => x.machine === machineId).map(([id]) => id);
  if (machineId === "treadmill") users.unshift("uphill_walk");
  const extra = m.optional ? doc.shared_settings?.extra_machines?.[machineId] : undefined;
  let text = where;
  let close = () => {};
  const save = () => { model.setGymSpot(machineId, text); close(); rerender(); setTimeout(() => openMachine(machineId), 0); };
  const editor = [
    h("div", { class: "field" },
      h("label", { for: "where-note" }, "Where it is in my gym"),
      h("textarea", { id: "where-note", maxlength: MAX_TEXT, placeholder: "For example: upstairs, back left, next to the mirrors", oninput: (e) => { text = e.target.value; }, value: text })),
    h("button", { class: "button", type: "button", onclick: save }, "Save where it is"),
  ];
  close = openSheet(
    flip(m.photo, { wide: true, tag: false }),
    h("p", { class: "eyebrow", }, AREAS[m.area]),
    h("h2", {}, m.name),
    h("dl", { class: "kv" },
      h("dt", {}, "Sign says"), h("dd", {}, m.sign),
      h("dt", {}, "Gym area"), h("dd", {}, AREAS[m.area]),
      m.optional ? [h("dt", {}, "In my gym"), h("dd", {}, extra === true ? "Yes" : extra === false ? "No" : "Not checked yet (Settings)")] : null),
    h("p", { class: "small" }, m.look),
    edit || !where
      ? editor
      : [h("div", { class: "where-box" }, h("div", { class: "k" }, icon("pin", "sm"), "Where it is in my gym"), h("p", {}, where)),
        h("button", { class: "button secondary", type: "button", onclick: () => { close(); setTimeout(() => openMachine(machineId, { edit: true }), 0); } }, "Change where it is")],
    h("h3", {}, users.length === 1 ? "Used for" : `Used for ${users.length} exercises`),
    h("div", { class: "list" }, users.map((id) => h("button", { class: "list-row", type: "button", onclick: () => openExercise(id) },
      thumb(id, { size: "sm" }), h("div", { class: "grow" }, h("div", { class: "title" }, nameOf(id))), icon("chev", "chev")))));
  return close;
}
