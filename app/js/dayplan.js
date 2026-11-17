// Today's blocks with minutes, with the walk minutes taken from the same engine call as the walk screen
// (JUDGING.md 3.6 item 1, Rosario's answer 60 a: display fix only, the engine's walk rules do not change).
// The plan's fixed walk minutes (sessionMinutes) said 30 while walkSuggestion() says 20 until a walk with an effort
// score is saved. Pure: data in, data out.
import { sessionLayout, missedRule } from "./engine/schedule.js";
import { walkSuggestion, finishedSessions } from "./engine/workout.js";
import { days } from "./plan/plan-v2.js";

export function dayLayout(doc, { planDay, week, today, kind = "full" }) {
  const lastFinished = finishedSessions(doc.sessions).find((s) => s.date < today);
  const missed = missedRule(lastFinished ? lastFinished.date : null, today);
  const walk = walkSuggestion(doc, { week, legDay: days[planDay].leg, missed, kind });
  const layout = sessionLayout(kind, week).map((b) => (b.id === "walk" ? { ...b, minutes: walk.minutes } : b));
  return { layout, minutes: layout.reduce((n, b) => n + b.minutes, 0), walk };
}
